/**
 * vlr_poc responsive audit harness.
 *
 * For each (route × viewport) pair:
 *   1. Launches headless Chromium at the viewport size.
 *   2. Navigates to the dev server (or production URL via --base-url).
 *   3. Captures a full-page PNG screenshot.
 *   4. Runs in-page JS measurements: overflow, tap-target sizes,
 *      small-text count, chart sizing, console errors.
 *   5. Writes everything to responsive-audit/screenshots/<viewport>/<route>.png
 *      and responsive-audit/report.json.
 *
 * Usage:
 *   node responsive-audit/run.mjs                       # full matrix
 *   node responsive-audit/run.mjs --viewport=mobile-s   # one viewport
 *   node responsive-audit/run.mjs --route=overview      # one route
 *   node responsive-audit/run.mjs --base-url=https://nexusgovernance.eu/vlr-observatory/
 *
 * Reuses Playwright's bundled headless chromium so no system browser
 * dependency on the host.
 */

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = __dirname;
const SHOT_DIR = join(OUT_DIR, 'screenshots');

const VIEWPORTS = [
  { name: 'mobile-s', width: 375, height: 667, label: 'iPhone SE' },
  { name: 'mobile-l', width: 414, height: 896, label: 'iPhone 14 Pro' },
  { name: 'ipad-portrait', width: 768, height: 1024, label: 'iPad mini' },
  { name: 'ipad-landscape', width: 1024, height: 1366, label: 'iPad Pro' },
  { name: 'desktop', width: 1440, height: 900, label: 'Desktop baseline' },
];

// React-Router hash routes used by Root.tsx
const ROUTES = [
  { name: 'overview', hash: '/' },
  { name: 'sdg-coverage', hash: '/sdg-coverage' },
  { name: 'policy-actions', hash: '/policy-actions' },
  { name: 'challenges-barriers', hash: '/challenges-barriers' },
  { name: 'commitments', hash: '/commitment-statements' },
  { name: 'methodology', hash: '/methodology' },
];

// ---------------------------------------------------------------------------
// CLI parsing
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const argMap = Object.fromEntries(
  args
    .filter((a) => a.startsWith('--'))
    .map((a) => {
      const [k, v] = a.replace(/^--/, '').split('=');
      return [k, v ?? true];
    }),
);
const baseUrl =
  argMap['base-url'] || 'http://localhost:5173/vlr-observatory/';
const viewportFilter = argMap.viewport;
const routeFilter = argMap.route;

const viewports = viewportFilter
  ? VIEWPORTS.filter((v) => v.name === viewportFilter)
  : VIEWPORTS;
const routes = routeFilter
  ? ROUTES.filter((r) => r.name === routeFilter)
  : ROUTES;

