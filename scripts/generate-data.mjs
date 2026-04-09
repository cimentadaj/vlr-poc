import pg from 'pg';
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'src', 'data', 'generated');

// ---------------------------------------------------------------------------
// Category tag mapping: DB category_tag string → frontend category ID
// ---------------------------------------------------------------------------
const CATEGORY_MAP = {
  // Challenges
  'Fiscal & Financial Constraints': 'fiscal_financial',
  'Institutional & Governance Weaknesses': 'institutional_governance',
  'Legal & Regulatory Gaps': 'legal_regulatory',
  'Human Capacity & Technical Skills Deficits': 'human_capacity',
  'Data Monitoring & Evidence Gaps': 'data_monitoring',
  'Multi-Level Governance & Coordination Failures': 'multilevel_governance',
  'Policy Coherence & Integration Deficits': 'policy_coherence',
  'Political Will & Continuity Risks': 'political_will',
  'Stakeholder Engagement & Participation Deficits': 'stakeholder_engagement',
  'External Shocks & Contextual Pressures': 'external_shocks',
  'Socioeconomic Conditions & Inequality': 'socioeconomic',
  // Policies
  'Information, Awareness & Capacity Building': 'information_awareness',
  'Public Investment & Procurement': 'public_investment',
  'Economic & Fiscal Instruments': 'economic_fiscal',
  'Voluntary & Partnership Approaches': 'voluntary_partnership',
  'Strategic Planning & Policy Frameworks': 'strategic_planning',
  'Monitoring, Evaluation & Data Systems': 'monitoring_evaluation',
  'Regulation & Standards': 'regulation_standards',
  // Commitments
  'Strategy & Plan Development': 'strategy_plan',
  'Regulatory & Legislative Reform': 'regulatory_reform',
  'Capital Investment & Infrastructure': 'capital_investment',
  'Programme & Service Launch': 'programme_service',
  'Institutional Restructuring & Capacity Building': 'institutional_capacity',
  'Data Monitoring & Reporting Systems': 'data_reporting',
  'Partnership & Collaboration': 'partnership_collaboration',
  'Target & Goal Declaration': 'target_goal',
  // Shared
  'Other': 'other',
};

function mapCategory(tag, itemType) {
  if (!tag) return null;
  const mapped = CATEGORY_MAP[tag];
  if (!mapped) return null;
  // "Other" needs a suffix based on item type
  if (mapped === 'other') {
    const suffix = { Policy: 'other_policy', Challenge: 'other_challenge', Commitment: 'other_commitment' };
    return suffix[itemType] || mapped;
  }
  return mapped;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    // Try reading from .env.local
    const { readFileSync } = await import('fs');
    try {
      const envContent = readFileSync(join(__dirname, '..', '.env.local'), 'utf-8');
      const match = envContent.match(/^DATABASE_URL=(.+)$/m);
      if (match) process.env.DATABASE_URL = match[1].trim();
    } catch { /* ignore */ }
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('ERROR: DATABASE_URL not set. Create .env.local or set it as an environment variable.');
    process.exit(1);
  }

  // DigitalOcean managed Postgres uses a self-signed CA; skip verification
  const pool = new pg.Pool({
    connectionString: connectionString.replace('sslmode=require', 'sslmode=no-verify'),
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('Connecting to database...');
    await pool.query('SELECT 1');
    console.log('Connected.');

    mkdirSync(OUT_DIR, { recursive: true });

    await Promise.all([
      generateMetadata(pool),
      generateSDGCoverage(pool),
      generateSDGDepth(pool),
      generateItemDistribution(pool, 'Policy', 'policy-distribution.json'),
      generateItemDistribution(pool, 'Challenge', 'challenge-distribution.json'),
      generateItemDistribution(pool, 'Commitment', 'commitment-distribution.json'),
      generateTemporalTrends(pool),
      generateEvidenceQuotes(pool),
      generateCountryStats(pool),
    ]);

    console.log('All data generated successfully.');
  } finally {
    await pool.end();
  }
}

