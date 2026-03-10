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
import { AlertCircle, TrendingUp, TrendingDown, Filter } from 'lucide-react';
import { REGIONS, SDG_NAMES, getSDGName } from './data/constants';

// Deterministic base coverage values per SDG
const SDG_BASE_COVERAGE: Record<number, number> = {
  1: 41, 2: 30, 3: 68, 4: 62, 5: 33,
  6: 58, 7: 44, 8: 47, 9: 35, 10: 38,
  11: 82, 12: 25, 13: 76, 14: 12, 15: 17,
  16: 28, 17: 18
};

// Regional multipliers (capped at 100)
const REGION_MULTIPLIERS: Record<string, number> = {
  'Europe': 1.15,
  'North America': 1.05,
  'Asia': 0.85,
  'Australia & Oceania': 0.80,
  'LATAM': 0.73,
  'Middle East': 0.65,
  'Africa': 0.62
};

// Mock data representing VLR SDG coverage
const generateMockData = () => {
  const sdgs = Array.from({ length: 17 }, (_, i) => ({
    id: i + 1,
    name: `SDG ${i + 1}`,
    fullName: getSDGName(i + 1)
  }));

  const regions = [...REGIONS];
  const years = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

  // Generate coverage data
  const coverageData: any[] = [];
  regions.forEach(region => {
    years.forEach(year => {
      sdgs.forEach(sdg => {
        const base = SDG_BASE_COVERAGE[sdg.id];
        const regionMult = REGION_MULTIPLIERS[region] ?? 1;
        const temporalScale = 0.7 + 0.3 * ((year - 2018) / 7);
        const coverage = Math.min(100, Math.round(base * regionMult * temporalScale));
        const vlrCount = Math.round((coverage / 100) * (30 + sdg.id * 3));

        coverageData.push({
          sdg: sdg.id,
          sdgName: sdg.name,
          sdgFullName: sdg.fullName,
          region,
          year,
          coverage,
          vlrCount
        });
      });
    });
  });

  return { sdgs, regions, years, coverageData };
};