if (viewports.length === 0) {
  console.error(`Unknown viewport: ${viewportFilter}`);
  process.exit(1);
}
if (routes.length === 0) {
  console.error(`Unknown route: ${routeFilter}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// In-page measurement code (stringified, runs inside the page)
// ---------------------------------------------------------------------------
const MEASURE_FN = () => {
  const result = {
    overflow: {
      horizontal:
        document.documentElement.scrollWidth > window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    },
    tapTargets: { failures: [], totalChecked: 0 },
    smallText: { count: 0, samples: [] },
    charts: { issues: [], totalChecked: 0 },
    consoleErrors: [], // populated by Node side
  };

  // ── Tap targets ──
  const interactive = document.querySelectorAll(
    'button, a, [role="button"], input[type="button"], input[type="submit"], [role="link"], [role="tab"]',
  );
  for (const el of interactive) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue; // hidden
    result.tapTargets.totalChecked++;
    if (rect.width < 44 || rect.height < 44) {
      // Exclude inline text-only links (anchors inside paragraph-style flow)
      const isInlineLink =
        el.tagName === 'A' &&
        getComputedStyle(el).display === 'inline' &&
        el.textContent.length > 0;
      if (isInlineLink) continue;
      // Exclude exit-the-app anchor links — brand wordmarks pointing home,
      // mailto, tel, cross-host. The SPA lives under /vlr-observatory/; any
      // anchor that navigates outside that prefix is an exit affordance, not
      // a primary in-app action, and has its own tap-target expectations on
      // the destination site.
      if (el.tagName === 'A' && el.href) {
        try {
          const dest = new URL(el.href, window.location.href);
          const isExternalOrigin = dest.origin !== window.location.origin;
          const isNonHttp = dest.protocol === 'mailto:' || dest.protocol === 'tel:';
          const isOutsideSpa =
            dest.origin === window.location.origin &&
            !dest.pathname.startsWith('/vlr-observatory');
          if (isExternalOrigin || isNonHttp || isOutsideSpa) continue;
        } catch {}
      }
      result.tapTargets.failures.push({
        tag: el.tagName,
        text: (el.textContent || '').trim().slice(0, 40),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });
    }
  }
  // Cap reported failures to first 20 (keep report.json size sane)
  result.tapTargets.failures = result.tapTargets.failures.slice(0, 20);

  // ── Small text (<11px visible) ──
  const allEls = document.querySelectorAll('*');
  const seen = new Set();
  for (const el of allEls) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const fs = parseFloat(cs.fontSize);
    if (!isFinite(fs) || fs >= 11) continue;
    // Only count if element actually has text content of its own
    const ownText = Array.from(el.childNodes)
      .filter((n) => n.nodeType === 3) // text node
      .map((n) => n.textContent.trim())
      .join('');
    if (!ownText) continue;
    result.smallText.count++;
    const sig = `${ownText.slice(0, 30)}_${fs}`;
    if (!seen.has(sig) && result.smallText.samples.length < 10) {
      seen.add(sig);
      result.smallText.samples.push({
        text: ownText.slice(0, 40),
        fontSize: Math.round(fs * 10) / 10,
      });
    }
  }

  // ── Charts (Recharts wrappers) ──
  const charts = document.querySelectorAll('.recharts-wrapper');
  const maxAllowedH = Math.round(window.innerHeight * 0.7);
  for (const chart of charts) {
    result.charts.totalChecked++;
    const rect = chart.getBoundingClientRect();
    const parent = chart.parentElement;
    const parentW = parent
      ? parent.getBoundingClientRect().width
      : window.innerWidth;
    const widthMismatch = Math.abs(rect.width - parentW) > 2;
    const tooTall = rect.height > maxAllowedH;
    if (widthMismatch || tooTall) {
      result.charts.issues.push({
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        parentWidth: Math.round(parentW),
        widthMismatch,
        tooTall,
        maxAllowedH,
      });
    }
  }
  // Cap chart-issue list too
  result.charts.issues = result.charts.issues.slice(0, 10);

  return result;
};

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
async function run() {
  // Clean previous run
  try {
    rmSync(SHOT_DIR, { recursive: true });
  } catch {}
  mkdirSync(SHOT_DIR, { recursive: true });

  console.log(
    `Auditing ${viewports.length} viewport(s) × ${routes.length} route(s) against ${baseUrl}`,
  );

  const browser = await chromium.launch({ headless: true });
  const reportRows = [];
  const startedAt = new Date().toISOString();
  let failCount = 0;

  for (const vp of viewports) {
    mkdirSync(join(SHOT_DIR, vp.name), { recursive: true });
    for (const route of routes) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 2, // crisp PNGs
      });
      // Bypass AccessGate (src/app/components/AccessGate.tsx): the component
      // reads localStorage["nexus_access_granted_v1"] and short-circuits to
      // null when it's set. Seed a synthetic grant before any page script runs.
      await context.addInitScript(() => {
        try {
          localStorage.setItem(
            'nexus_access_granted_v1',
            JSON.stringify({
              full_name: 'Audit Robot',
              email: 'audit@example.com',
              organisation: 'Internal (responsive audit)',
              consent_outreach: true,
              consent_marketing: false,
              source: 'observatory',
              submitted_at: new Date().toISOString(),
            }),
          );
        } catch {}
      });
      const page = await context.newPage();

      const consoleErrors = [];
      page.on('pageerror', (err) =>
        consoleErrors.push({ kind: 'pageerror', text: err.message }),
      );
      page.on('console', (msg) => {
        if (msg.type() === 'error')
          consoleErrors.push({ kind: 'console.error', text: msg.text() });
      });

      const url = `${baseUrl}#${route.hash}`;
      let nav = 'ok';
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        // Give charts/animations a moment
        await page.waitForTimeout(800);
      } catch (e) {
        nav = `error: ${e.message.slice(0, 100)}`;
      }

      const measurements = await page.evaluate(MEASURE_FN).catch((e) => ({
        error: e.message,
      }));
      measurements.consoleErrors = consoleErrors.slice(0, 10);

      const shotPath = join(SHOT_DIR, vp.name, `${route.name}.png`);
      try {
        await page.screenshot({ path: shotPath, fullPage: true });
      } catch (e) {
        console.warn(`screenshot failed ${vp.name}/${route.name}: ${e.message}`);
      }

      const summary = {
        route: route.name,
        viewport: vp.name,
        viewportSize: `${vp.width}×${vp.height}`,
        viewportLabel: vp.label,
        nav,
        screenshot: `screenshots/${vp.name}/${route.name}.png`,
        overflow: measurements.overflow,
        tapTargetFailures: measurements.tapTargets?.failures?.length ?? 'n/a',
        tapTargetSample: measurements.tapTargets?.failures?.slice(0, 3) ?? [],
        smallTextCount: measurements.smallText?.count ?? 'n/a',
        smallTextSamples: measurements.smallText?.samples ?? [],
        chartIssues: measurements.charts?.issues?.length ?? 'n/a',
        chartIssueSamples: measurements.charts?.issues?.slice(0, 2) ?? [],
        consoleErrorCount: consoleErrors.length,
        consoleErrors: consoleErrors.slice(0, 3),
      };

      const isFail =
        measurements.overflow?.horizontal ||
        (Array.isArray(measurements.tapTargets?.failures) &&
          measurements.tapTargets.failures.length > 0) ||
        consoleErrors.length > 0 ||
        (Array.isArray(measurements.charts?.issues) &&
          measurements.charts.issues.length > 0);
      if (isFail) failCount++;

      reportRows.push(summary);
      console.log(
        `  ${isFail ? '✗' : '✓'} ${vp.name.padEnd(15)} ${route.name.padEnd(22)} overflow=${measurements.overflow?.horizontal} taps=${summary.tapTargetFailures} text<11px=${summary.smallTextCount} charts=${summary.chartIssues} errors=${consoleErrors.length}`,
      );

      await context.close();
    }
  }

  await browser.close();

  const report = {
    startedAt,
    finishedAt: new Date().toISOString(),
    baseUrl,
    viewports: viewports.map((v) => v.name),
    routes: routes.map((r) => r.name),
    failCount,
    totalCells: reportRows.length,
    rows: reportRows,
  };
  writeFileSync(join(OUT_DIR, 'report.json'), JSON.stringify(report, null, 2));
  console.log(
    `\nReport: ${join(OUT_DIR, 'report.json')}  (${failCount}/${reportRows.length} cells with issues)`,
  );

  // Exit code reflects whether any cell had a hard failure
  process.exit(failCount > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(2);
});