// ---------------------------------------------------------------------------
// Query 1: Metadata
// ---------------------------------------------------------------------------
async function generateMetadata(pool) {
  const { rows } = await pool.query(`
    SELECT region, year, COUNT(*) as doc_count
    FROM vlr_raw_docs
    WHERE region IS NOT NULL AND year IS NOT NULL
    GROUP BY region, year
    ORDER BY region, year
  `);

  const regions = [...new Set(rows.map(r => r.region))].sort();
  const years = [...new Set(rows.map(r => r.year))].sort((a, b) => a - b);

  const result = {
    regions,
    years,
    docCountsByRegionYear: rows.map(r => ({
      region: r.region,
      year: Number(r.year),
      docCount: Number(r.doc_count),
    })),
  };

  writeJSON('metadata.json', result);
}

// ---------------------------------------------------------------------------
// Query 2: SDG Coverage
// ---------------------------------------------------------------------------
async function generateSDGCoverage(pool) {
  const { rows } = await pool.query(`
    WITH doc_totals AS (
      SELECT region, year, COUNT(*) as total
      FROM vlr_raw_docs
      WHERE region IS NOT NULL AND year IS NOT NULL
      GROUP BY region, year
    )
    SELECT
      s.sdg_tag::int as sdg_id,
      d.region,
      d.year,
      COUNT(DISTINCT d.id) as vlr_count,
      dt.total as total_docs,
      ROUND(COUNT(DISTINCT d.id)::numeric / dt.total * 100, 1) as coverage
    FROM vlr_slices s
    JOIN vlr_raw_docs d ON d.id = s.raw_doc_id
    JOIN doc_totals dt ON dt.region = d.region AND dt.year = d.year
    WHERE s.sdg_tag ~ '^\\d+$'
      AND d.region IS NOT NULL
      AND d.year IS NOT NULL
    GROUP BY s.sdg_tag::int, d.region, d.year, dt.total
    ORDER BY sdg_id, d.region, d.year
  `);

  const result = rows.map(r => ({
    sdgId: Number(r.sdg_id),
    region: r.region,
    year: Number(r.year),
    vlrCount: Number(r.vlr_count),
    totalDocs: Number(r.total_docs),
    coverage: Number(r.coverage),
  }));

  writeJSON('sdg-coverage.json', result);
}

// ---------------------------------------------------------------------------
// Query 2b: SDG Depth (items per doc — the real engagement metric)
// ---------------------------------------------------------------------------
async function generateSDGDepth(pool) {
  const { rows } = await pool.query(`
    SELECT
      s.sdg_tag::int as sdg_id,
      d.region,
      d.year,
      COUNT(DISTINCT d.id) as doc_count,
      COUNT(i.id) as item_count
    FROM vlr_slices s
    JOIN vlr_raw_docs d ON d.id = s.raw_doc_id
    LEFT JOIN vlr_raw_items i ON i.slice_id = s.id
    WHERE s.sdg_tag ~ '^\\d+$'
      AND d.region IS NOT NULL
      AND d.year IS NOT NULL
    GROUP BY s.sdg_tag::int, d.region, d.year
    ORDER BY sdg_id, d.region, d.year
  `);

  const result = rows.map(r => ({
    sdgId: Number(r.sdg_id),
    region: r.region,
    year: Number(r.year),
    docCount: Number(r.doc_count),
    itemCount: Number(r.item_count),
  }));

  writeJSON('sdg-depth.json', result);
}

// ---------------------------------------------------------------------------
// Queries 3-5: Item Distribution (Policy / Challenge / Commitment)
// ---------------------------------------------------------------------------
async function generateItemDistribution(pool, itemType, filename) {
  const { rows } = await pool.query(`
    SELECT
      i.sdg_id,
      i.category_tag,
      d.region,
      d.year,
      COUNT(*) as item_count
    FROM vlr_raw_items i
    JOIN vlr_slices s ON s.id = i.slice_id
    JOIN vlr_raw_docs d ON d.id = s.raw_doc_id
    WHERE i.item_type = $1
      AND i.category_tag IS NOT NULL
      AND d.region IS NOT NULL
      AND d.year IS NOT NULL
    GROUP BY i.sdg_id, i.category_tag, d.region, d.year
    ORDER BY i.sdg_id, d.region, d.year
  `, [itemType]);

  const result = rows
    .map(r => {
      const categoryId = mapCategory(r.category_tag, itemType);
      if (!categoryId) return null;
      return {
        sdgId: Number(r.sdg_id),
        categoryId,
        region: r.region,
        year: Number(r.year),
        count: Number(r.item_count),
      };
    })
    .filter(Boolean);

  writeJSON(filename, result);
}

