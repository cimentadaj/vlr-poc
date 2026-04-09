import { useMemo } from 'react';
import { Link } from 'react-router';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  FileText,
  Globe,
  Layers,
  MapPin,
  TrendingUp,
  ArrowRight,
  BarChart3,
  AlertTriangle,
  Target,
} from 'lucide-react';
import { REGIONS, CHALLENGE_CATEGORIES, getSDGName } from './data/constants';
import metadataRaw from '@/data/generated/metadata.json';
import coverageRaw from '@/data/generated/sdg-coverage.json';
import policyRaw from '@/data/generated/policy-distribution.json';
import challengeRaw from '@/data/generated/challenge-distribution.json';
import commitmentRaw from '@/data/generated/commitment-distribution.json';
import temporalRaw from '@/data/generated/temporal-trends.json';
import countryRaw from '@/data/generated/country-stats.json';

type DistItem = { sdgId: number; categoryId: string; region: string; year: number; count: number };
type CoverageRow = { sdgId: number; region: string; year: number; vlrCount: number; totalDocs: number; coverage: number };
type TemporalItem = { itemType: string; categoryId: string; year: number; count: number };
type CountryItem = { country: string; region: string; docCount: number; itemCount: number };

const policyData = policyRaw as DistItem[];
const challengeData = challengeRaw as DistItem[];
const commitmentData = commitmentRaw as DistItem[];
const coverageData = coverageRaw as CoverageRow[];
const temporalData = temporalRaw as TemporalItem[];
const countryData = countryRaw as CountryItem[];

const challengeIdToName: Record<string, string> = Object.fromEntries(
  CHALLENGE_CATEGORIES.map(c => [c.id, c.name])
);
const challengeIdToColor: Record<string, string> = Object.fromEntries(
  CHALLENGE_CATEGORIES.map(c => [c.id, c.color])
);