export function SDGCoverageAnalysis() {
  const { sdgs, regions, years, coverageData } = useMemo(() => generateMockData(), []);

  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('All');
  const [view, setView] = useState<'heatmap' | 'trends'>('heatmap');

  // Filter data based on selections
  const filteredData = useMemo(() => {
    let filtered = coverageData;

    if (selectedRegion !== 'All') {
      filtered = filtered.filter(d => d.region === selectedRegion);
    }

    if (selectedPeriod !== 'All') {
      const [start, end] = selectedPeriod.split('-').map(Number);
      filtered = filtered.filter(d => d.year >= start && d.year <= end);
    }

    return filtered;
  }, [coverageData, selectedRegion, selectedPeriod]);

  // Calculate SDG coverage aggregates for heatmap
  const heatmapData = useMemo(() => {
    const aggregated: Record<string, Record<number, { coverage: number, count: number }>> = {};

    const regionsToShow = selectedRegion === 'All' ? regions : [selectedRegion];

    regionsToShow.forEach(region => {
      aggregated[region] = {};
      sdgs.forEach(sdg => {
        aggregated[region][sdg.id] = { coverage: 0, count: 0 };
      });
    });

    filteredData.forEach(d => {
      if (!aggregated[d.region]) return;
      aggregated[d.region][d.sdg].coverage += d.coverage;
      aggregated[d.region][d.sdg].count += 1;
    });

    // Calculate averages
    const result: any[] = [];
    Object.entries(aggregated).forEach(([region, sdgData]) => {
      Object.entries(sdgData).forEach(([sdgId, data]) => {
        result.push({
          region,
          sdg: Number(sdgId),
          sdgName: getSDGName(Number(sdgId)),
          avgCoverage: data.count > 0 ? Math.round(data.coverage / data.count) : 0
        });
      });
    });

    return result;
  }, [filteredData, selectedRegion, sdgs, regions]);

  // Calculate overall SDG coverage for bar chart
  const sdgCoverageStats = useMemo(() => {
    const stats: Record<number, { total: number, count: number, vlrTotal: number }> = {};

    sdgs.forEach(sdg => {
      stats[sdg.id] = { total: 0, count: 0, vlrTotal: 0 };
    });

    filteredData.forEach(d => {
      stats[d.sdg].total += d.coverage;
      stats[d.sdg].count += 1;
      stats[d.sdg].vlrTotal += d.vlrCount;
    });

    return sdgs.map(sdg => ({
      sdg: sdg.id,
      name: sdg.fullName,
      avgCoverage: stats[sdg.id].count > 0 ? Math.round(stats[sdg.id].total / stats[sdg.id].count) : 0,
      vlrCount: Math.round(stats[sdg.id].vlrTotal / stats[sdg.id].count)
    })).sort((a, b) => b.avgCoverage - a.avgCoverage);
  }, [filteredData, sdgs]);

  // Calculate time trends
  const trendData = useMemo(() => {
    const trends: Record<number, Record<number, { total: number, count: number }>> = {};

    years.forEach(year => {
      trends[year] = {};
      sdgs.forEach(sdg => {
        trends[year][sdg.id] = { total: 0, count: 0 };
      });
    });

    filteredData.forEach(d => {
      trends[d.year][d.sdg].total += d.coverage;
      trends[d.year][d.sdg].count += 1;
    });

    // Get top 5 SDGs and bottom 3 for comparison
    const topSDGs = sdgCoverageStats.slice(0, 5).map(s => s.sdg);
    const bottomSDGs = sdgCoverageStats.slice(-3).map(s => s.sdg);

    return years.map(year => {
      const yearData: any = { year };
      [...topSDGs, ...bottomSDGs].forEach(sdgId => {
        const data = trends[year][sdgId];
        yearData[`SDG${sdgId}`] = data.count > 0 ? Math.round(data.total / data.count) : 0;
      });
      return yearData;
    });
  }, [filteredData, years, sdgCoverageStats, sdgs]);

  // Generate insights
  const insights = useMemo(() => {
    const mostReported = sdgCoverageStats[0];
    const leastReported = sdgCoverageStats[sdgCoverageStats.length - 1];
    const underReported = sdgCoverageStats.filter(s => s.avgCoverage < 40);

    // Calculate trend
    const recentYears = filteredData.filter(d => d.year >= 2023);
    const olderYears = filteredData.filter(d => d.year < 2020);
    const recentAvg = recentYears.reduce((sum, d) => sum + d.coverage, 0) / recentYears.length;
    const olderAvg = olderYears.reduce((sum, d) => sum + d.coverage, 0) / olderYears.length;
    const trend = recentAvg > olderAvg ? 'increasing' : 'decreasing';
    const trendChange = Math.abs(Math.round(recentAvg - olderAvg));

    return {
      mostReported,
      leastReported,
      underReported,
      trend,
      trendChange
    };
  }, [sdgCoverageStats, filteredData]);

  // Get color for heatmap
  const getHeatmapColor = (coverage: number) => {
    if (coverage >= 75) return '#059669'; // green
    if (coverage >= 50) return '#10b981';
    if (coverage >= 35) return '#fbbf24'; // yellow
    if (coverage >= 20) return '#f59e0b';
    return '#ef4444'; // red
  };

  return (
    <div className="w-full h-full overflow-auto">
      <div className="max-w-[1600px] mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            SDG Coverage Analysis
          </h1>
          <p className="text-lg text-slate-600">
            Baseline Intelligence: Which SDGs are cities reporting on — and which are systematically under-reported?
          </p>
          <p className="text-sm text-slate-500 mt-1 italic">
            5 SDGs consume 73% of all VLR content — the remaining 12 share just 27%.
          </p>
        </div>

        {/* Key Insights Panel */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Key Findings</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border-l-4 border-green-500 pl-4">
              <div className="text-sm text-slate-600 mb-1">Most Reported SDG</div>
              <div className="text-2xl font-bold text-slate-900">{insights.mostReported.name}</div>
              <div className="text-sm text-green-600 font-medium">{insights.mostReported.avgCoverage}% avg coverage</div>
              <div className="text-xs text-slate-500 mt-1">Urban sustainability dominates VLR reporting globally</div>
            </div>
            <div className="border-l-4 border-red-500 pl-4">
              <div className="text-sm text-slate-600 mb-1">Least Reported SDG</div>
              <div className="text-2xl font-bold text-slate-900">{insights.leastReported.name}</div>
              <div className="text-sm text-red-600 font-medium">{insights.leastReported.avgCoverage}% avg coverage</div>
              <div className="text-xs text-slate-500 mt-1">Marine and terrestrial ecosystem goals remain peripheral</div>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <div className="text-sm text-slate-600 mb-1">Reporting Trend</div>
              <div className="flex items-center gap-2">
                {insights.trend === 'increasing' ? (
                  <TrendingUp className="w-6 h-6 text-green-600" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-600" />
                )}
                <div className="text-2xl font-bold text-slate-900 capitalize">{insights.trend}</div>
              </div>
              <div className={`text-sm font-medium ${insights.trend === 'increasing' ? 'text-green-600' : 'text-red-600'}`}>
                {insights.trendChange}% change since 2020
              </div>
              <div className="text-xs text-slate-500 mt-1">Post-pandemic acceleration across all regions</div>
            </div>
          </div>

          {insights.underReported.length > 0 && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-amber-900 mb-1">SDG Blind Spots Detected</div>
                  <div className="text-sm text-amber-800">
                    {insights.underReported.length} SDG{insights.underReported.length > 1 ? 's' : ''} with &lt;40% coverage: {' '}
                    {insights.underReported.map(s => s.name).join(', ')}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
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
              <option value="2018-2020">2018-2020 (Pre-COVID)</option>
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
          {/* Overall SDG Coverage Bar Chart */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              SDG Coverage Distribution
            </h3>
            <ResponsiveContainer width="100%" height={600}>
              <BarChart
                data={sdgCoverageStats}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any) => [`${value}%`, 'Avg Coverage']}
                />
                <Bar dataKey="avgCoverage" radius={[0, 4, 4, 0]}>
                  {sdgCoverageStats.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getHeatmapColor(entry.avgCoverage)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Conditional View: Heatmap or Trends */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            {view === 'heatmap' ? (
              <>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  SDG Coverage Heatmap by Region
                </h3>
                <div className="mb-4">
                  <div className="flex items-center gap-4 text-xs text-slate-600">
                    <span>Coverage:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }}></div>
                      <span>&lt;20% Critical gap</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
                      <span>20-35% Under-reported</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: '#fbbf24' }}></div>
                      <span>35-50% Moderate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }}></div>
                      <span>50-75% Well covered</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: '#059669' }}></div>
                      <span>≥75% Strong focus</span>
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
                            const coverage = dataPoint?.avgCoverage || 0;
                            return (
                              <td
                                key={`${region}-${sdg.id}`}
                                className="border border-slate-200 p-2 text-center text-sm font-medium text-white cursor-pointer hover:opacity-80 transition-opacity"
                                style={{ backgroundColor: getHeatmapColor(coverage) }}
                                title={`${sdg.fullName}: ${coverage}%`}
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
                  Top 5 most reported and bottom 3 least reported SDGs
                </p>
                <ResponsiveContainer width="100%" height={550}>
                  <LineChart
                    data={trendData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="year"
                      stroke="#64748b"
                    />
                    <YAxis
                      domain={[0, 100]}
                      stroke="#64748b"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    {/* Top 5 SDGs */}
                    {sdgCoverageStats.slice(0, 5).map((sdg, idx) => {
                      const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
                      return (
                        <Line
                          key={sdg.sdg}
                          type="monotone"
                          dataKey={`SDG${sdg.sdg}`}
                          name={`SDG ${sdg.sdg}`}
                          stroke={colors[idx]}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                      );
                    })}
                    {/* Bottom 3 SDGs with dashed lines */}
                    {sdgCoverageStats.slice(-3).map((sdg, idx) => {
                      const colors = ['#ef4444', '#dc2626', '#991b1b'];
                      return (
                        <Line
                          key={sdg.sdg}
                          type="monotone"
                          dataKey={`SDG${sdg.sdg}`}
                          name={`SDG ${sdg.sdg}`}
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Strategic Value</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
            <li>Identifies global and regional SDG blind spots for targeted intervention</li>
            <li>Enables evidence-based resource allocation for UN agencies and donors</li>
            <li>Supports city networks in capacity building for under-reported goals</li>
            <li>Reveals temporal patterns (e.g., COVID impact, emerging priorities)</li>
            <li>Facilitates peer learning by highlighting regional expertise areas</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