// ---------------------------------------------------------------------------
// Query 6: Temporal Trends
// ---------------------------------------------------------------------------
async function generateTemporalTrends(pool) {
  const { rows } = await pool.query(`
    SELECT
      i.item_type,
      i.category_tag,
      d.year,
      COUNT(*) as item_count
    FROM vlr_raw_items i
    JOIN vlr_slices s ON s.id = i.slice_id
    JOIN vlr_raw_docs d ON d.id = s.raw_doc_id
    WHERE i.category_tag IS NOT NULL
      AND d.year IS NOT NULL
    GROUP BY i.item_type, i.category_tag, d.year
    ORDER BY d.year
  `);

  const result = rows
    .map(r => {
      const categoryId = mapCategory(r.category_tag, r.item_type);
      if (!categoryId) return null;
      return {
        itemType: r.item_type,
        categoryId,
        year: Number(r.year),
        count: Number(r.item_count),
      };
    })
    .filter(Boolean);

  writeJSON('temporal-trends.json', result);
}

// ---------------------------------------------------------------------------
// Query 7: Evidence Quotes
// ---------------------------------------------------------------------------
async function generateEvidenceQuotes(pool) {
  // Get multiple quotes per item_type × category × SDG for variety
  const { rows } = await pool.query(`
    WITH ranked AS (
      SELECT
        i.item_type,
        i.category_tag,
        i.sdg_id,
        i.evidence_quote,
        i.category_confidence,
        d.city,
        d.country,
        d.region,
        d.year,
        ROW_NUMBER() OVER (
          PARTITION BY i.item_type, i.category_tag, i.sdg_id
          ORDER BY i.category_confidence DESC, LENGTH(i.evidence_quote) DESC
        ) as rn
      FROM vlr_raw_items i
      JOIN vlr_slices s ON s.id = i.slice_id
      JOIN vlr_raw_docs d ON d.id = s.raw_doc_id
      WHERE i.category_tag IS NOT NULL
        AND i.evidence_quote IS NOT NULL
        AND LENGTH(i.evidence_quote) > 30
        AND i.category_confidence >= 0.85
        AND d.region IS NOT NULL
        AND i.evidence_quote ~ '^[\\x20-\\x7E\\n\\r\\t]+$'
    )
    SELECT * FROM ranked WHERE rn <= 3
    ORDER BY item_type, category_tag, sdg_id, rn
  `);

  const result = rows
    .map(r => {
      const categoryId = mapCategory(r.category_tag, r.item_type);
      if (!categoryId) return null;
      return {
        itemType: r.item_type,
        categoryId,
        sdgId: Number(r.sdg_id),
        quote: r.evidence_quote,
        confidence: Number(r.category_confidence),
        city: r.city,
        country: r.country,
        region: r.region,
        year: Number(r.year),
      };
    })
    .filter(Boolean);

  writeJSON('evidence-quotes.json', result);
}

// ---------------------------------------------------------------------------
// Query 8: Country-level stats (for Overview page)
// ---------------------------------------------------------------------------
async function generateCountryStats(pool) {
  const { rows } = await pool.query(`
    SELECT
      d.country,
      d.region,
      COUNT(DISTINCT d.id) as doc_count,
      COUNT(i.id) as item_count
    FROM vlr_raw_docs d
    LEFT JOIN vlr_slices s ON s.raw_doc_id = d.id AND s.sdg_tag ~ '^\\d+$'
    LEFT JOIN vlr_raw_items i ON i.slice_id = s.id
    WHERE d.country IS NOT NULL AND d.region IS NOT NULL
    GROUP BY d.country, d.region
    ORDER BY item_count DESC
  `);

  const result = rows.map(r => ({
    country: r.country,
    region: r.region,
    docCount: Number(r.doc_count),
    itemCount: Number(r.item_count),
  }));

  writeJSON('country-stats.json', result);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function writeJSON(filename, data) {
  const path = join(OUT_DIR, filename);
  writeFileSync(path, JSON.stringify(data, null, 2));
  const size = (JSON.stringify(data).length / 1024).toFixed(1);
  console.log(`  ${filename} (${size} KB, ${Array.isArray(data) ? data.length + ' rows' : 'object'})`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