export function Overview() {
  // ── Pipeline Stats ──
  const stats = useMemo(() => {
    const totalDocs = metadataRaw.docCountsByRegionYear.reduce((s: number, d: any) => s + d.docCount, 0);
    const totalPolicyItems = policyData.reduce((s, d) => s + d.count, 0);
    const totalChallengeItems = challengeData.reduce((s, d) => s + d.count, 0);
    const totalCommitmentItems = commitmentData.reduce((s, d) => s + d.count, 0);
    const totalItems = totalPolicyItems + totalChallengeItems + totalCommitmentItems;
    const totalCountries = countryData.length;
    const totalRegions = metadataRaw.regions.length;

    const policyPct = totalItems > 0 ? Math.round((totalPolicyItems / totalItems) * 1000) / 10 : 0;
    const commitmentPct = totalItems > 0 ? Math.round((totalCommitmentItems / totalItems) * 1000) / 10 : 0;
    const challengePct = totalItems > 0 ? Math.round((totalChallengeItems / totalItems) * 1000) / 10 : 0;

    return {
      totalDocs, totalItems, totalCountries, totalRegions,
      totalPolicyItems, totalChallengeItems, totalCommitmentItems,
      policyPct, commitmentPct, challengePct,
    };
  }, []);

  // ── Regional Challenge Profiles ──
  const regionalProfiles = useMemo(() => {
    return REGIONS.map(region => {
      const regionItems = challengeData.filter(d => d.region === region);
      const total = regionItems.reduce((s, d) => s + d.count, 0);
      if (total === 0) return { region, dominant: 'N/A', dominantId: '', pct: 0 };

      const byCat: Record<string, number> = {};
      for (const item of regionItems) {
        byCat[item.categoryId] = (byCat[item.categoryId] || 0) + item.count;
      }

      const [dominantId, dominantCount] = Object.entries(byCat)
        .filter(([k]) => k !== 'other_challenge')
        .sort((a, b) => b[1] - a[1])[0] || ['', 0];

      return {
        region,
        dominant: challengeIdToName[dominantId] || dominantId,
        dominantId,
        pct: Math.round((dominantCount / total) * 1000) / 10,
        color: challengeIdToColor[dominantId] || '#94a3b8',
      };
    });
  }, []);

  // ── SDG Highlights ──
  const sdgHighlights = useMemo(() => {
    // Most reported SDG by total items across all distributions
    const sdgTotals: Record<number, number> = {};
    for (const d of [...policyData, ...challengeData, ...commitmentData]) {
      sdgTotals[d.sdgId] = (sdgTotals[d.sdgId] || 0) + d.count;
    }
    const mostReportedId = Object.entries(sdgTotals).sort((a, b) => b[1] - a[1])[0];

    // Most skipped SDG: lowest overall coverage
    const sdgCoverage: Record<number, { vlrs: number; docs: number }> = {};
    for (const d of coverageData) {
      if (!sdgCoverage[d.sdgId]) sdgCoverage[d.sdgId] = { vlrs: 0, docs: 0 };
      sdgCoverage[d.sdgId].vlrs += d.vlrCount;
      sdgCoverage[d.sdgId].docs += d.totalDocs;
    }
    const coverageList = Object.entries(sdgCoverage).map(([id, v]) => ({
      sdgId: Number(id),
      coverage: v.docs > 0 ? Math.round((v.vlrs / v.docs) * 100) : 0,
    })).sort((a, b) => a.coverage - b.coverage);
    const mostSkipped = coverageList[0];

    // Hardest SDGs: highest challenge-to-policy ratio
    const sdgChallenges: Record<number, number> = {};
    const sdgPolicies: Record<number, number> = {};
    for (const d of challengeData) sdgChallenges[d.sdgId] = (sdgChallenges[d.sdgId] || 0) + d.count;
    for (const d of policyData) sdgPolicies[d.sdgId] = (sdgPolicies[d.sdgId] || 0) + d.count;
    const hardestSDGs = Object.entries(sdgChallenges)
      .map(([id, cCount]) => ({
        sdgId: Number(id),
        ratio: sdgPolicies[Number(id)] > 0 ? Math.round((cCount / sdgPolicies[Number(id)]) * 100) / 100 : 0,
      }))
      .filter(d => d.ratio > 0)
      .sort((a, b) => b.ratio - a.ratio)
      .slice(0, 2);

    return {
      mostReported: mostReportedId ? { sdgId: Number(mostReportedId[0]), count: mostReportedId[1] } : null,
      mostSkipped,
      hardestSDGs,
    };
  }, []);

  // ── VLR Movement Growth ──
  const growthData = useMemo(() => {
    // Docs per year
    const docsByYear: Record<number, number> = {};
    for (const d of metadataRaw.docCountsByRegionYear) {
      docsByYear[d.year] = (docsByYear[d.year] || 0) + d.docCount;
    }

    // Challenge % of total items per year
    const yearTotals: Record<number, number> = {};
    const yearChallenges: Record<number, number> = {};
    for (const d of temporalData) {
      yearTotals[d.year] = (yearTotals[d.year] || 0) + d.count;
    }
    for (const d of temporalData.filter(t => t.itemType === 'Challenge')) {
      yearChallenges[d.year] = (yearChallenges[d.year] || 0) + d.count;
    }

    // SDGs covered per year (any region)
    const sdgsByYear: Record<number, Set<number>> = {};
    for (const d of coverageData) {
      if (d.vlrCount > 0) {
        if (!sdgsByYear[d.year]) sdgsByYear[d.year] = new Set();
        sdgsByYear[d.year].add(d.sdgId);
      }
    }

    const years = metadataRaw.years as number[];
    const docsPerYear = years.map(y => ({
      year: y,
      docs: docsByYear[y] || 0,
      challengePct: yearTotals[y] > 0 ? Math.round(((yearChallenges[y] || 0) / yearTotals[y]) * 1000) / 10 : 0,
      sdgsCovered: sdgsByYear[y]?.size || 0,
    }));

    // Earliest and latest challenge %
    const withData = docsPerYear.filter(d => d.docs > 0 && d.challengePct > 0);
    const earliest = withData[0];
    const latest = withData[withData.length - 1];

    return { docsPerYear, earliest, latest };
  }, []);

  // ── Most Detailed Country ──
  const mostDetailedCountry = useMemo(() => {
    const withAvg = countryData
      .filter(c => c.docCount >= 3) // minimum 3 docs for meaningful average
      .map(c => ({
        ...c,
        itemsPerDoc: Math.round(c.itemCount / c.docCount),
      }))
      .sort((a, b) => b.itemsPerDoc - a.itemsPerDoc);
    return withAvg[0] || null;
  }, []);

  // ── Latest Year Stats ──
  const latestYear = useMemo(() => {
    const years = metadataRaw.years as number[];
    const latest = years[years.length - 1];
    const docs = metadataRaw.docCountsByRegionYear
      .filter((d: any) => d.year === latest)
      .reduce((s: number, d: any) => s + d.docCount, 0);
    return { year: latest, docs };
  }, []);

  return (
    <div className="w-full bg-slate-50">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            VLR Meta-Analysis Overview
          </h1>
          <p className="text-lg text-slate-600">
            Key findings from {stats.totalDocs.toLocaleString()} Voluntary Local Reviews across {stats.totalCountries} countries
          </p>
        </div>

        {/* Pipeline Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { icon: FileText, label: 'Documents', value: stats.totalDocs.toLocaleString(), color: 'text-blue-600', bg: 'bg-blue-50' },
            { icon: Layers, label: 'Extracted Items', value: stats.totalItems.toLocaleString(), color: 'text-purple-600', bg: 'bg-purple-50' },
            { icon: Globe, label: 'Countries', value: stats.totalCountries.toString(), color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { icon: MapPin, label: 'Regions', value: stats.totalRegions.toString(), color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
              <div className={`inline-flex p-2 rounded-lg ${stat.bg} mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="text-3xl font-bold text-slate-900 tabular-nums">{stat.value}</div>
              <div className="text-sm text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Category Split */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">What Do VLRs Contain?</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[
              { label: 'Policy Actions', pct: stats.policyPct, count: stats.totalPolicyItems, color: '#3b82f6' },
              { label: 'Commitments', pct: stats.commitmentPct, count: stats.totalCommitmentItems, color: '#f59e0b' },
              { label: 'Challenges', pct: stats.challengePct, count: stats.totalChallengeItems, color: '#ef4444' },
            ].map(cat => (
              <div key={cat.label} className="text-center">
                <div className="text-3xl font-bold text-slate-900 tabular-nums">{cat.pct}%</div>
                <div className="text-sm text-slate-600">{cat.label}</div>
                <div className="text-xs text-slate-400 tabular-nums">{cat.count.toLocaleString()} items</div>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full" style={{ width: `${cat.pct}%`, backgroundColor: cat.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Regional Challenge Profiles */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Regional Challenge Profiles</h2>
          <p className="text-sm text-slate-500 mb-4">Each region's dominant challenge — the type of barrier cities cite most frequently</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {regionalProfiles.map(rp => (
              <div key={rp.region} className="rounded-xl border border-slate-200 p-4">
                <div className="text-sm font-semibold text-slate-900 mb-2">{rp.region}</div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: rp.color }} />
                  <span className="text-sm text-slate-700 leading-tight">{rp.dominant}</span>
                </div>
                <div className="text-xs text-slate-500 tabular-nums">{rp.pct}% of challenges</div>
              </div>
            ))}
          </div>
        </div>

        {/* SDG Highlights */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">SDG Highlights</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sdgHighlights.mostReported && (
              <div className="border-l-4 border-blue-500 pl-4">
                <div className="text-sm text-slate-500 mb-1">Most Reported SDG</div>
                <div className="text-xl font-bold text-slate-900">
                  SDG {sdgHighlights.mostReported.sdgId} — {getSDGName(sdgHighlights.mostReported.sdgId)}
                </div>
                <div className="text-sm text-blue-600 tabular-nums">
                  {sdgHighlights.mostReported.count.toLocaleString()} total items
                </div>
              </div>
            )}
            {sdgHighlights.mostSkipped && (
              <div className="border-l-4 border-amber-500 pl-4">
                <div className="text-sm text-slate-500 mb-1">Most Skipped SDG</div>
                <div className="text-xl font-bold text-slate-900">
                  SDG {sdgHighlights.mostSkipped.sdgId} — {getSDGName(sdgHighlights.mostSkipped.sdgId)}
                </div>
                <div className="text-sm text-amber-600">
                  Only {sdgHighlights.mostSkipped.coverage}% of VLRs address it
                </div>
              </div>
            )}
            {sdgHighlights.hardestSDGs.length > 0 && (
              <div className="border-l-4 border-red-500 pl-4">
                <div className="text-sm text-slate-500 mb-1">Hardest Problems</div>
                <div className="text-xl font-bold text-slate-900">
                  {sdgHighlights.hardestSDGs.map(s => `SDG ${s.sdgId}`).join(' & ')}
                </div>
                <div className="text-sm text-red-600">
                  Highest challenge-to-policy ratio ({sdgHighlights.hardestSDGs[0].ratio}x)
                </div>
              </div>
            )}
          </div>
        </div>

        {/* VLR Movement Growth */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">VLR Movement Growth</h2>
          <p className="text-sm text-slate-500 mb-4">The VLR movement is accelerating — {latestYear.year} has the most documents ({latestYear.docs})</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Docs per year chart */}
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-3">Documents Published Per Year</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={growthData.docsPerYear.filter(d => d.docs > 0)} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="#64748b" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#64748b" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                    formatter={(v: any) => [`${v} documents`, 'Published']}
                  />
                  <Area type="monotone" dataKey="docs" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Key trends */}
            <div className="space-y-4">
              {growthData.earliest && growthData.latest && (
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-slate-900">Challenge Reporting Growth</span>
                  </div>
                  <div className="text-sm text-slate-600">
                    Cities are getting more honest about their challenges: from{' '}
                    <span className="font-bold tabular-nums">{growthData.earliest.challengePct}%</span> ({growthData.earliest.year}) to{' '}
                    <span className="font-bold tabular-nums">{growthData.latest.challengePct}%</span> ({growthData.latest.year}) of all extracted items.
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-slate-900">SDG Coverage Breadth</span>
                </div>
                <div className="text-sm text-slate-600">
                  {(() => {
                    const recent = growthData.docsPerYear.filter(d => d.year >= 2019 && d.sdgsCovered > 0);
                    const avgCov = recent.length > 0 ? Math.round(recent.reduce((s, d) => s + d.sdgsCovered, 0) / recent.length) : 0;
                    return `SDG coverage has stabilized at ${avgCov} of 17 goals since 2019, up from early years when only a handful were addressed.`;
                  })()}
                </div>
              </div>

              {mostDetailedCountry && (
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Globe className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-semibold text-slate-900">Most Detailed VLRs</span>
                  </div>
                  <div className="text-sm text-slate-600">
                    <span className="font-bold">{mostDetailedCountry.country}</span> cities produce the most detailed VLRs with an average of{' '}
                    <span className="font-bold tabular-nums">{mostDetailedCountry.itemsPerDoc.toLocaleString()}</span> items per document across {mostDetailedCountry.docCount} VLRs.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Links to Views */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { to: '/sdg-coverage', icon: BarChart3, label: 'SDG Coverage Analysis', desc: 'What % of VLRs address each SDG?', color: 'text-blue-600' },
            { to: '/policy-actions', icon: FileText, label: 'Policy Actions', desc: 'How cities implement policies across SDGs', color: 'text-purple-600' },
            { to: '/challenges-barriers', icon: AlertTriangle, label: 'Challenges & Barriers', desc: 'What constrains SDG implementation?', color: 'text-amber-600' },
          ].map(link => (
            <Link
              key={link.to}
              to={link.to}
              className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 hover:shadow-md hover:border-slate-300 transition-all group"
            >
              <div className="flex items-center gap-3 mb-2">
                <link.icon className={`w-5 h-5 ${link.color}`} />
                <span className="font-semibold text-slate-900">{link.label}</span>
                <ArrowRight className="w-4 h-4 text-slate-400 ml-auto group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-sm text-slate-500">{link.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
