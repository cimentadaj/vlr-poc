import { useState, useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  BarChart,
  Bar,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { Sparkles, TrendingUp, Globe, AlertCircle, Filter, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './ui/collapsible';
import { REGIONS } from './data/constants';

// Theme categories with colors
const themeCategories = [
  { id: 'digital', name: 'Digital Transformation', color: '#3b82f6' },
  { id: 'participation', name: 'Participation & Inclusion', color: '#10b981' },
  { id: 'resilience', name: 'Resilience & Adaptation', color: '#f59e0b' },
  { id: 'innovation', name: 'Innovation & Technology', color: '#8b5cf6' },
  { id: 'governance', name: 'Governance Models', color: '#ec4899' },
  { id: 'finance', name: 'Finance & Economics', color: '#06b6d4' },
];

// Generate emerging themes data
const generateThematicData = () => {
  const regions = ['All Regions', ...REGIONS];
  const years = [2020, 2021, 2022, 2023, 2024, 2025];

  // Emerging themes with their characteristics
  const baseThemes = [
    // Digital Transformation
    { name: 'AI in Public Services', category: 'digital', baseFrequency: 45, growth: 25, regionStrength: { 'Europe': 1.3, 'Asia': 1.4, 'Africa': 0.6, 'North America': 1.2, 'Australia & Oceania': 1.1 } },
    { name: 'Digital Twin Cities', category: 'digital', baseFrequency: 65, growth: 15, regionStrength: { 'Europe': 1.2, 'Asia': 1.3, 'North America': 1.1, 'Australia & Oceania': 1.0 } },
    { name: 'Smart Mobility Hubs', category: 'digital', baseFrequency: 80, growth: 10, regionStrength: { 'Europe': 1.4, 'LATAM': 1.1, 'North America': 1.2 } },

    // Participation & Inclusion
    { name: 'Co-creation Labs', category: 'participation', baseFrequency: 55, growth: 20, regionStrength: { 'Europe': 1.3, 'LATAM': 1.2, 'North America': 1.1 } },
    { name: 'Youth Climate Councils', category: 'participation', baseFrequency: 72, growth: 18, regionStrength: { 'Africa': 1.4, 'LATAM': 1.2, 'Middle East': 1.1 } },
    { name: 'Liquid Democracy', category: 'participation', baseFrequency: 48, growth: 22, regionStrength: { 'LATAM': 1.5, 'Europe': 1.1, 'North America': 1.0 } },

    // Resilience & Adaptation
    { name: 'Adequate Housing & Basic Services', category: 'resilience', baseFrequency: 68, growth: 46, regionStrength: { 'Africa': 1.5, 'LATAM': 1.4, 'Asia': 1.3, 'Middle East': 1.3, 'Europe': 0.8, 'North America': 0.7, 'Australia & Oceania': 0.7 } },
    { name: 'Climate Adaptation Finance', category: 'resilience', baseFrequency: 88, growth: 30, regionStrength: { 'Asia': 1.3, 'Africa': 1.2, 'LATAM': 1.2, 'Middle East': 1.1 } },
    { name: 'Circular Economy Hubs', category: 'resilience', baseFrequency: 58, growth: 28, regionStrength: { 'Europe': 1.5, 'Asia': 1.1, 'North America': 1.2 } },
    { name: 'Urban Forests & Green Corridors', category: 'resilience', baseFrequency: 52, growth: 35, regionStrength: { 'LATAM': 1.4, 'Africa': 1.2, 'Asia': 1.1 } },
    { name: 'Resilience Bonds', category: 'resilience', baseFrequency: 70, growth: 20, regionStrength: { 'Europe': 1.1, 'North America': 1.1, 'Australia & Oceania': 1.0 } },

    // Innovation & Technology
    { name: 'Green Hydrogen', category: 'innovation', baseFrequency: 25, growth: 45, regionStrength: { 'LATAM': 1.4, 'Africa': 1.3, 'Middle East': 1.3, 'Australia & Oceania': 1.2 } },
    { name: 'Blockchain Governance', category: 'innovation', baseFrequency: 42, growth: 22, regionStrength: { 'Asia': 1.3, 'Europe': 1.2, 'Middle East': 1.1 } },
    { name: 'Quantum Computing Pilots', category: 'innovation', baseFrequency: 18, growth: 40, regionStrength: { 'Europe': 1.3, 'Asia': 1.2, 'North America': 1.3 } },

    // Governance Models
    { name: 'National-Local Alignment', category: 'governance', baseFrequency: 72, growth: 47, regionStrength: { 'Africa': 1.4, 'LATAM': 1.3, 'Asia': 1.3, 'Middle East': 1.1, 'Europe': 1.0, 'North America': 0.9, 'Australia & Oceania': 0.9 } },
    { name: 'Platform Cooperatives', category: 'governance', baseFrequency: 62, growth: 12, regionStrength: { 'Europe': 1.3, 'North America': 1.1 } },
    { name: 'Agile Regulation', category: 'governance', baseFrequency: 35, growth: 38, regionStrength: { 'Asia': 1.4, 'Europe': 1.2, 'North America': 1.1 } },
    { name: 'Predictive Governance', category: 'governance', baseFrequency: 68, growth: 25, regionStrength: { 'Europe': 1.3, 'Asia': 1.2, 'North America': 1.1 } },

    // Finance & Economics
    { name: 'Social Impact Bonds', category: 'finance', baseFrequency: 40, growth: 32, regionStrength: { 'Africa': 1.3, 'LATAM': 1.2, 'Europe': 1.1 } },
    { name: 'Tokenized Carbon Credits', category: 'finance', baseFrequency: 50, growth: 28, regionStrength: { 'Europe': 1.4, 'Asia': 1.2, 'Middle East': 1.1 } },
    { name: 'Community Wealth Building', category: 'finance', baseFrequency: 38, growth: 20, regionStrength: { 'Europe': 1.3, 'LATAM': 1.2, 'North America': 1.1 } },
  ];

  // Regional growth modifiers — regions strong in a theme grow faster there
  const regionGrowthModifiers: Record<string, number> = {
    'LATAM': 1.25, 'Africa': 1.30, 'Middle East': 1.15,
    'Asia': 1.10, 'Europe': 0.85, 'North America': 0.80, 'Australia & Oceania': 0.90,
  };

  // Calculate theme data by region
  const themesByRegion: any = {};

  regions.forEach(region => {
    themesByRegion[region] = baseThemes.map(theme => {
      let frequency = theme.baseFrequency;
      let impact = 40 + (theme.baseFrequency % 40);
      let growth = theme.growth;

      // Apply regional variations
      if (region !== 'All Regions') {
        const strength = theme.regionStrength[region] || 0.7;
        frequency *= strength;
        impact *= strength;
        // Growth varies by region: strong regions grow faster, weak regions slower
        const growthMod = regionGrowthModifiers[region] || 1;
        growth = Math.round(theme.growth * strength * growthMod);
      }

      frequency = Math.round(frequency);
      impact = Math.round(impact);

      return {
        name: theme.name,
        category: theme.category,
        categoryName: themeCategories.find(c => c.id === theme.category)?.name || '',
        frequency: Math.max(5, Math.min(100, frequency)),
        impact: Math.max(10, Math.min(95, impact)),
        growth: Math.max(2, Math.min(60, growth)),
        region,
        // For bubble chart positioning
        x: (theme.baseFrequency * 1.3) % 100,
        y: (theme.growth * 2.1) % 100,
      };
    });
  });

  // Theme emergence over time
  const temporalData = years.map(year => {
    const data: any = { year };
    themeCategories.forEach(cat => {
      const themesInCategory = baseThemes.filter(t => t.category === cat.id);
      const avgFrequency = themesInCategory.reduce((sum, t) => {
        const yearFactor = (year - 2020) / 5; // 0 to 1
        const yearAdjusted = t.baseFrequency + (t.growth * yearFactor);
        return sum + yearAdjusted;
      }, 0) / themesInCategory.length;
      data[cat.id] = Math.round(avgFrequency);
    });
    return data;
  });

  // Top emerging themes (highest growth)
  const topEmerging = baseThemes
    .sort((a, b) => b.growth - a.growth)
    .slice(0, 5)
    .map(theme => ({
      name: theme.name,
      category: theme.category,
      categoryName: themeCategories.find(c => c.id === theme.category)?.name || '',
      growth: theme.growth,
      frequency: theme.baseFrequency,
    }));

  return {
    themesByRegion,
    temporalData,
    topEmerging,
    regions,
    themeCategories,
  };
};

export function EmergingThematicAnalysis() {
  const {
    themesByRegion,
    temporalData,
    topEmerging,
    regions,
    themeCategories,
  } = useMemo(() => generateThematicData(), []);

  const [selectedRegion, setSelectedRegion] = useState<string>('All Regions');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [strategicOpen, setStrategicOpen] = useState(true);

  // Filter themes based on selections
  const filteredThemes = useMemo(() => {
    let themes = themesByRegion[selectedRegion] || [];

    if (selectedCategory !== 'all') {
      themes = themes.filter((t: any) => t.category === selectedCategory);
    }

    return themes;
  }, [themesByRegion, selectedRegion, selectedCategory]);

  // Custom tooltip for bubble chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-slate-300 rounded-lg shadow-lg">
          <div className="font-semibold text-slate-900 mb-2">{data.name}</div>
          <div className="text-sm text-slate-600 mb-1">{data.categoryName}</div>
          <div className="text-xs text-slate-500 space-y-1">
            <div>Frequency: {data.frequency}%</div>
            <div>Impact: {data.impact}%</div>
            <div>Growth: +{data.growth}%</div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full overflow-auto bg-slate-50">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Emerging Thematic Analysis
          </h1>
          <p className="text-lg text-slate-600">
            Bottom-up signals: What themes are emerging organically across VLRs beyond SDG frameworks?
          </p>
        </div>

        {/* Strategic Value */}
        <Collapsible open={strategicOpen} onOpenChange={setStrategicOpen}>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
            <CollapsibleTrigger asChild>
              <button className="flex items-center justify-between w-full text-left">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Strategic Value</h2>
                  <p className="text-sm text-slate-500 mt-1">Global South cities are leading the next wave of urban innovation.</p>
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${strategicOpen ? 'rotate-180' : ''}`} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                <div className="border-l-4 border-purple-500 pl-4">
                  <div className="flex items-center gap-2 text-purple-700 mb-2">
                    <Sparkles className="w-5 h-5" />
                    <div className="font-semibold">Early Detection</div>
                  </div>
                  <div className="text-sm text-slate-600">
                    Identify new governance paradigms and policy trends before they become mainstream
                  </div>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <div className="flex items-center gap-2 text-blue-700 mb-2">
                    <Globe className="w-5 h-5" />
                    <div className="font-semibold">SDG-Agnostic Insights</div>
                  </div>
                  <div className="text-sm text-slate-600">
                    Discover cross-cutting narratives not predefined in SDG logic that cities prioritize
                  </div>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <div className="flex items-center gap-2 text-green-700 mb-2">
                    <TrendingUp className="w-5 h-5" />
                    <div className="font-semibold">Thought Leadership</div>
                  </div>
                  <div className="text-sm text-slate-600">
                    Surface emerging trends for policy makers and establish innovation radar capabilities
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Featured Emerging Trends */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 border-l-4" style={{ borderLeftColor: '#ec4899' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">Featured Trend</span>
              <span className="text-green-600 font-semibold text-sm">+47% growth</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">National-Local Alignment</h3>
            <p className="text-sm text-slate-600 mb-4">
              VLR-VNR alignment and multi-level governance coherence are accelerating as cities and national governments seek to bridge the implementation gap through coordinated reporting and shared accountability frameworks.
            </p>
            <div className="flex flex-col gap-1 text-xs text-slate-500">
              <span><strong className="text-slate-700">Strongest in:</strong> Africa, LATAM, Asia</span>
              <span><strong className="text-slate-700">Relevant to:</strong> UNDESA, UNDP</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 border-l-4" style={{ borderLeftColor: '#f59e0b' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Featured Trend</span>
              <span className="text-green-600 font-semibold text-sm">+46% growth</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Adequate Housing & Basic Services</h3>
            <p className="text-sm text-slate-600 mb-4">
              Cities are increasingly centring adequate housing as a cross-cutting priority, aligning with UN-Habitat's Strategic Plan 2026–2029 and SDG 11.1's target of ensuring access for all to adequate, safe, and affordable housing.
            </p>
            <div className="flex flex-col gap-1 text-xs text-slate-500">
              <span><strong className="text-slate-700">Strongest in:</strong> Africa, LATAM, Asia, Middle East</span>
              <span><strong className="text-slate-700">Relevant to:</strong> UN-Habitat</span>
            </div>
          </div>
        </div>

        {/* Main Visualization: Regional Theme Growth Matrix */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Regional Theme Growth Matrix: Where Innovation Is Accelerating
            </h3>
            <p className="text-sm text-slate-600">
              Growth rates by theme and region &bull; Darker colors indicate faster-growing themes &bull; Africa &amp; LATAM lead 4 of 5 fastest-growing themes
            </p>
          </div>

          {/* Get top global themes */}
          {(() => {
            // Get top 8 themes globally by average frequency
            const globalThemes = themesByRegion['All Regions']
              .sort((a: any, b: any) => b.frequency - a.frequency)
              .slice(0, 8);

            const displayRegions = regions.filter(r => r !== 'All Regions');

            // Collect all frequency values across displayed cells for relative scaling
            const allFreqs: number[] = [];
            globalThemes.forEach((gt: any) => {
              displayRegions.forEach(r => {
                const rt = themesByRegion[r].find((t: any) => t.name === gt.name);
                if (rt) allFreqs.push(rt.frequency);
              });
            });
            const maxFreq = Math.max(...allFreqs);
            const minFreq = Math.min(...allFreqs);
            const freqRange = maxFreq - minFreq || 1;

            // Returns inline style for background + text based on relative frequency
            const getCellStyle = (frequency: number, growth: number) => {
              const t = (frequency - minFreq) / freqRange; // 0 to 1
              if (t < 0.25) {
                return { bg: '#f1f5f9', text: '#94a3b8' }; // slate-100 / slate-400
              }
              if (t < 0.45) {
                return { bg: '#e2e8f0', text: '#64748b' }; // slate-200 / slate-500
              }
              if (t < 0.65) {
                return { bg: '#93c5fd', text: '#1e3a8a' }; // blue-300 / blue-900
              }
              if (t < 0.80) {
                return { bg: '#60a5fa', text: '#ffffff' }; // blue-400
              }
              if (growth >= 35) {
                return { bg: '#16a34a', text: '#ffffff' }; // green-600
              }
              return { bg: '#3b82f6', text: '#ffffff' }; // blue-500
            };

            return (
              <div className="overflow-x-auto">
                <div className="inline-block min-w-full">
                  {/* Header row with regions */}
                  <div className="flex items-stretch mb-2">
                    <div className="w-56 flex-shrink-0" />
                    {displayRegions.map(region => (
                      <div
                        key={region}
                        className="flex-1 min-w-[120px] px-2"
                      >
                        <div className="flex items-center justify-center gap-1 text-xs font-bold text-slate-700 text-center h-full">
                          <Globe className="w-3 h-3 flex-shrink-0" />
                          <span>{region}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Theme rows */}
                  <div className="space-y-2">
                    {globalThemes.map((globalTheme: any) => {
                      const category = themeCategories.find(c => c.id === globalTheme.category);

                      return (
                        <div key={globalTheme.name} className="flex items-stretch">
                          {/* Theme name */}
                          <div className="w-56 flex-shrink-0 flex items-center gap-2 pr-4">
                            <div
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: category?.color }}
                            />
                            <span className="text-sm font-semibold text-slate-900 leading-tight">
                              {globalTheme.name}
                            </span>
                          </div>

                          {/* Growth cells for each region */}
                          {displayRegions.map(region => {
                            const regionTheme = themesByRegion[region].find(
                              (t: any) => t.name === globalTheme.name
                            );

                            if (!regionTheme) return <div key={region} className="flex-1 min-w-[120px] px-2" />;

                            const isHighGrowth = regionTheme.growth > 30;
                            const isHighFrequency = regionTheme.frequency > 70;

                            const cellStyle = getCellStyle(regionTheme.frequency, regionTheme.growth);

                            return (
                              <div key={region} className="flex-1 min-w-[120px] px-1">
                                <div
                                  className="rounded-lg p-2 h-full flex flex-col items-center justify-center transition-all hover:scale-105 hover:shadow-md cursor-pointer relative"
                                  style={{ backgroundColor: cellStyle.bg, color: cellStyle.text }}
                                >
                                  <div className="text-lg font-bold">
                                    +{regionTheme.growth}%
                                  </div>
                                  <div className="text-[10px] opacity-80">
                                    {regionTheme.frequency}% freq
                                  </div>

                                  {isHighGrowth && (
                                    <div className="absolute -top-1 -right-1 text-[8px] font-bold bg-green-700 text-white rounded px-1">ACC</div>
                                  )}
                                  {isHighFrequency && (
                                    <div className="absolute -bottom-1 -right-1 text-[8px] font-bold bg-blue-700 text-white rounded px-1">EST</div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="mt-6 pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-3 text-xs">
                        <span className="font-semibold text-slate-700">Frequency:</span>
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f1f5f9' }} />
                          <span className="text-slate-500">Low</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#e2e8f0' }} />
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#93c5fd' }} />
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#60a5fa' }} />
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3b82f6' }} />
                          <span className="text-slate-500">High</span>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#16a34a' }} />
                          <span className="text-slate-500">High + fast growth</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-600">
                        <span>ACC = Accelerating (Growth &gt;30%)</span>
                        <span>EST = Established (Frequency &gt;70%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Secondary Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Emerging Themes */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Top Emerging Themes (by Growth Rate)
            </h3>
            <div className="space-y-4">
              {topEmerging.map((theme, index) => {
                const category = themeCategories.find(c => c.id === theme.category);
                return (
                  <div key={index} className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ backgroundColor: category?.color || '#94a3b8' }}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">{theme.name}</div>
                      <div className="text-xs text-slate-600 mb-1">{theme.categoryName}</div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-green-600 font-medium">+{theme.growth}% growth</span>
                        <span className="text-slate-500">{theme.frequency}% frequency</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 p-4 bg-slate-50 rounded-lg border-l-4 border-blue-500">
              <div className="text-xs text-slate-600">
                <strong>Insight:</strong> National-Local Alignment and Adequate Housing & Basic Services lead the top 5 as critical priorities for UNDESA, UNDP, and UN-Habitat.
                Global South regions (Africa, LATAM) drive 4 of the 5 fastest-growing themes, signaling a paradigm shift toward multi-level governance coherence and housing equity.
              </div>
            </div>
          </div>

          {/* Temporal Evolution */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              Theme Category Evolution Over Time
            </h3>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={temporalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="year" />
                <YAxis label={{ value: 'Average Frequency', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                {themeCategories.map(cat => (
                  <Area
                    key={cat.id}
                    type="monotone"
                    dataKey={cat.id}
                    name={cat.name}
                    stackId="1"
                    stroke={cat.color}
                    fill={cat.color}
                    fillOpacity={0.6}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-4 p-4 bg-slate-50 rounded-lg border-l-4 border-blue-500">
              <div className="text-xs text-slate-600">
                <strong>Temporal Insight:</strong> Sharp increases post-2022 in Digital Transformation
                and Resilience themes reflect COVID-19's lasting impact on urban policy priorities.
                Innovation shows accelerating growth into 2025.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
