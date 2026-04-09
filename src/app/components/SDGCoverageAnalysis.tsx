import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  Cell
} from 'recharts';
import { AlertCircle, TrendingUp, TrendingDown, Filter, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './ui/collapsible';
import { getSDGName } from './data/constants';
import coverageRaw from '@/data/generated/sdg-coverage.json';
import metadataRaw from '@/data/generated/metadata.json';

type CoverageRow = { sdgId: number; region: string; year: number; vlrCount: number; totalDocs: number; coverage: number };

const sdgs = Array.from({ length: 17 }, (_, i) => ({
  id: i + 1,
  name: `SDG ${i + 1}`,
  fullName: getSDGName(i + 1),
}));

const regions = metadataRaw.regions;
const years = metadataRaw.years;
const coverageData = coverageRaw as CoverageRow[];

// Compute coverage % for a set of coverage rows, aggregated by SDG
function computeCoverage(rows: CoverageRow[]): Array<{ sdgId: number; coverage: number; vlrCount: number; totalDocs: number }> {
  const bySDG: Record<number, { vlrs: number; docs: number }> = {};
  for (const r of rows) {
    if (!bySDG[r.sdgId]) bySDG[r.sdgId] = { vlrs: 0, docs: 0 };
    bySDG[r.sdgId].vlrs += r.vlrCount;
    bySDG[r.sdgId].docs += r.totalDocs;
  }

  return sdgs.map(sdg => {
    const d = bySDG[sdg.id];
    const coverage = d && d.docs > 0 ? Math.round((d.vlrs / d.docs) * 100) : 0;
    return { sdgId: sdg.id, coverage, vlrCount: d?.vlrs || 0, totalDocs: d?.docs || 0 };
  });
}

export function SDGCoverageAnalysis() {
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('All');
  const [view, setView] = useState<'heatmap' | 'trends'>('heatmap');
  const [strategicOpen, setStrategicOpen] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{region: string, sdg: number} | null>(null);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // Filter coverage data based on selections
  const filteredCoverage = useMemo(() => {
    let filtered = coverageData;
    if (selectedRegion !== 'All') filtered = filtered.filter(d => d.region === selectedRegion);
    if (selectedPeriod !== 'All') {
      const [start, end] = selectedPeriod.split('-').map(Number);
      filtered = filtered.filter(d => d.year >= start && d.year <= end);
    }
    return filtered;
  }, [selectedRegion, selectedPeriod]);

  // Coverage stats for bar chart (sorted by coverage descending)
  const sdgCoverageStats = useMemo(() => {
    const results = computeCoverage(filteredCoverage);
    return results
      .map(r => ({
        sdg: r.sdgId,
        name: `SDG ${r.sdgId} - ${getSDGName(r.sdgId)}`,
        coverage: r.coverage,
        vlrCount: r.vlrCount,
        totalDocs: r.totalDocs,
      }))
      .sort((a, b) => b.coverage - a.coverage);
  }, [filteredCoverage]);

  // Heatmap data: coverage % per region × SDG
  const heatmapData = useMemo(() => {
    const regionsToShow = selectedRegion === 'All' ? regions : [selectedRegion];
    const result: Array<{ region: string; sdg: number; sdgName: string; coverage: number }> = [];

    regionsToShow.forEach(region => {
      const regionRows = filteredCoverage.filter(d => d.region === region);
      sdgs.forEach(sdg => {
        const sdgRows = regionRows.filter(d => d.sdgId === sdg.id);
        const totalVLRs = sdgRows.reduce((s, d) => s + d.vlrCount, 0);
        const totalDocs = sdgRows.reduce((s, d) => s + d.totalDocs, 0);
        const coverage = totalDocs > 0 ? Math.round((totalVLRs / totalDocs) * 100) : 0;
        result.push({ region, sdg: sdg.id, sdgName: getSDGName(sdg.id), coverage });
      });
    });

    return result;
  }, [filteredCoverage, selectedRegion]);

  // Time trends: coverage % over years
  const trendData = useMemo(() => {
    const topSDGs = sdgCoverageStats.slice(0, 5).map(s => s.sdg);
    const bottomSDGs = sdgCoverageStats.slice(-3).map(s => s.sdg);
    const trendSDGs = [...topSDGs, ...bottomSDGs];

    return years.map(year => {
      const yearRows = filteredCoverage.filter(d => d.year === year);
      const yearData: any = { year };

      trendSDGs.forEach(sdgId => {
        const sdgRows = yearRows.filter(d => d.sdgId === sdgId);
        const totalVLRs = sdgRows.reduce((s, d) => s + d.vlrCount, 0);
        const totalDocs = sdgRows.reduce((s, d) => s + d.totalDocs, 0);
        yearData[`SDG${sdgId}`] = totalDocs > 0 ? Math.round((totalVLRs / totalDocs) * 100) : 0;
      });

      return yearData;
    });
  }, [filteredCoverage, sdgCoverageStats]);

  // Insights
  const insights = useMemo(() => {
    const mostReported = sdgCoverageStats[0];
    const leastReported = sdgCoverageStats[sdgCoverageStats.length - 1];
    const lowCoverage = sdgCoverageStats.filter(s => s.coverage < 30);

    // Trend: compare recent vs older coverage
    const recentRows = filteredCoverage.filter(d => d.year >= 2023);
    const olderRows = filteredCoverage.filter(d => d.year < 2020);
    const avgCov = (rows: CoverageRow[]) => {
      const vlrs = rows.reduce((s, d) => s + d.vlrCount, 0);
      const docs = rows.reduce((s, d) => s + d.totalDocs, 0);
      return docs > 0 ? (vlrs / docs) * 100 : 0;
    };
    const recentAvg = avgCov(recentRows);
    const olderAvg = avgCov(olderRows);
    const trend = recentAvg > olderAvg ? 'increasing' : 'decreasing';
    const trendChange = olderAvg > 0 ? Math.abs(Math.round(((recentAvg - olderAvg) / olderAvg) * 100)) : 0;

    // Find the fastest-rising SDG
    const perSDGTrend = sdgs.map(sdg => {
      const older = filteredCoverage.filter(d => d.sdgId === sdg.id && d.year < 2020);
      const recent = filteredCoverage.filter(d => d.sdgId === sdg.id && d.year >= 2023);
      const olderCov = avgCov(older);
      const recentCov = avgCov(recent);
      const pctChange = olderCov > 0 ? Math.round(((recentCov - olderCov) / olderCov) * 100) : 0;
      return { sdgId: sdg.id, name: getSDGName(sdg.id), pctChange };
    }).filter(s => s.pctChange !== 0);
    const fastestRising = perSDGTrend.length > 0 ? perSDGTrend.sort((a, b) => b.pctChange - a.pctChange)[0] : null;

    // Coverage gap
    const coverageGap = leastReported.coverage > 0 ? Math.round(mostReported.coverage / leastReported.coverage) : null;

    return { mostReported, leastReported, lowCoverage, trend, trendChange, fastestRising, coverageGap };
  }, [sdgCoverageStats, filteredCoverage]);

  // Coverage color scale
  const getCoverageColor = (coverage: number) => {
    if (coverage >= 90) return '#059669';
    if (coverage >= 70) return '#10b981';
    if (coverage >= 50) return '#fbbf24';
    if (coverage >= 30) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="w-full h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            SDG Coverage Analysis
          </h1>
          <p className="text-lg text-slate-600">
            What percentage of VLRs address each SDG across regions?
          </p>
        </div>

        {/* Key Insights Panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Key Findings</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border-l-4 border-green-500 pl-4">
              <div className="text-sm text-slate-600 mb-1">Highest Coverage</div>
              <div className="text-2xl font-bold text-slate-900">{insights.mostReported.name}</div>
              <div className="text-sm text-green-600 font-medium">
                {insights.mostReported.coverage}% of VLRs
                {insights.coverageGap ? ` · ${insights.coverageGap}× more than the least-covered SDG` : ''}
              </div>
            </div>
            <div className="border-l-4 border-amber-500 pl-4">
              <div className="text-sm text-slate-600 mb-1">Fastest Rising</div>
              {insights.fastestRising ? (
                <>
                  <div className="text-2xl font-bold text-slate-900">{insights.fastestRising.name}</div>
                  <div className="flex items-center gap-1 text-sm text-amber-600 font-medium">
                    <TrendingUp className="w-4 h-4" />
                    {insights.fastestRising.pctChange}% growth since pre-2020
                  </div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-slate-900">—</div>
                  <div className="text-sm text-slate-500">Not enough data for trend</div>
                </>
              )}
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <div className="text-sm text-slate-600 mb-1">Overall Coverage Trend</div>
              <div className="flex items-center gap-2">
                {insights.trend === 'increasing' ? (
                  <TrendingUp className="w-6 h-6 text-green-600" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-600" />
                )}
                <div className="text-2xl font-bold text-slate-900 capitalize">{insights.trend}</div>
              </div>
              <div className={`text-sm font-medium ${insights.trend === 'increasing' ? 'text-green-600' : 'text-red-600'}`}>
                {insights.trendChange}% change since pre-2020
              </div>
            </div>
          </div>

          {insights.lowCoverage.length > 0 && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-amber-900 mb-1">Low Coverage SDGs (&lt; 30%)</div>
                  <div className="text-sm text-amber-800">
                    {insights.lowCoverage.length} SDG{insights.lowCoverage.length > 1 ? 's' : ''}: {' '}
                    {insights.lowCoverage.map(s => s.name).join(', ')}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Filters:</span>
            </div>

            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Regions</option>
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>

            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Years</option>
              <option value="2016-2019">2016-2019 (Pre-COVID)</option>
              <option value="2020-2021">2020-2021 (COVID)</option>
              <option value="2022-2025">2022-2025 (Post-COVID)</option>
            </select>

            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => setView('heatmap')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === 'heatmap'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Heatmap View
              </button>
              <button
                onClick={() => setView('trends')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === 'trends'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Trends View
              </button>
            </div>
          </div>
        </div>

        {/* Main Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Coverage Bar Chart */}
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              SDG Coverage Ranking
            </h3>
            <ResponsiveContainer width="100%" height={600}>
              <BarChart
                data={sdgCoverageStats}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={180}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any) => [
                    `${value}%`,
                    'Coverage'
                  ]}
                />
                <Bar dataKey="coverage" radius={[0, 4, 4, 0]}>
                  {sdgCoverageStats.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getCoverageColor(entry.coverage)}
                      fillOpacity={hoveredBar !== null && hoveredBar !== index ? 0.3 : 1}
                      onMouseEnter={() => setHoveredBar(index)}
                      onMouseLeave={() => setHoveredBar(null)}
                      style={{ transition: 'fill-opacity 0.15s' }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Conditional View: Heatmap or Trends */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            {view === 'heatmap' ? (
              <>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  SDG Coverage by Region
                </h3>
                <div className="mb-4">
                  <div className="flex items-center gap-4 text-xs text-slate-600">
                    <span>Coverage:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }}></div>
                      <span>&lt;30%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
                      <span>30-49%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: '#fbbf24' }}></div>
                      <span>50-69%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }}></div>
                      <span>70-89%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: '#059669' }}></div>
                      <span>≥90%</span>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="sticky left-0 bg-white border border-slate-200 p-2 text-left text-xs font-semibold text-slate-700">
                          Region
                        </th>
                        {sdgs.map(sdg => (
                          <th
                            key={sdg.id}
                            className="border border-slate-200 p-2 text-center text-xs font-semibold text-slate-700 min-w-[60px]"
                            title={sdg.fullName}
                          >
                            {sdg.id}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedRegion === 'All' ? regions : [selectedRegion]).map(region => (
                        <tr key={region}>
                          <td className="sticky left-0 bg-white border border-slate-200 p-2 text-sm font-medium text-slate-700">
                            {region}
                          </td>
                          {sdgs.map(sdg => {
                            const dataPoint = heatmapData.find(
                              d => d.region === region && d.sdg === sdg.id
                            );
                            const coverage = dataPoint?.coverage || 0;
                            return (
                              <td
                                key={`${region}-${sdg.id}`}
                                className="border border-slate-200 p-2 text-center text-sm font-medium text-white cursor-pointer transition-opacity duration-150"
                                style={{
                                  backgroundColor: getCoverageColor(coverage),
                                  opacity: hoveredCell
                                    ? (hoveredCell.region === region || hoveredCell.sdg === sdg.id ? 1 : 0.4)
                                    : 1,
                                }}
                                title={`${sdg.fullName}: ${coverage}% of VLRs`}
                                onMouseEnter={() => setHoveredCell({ region, sdg: sdg.id })}
                                onMouseLeave={() => setHoveredCell(null)}
                              >
                                {coverage}%
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  SDG Coverage Trends Over Time
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  Top 5 highest and bottom 3 lowest coverage SDGs
                </p>
                <ResponsiveContainer width="100%" height={550}>
                  <LineChart
                    data={trendData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="year" stroke="#64748b" />
                    <YAxis stroke="#64748b" domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} label={{ value: 'Coverage %', angle: -90, position: 'insideLeft' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                      formatter={(value: any) => [`${value}%`, 'Coverage']}
                    />
                    <Legend />
                    {sdgCoverageStats.slice(0, 5).map((sdg, idx) => {
                      const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
                      return (
                        <Line
                          key={sdg.sdg}
                          type="monotone"
                          dataKey={`SDG${sdg.sdg}`}
                          name={`SDG ${sdg.sdg} - ${getSDGName(sdg.sdg)}`}
                          stroke={colors[idx]}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                      );
                    })}
                    {sdgCoverageStats.slice(-3).map((sdg, idx) => {
                      const colors = ['#ef4444', '#dc2626', '#991b1b'];
                      return (
                        <Line
                          key={sdg.sdg}
                          type="monotone"
                          dataKey={`SDG${sdg.sdg}`}
                          name={`SDG ${sdg.sdg} - ${getSDGName(sdg.sdg)}`}
                          stroke={colors[idx]}
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={{ r: 4 }}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </>
            )}
          </div>
        </div>

        {/* Strategic Value Note */}
        <Collapsible open={strategicOpen} onOpenChange={setStrategicOpen}>
          <div className="bg-blue-50 border border-blue-200 rounded-2xl">
            <CollapsibleTrigger className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-blue-100/50 rounded-2xl transition-colors">
              <span className="text-sm font-medium text-blue-800 italic">Identifies global and regional SDG blind spots for targeted intervention</span>
              <ChevronDown className={`w-4 h-4 text-blue-600 transition-transform duration-300 ${strategicOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="overflow-hidden transition-all duration-300 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
              <div className="px-6 pb-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Strategic Value</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                  <li>Identifies global and regional SDG blind spots for targeted intervention</li>
                  <li>Enables evidence-based resource allocation for UN agencies and donors</li>
                  <li>Supports city networks in capacity building for under-reported goals</li>
                  <li>Reveals temporal patterns (e.g., COVID impact, emerging priorities)</li>
                  <li>Facilitates peer learning by highlighting regional expertise areas</li>
                </ul>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>
    </div>
  );
}
