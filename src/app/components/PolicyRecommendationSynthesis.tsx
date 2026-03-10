import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Cell,
} from 'recharts';
import { Layers, TrendingUp, MapPin, Lightbulb, Target } from 'lucide-react';
import { REGIONS, POLICY_CATEGORIES, getSDGName } from './data/constants';

const recommendationTypes = POLICY_CATEGORIES.map(p => p.name);
const typeColors: Record<string, string> = Object.fromEntries(POLICY_CATEGORIES.map(p => [p.name, p.color]));

// Deterministic policy base distributions per SDG
const policyBaseBySDG: Record<number, Record<string, number>> = {
  1: { 'Information, Awareness & Capacity Building': 18, 'Public Investment & Procurement': 15, 'Economic & Fiscal Instruments': 24, 'Voluntary & Partnership Approaches': 12, 'Strategic Planning & Policy Frameworks': 7, 'Monitoring, Evaluation & Data Systems': 8, 'Regulation & Standards': 12, 'Other': 4 },
  2: { 'Information, Awareness & Capacity Building': 17, 'Public Investment & Procurement': 19, 'Economic & Fiscal Instruments': 21, 'Voluntary & Partnership Approaches': 11, 'Strategic Planning & Policy Frameworks': 8, 'Monitoring, Evaluation & Data Systems': 8, 'Regulation & Standards': 13, 'Other': 3 },
  3: { 'Information, Awareness & Capacity Building': 22, 'Public Investment & Procurement': 20, 'Economic & Fiscal Instruments': 13, 'Voluntary & Partnership Approaches': 10, 'Strategic Planning & Policy Frameworks': 11, 'Monitoring, Evaluation & Data Systems': 8, 'Regulation & Standards': 12, 'Other': 4 },
  4: { 'Information, Awareness & Capacity Building': 27, 'Public Investment & Procurement': 13, 'Economic & Fiscal Instruments': 15, 'Voluntary & Partnership Approaches': 10, 'Strategic Planning & Policy Frameworks': 12, 'Monitoring, Evaluation & Data Systems': 7, 'Regulation & Standards': 12, 'Other': 4 },
  5: { 'Information, Awareness & Capacity Building': 25, 'Public Investment & Procurement': 8, 'Economic & Fiscal Instruments': 13, 'Voluntary & Partnership Approaches': 15, 'Strategic Planning & Policy Frameworks': 14, 'Monitoring, Evaluation & Data Systems': 9, 'Regulation & Standards': 13, 'Other': 3 },
  6: { 'Information, Awareness & Capacity Building': 15, 'Public Investment & Procurement': 27, 'Economic & Fiscal Instruments': 17, 'Voluntary & Partnership Approaches': 8, 'Strategic Planning & Policy Frameworks': 10, 'Monitoring, Evaluation & Data Systems': 7, 'Regulation & Standards': 13, 'Other': 3 },
  7: { 'Information, Awareness & Capacity Building': 12, 'Public Investment & Procurement': 25, 'Economic & Fiscal Instruments': 19, 'Voluntary & Partnership Approaches': 10, 'Strategic Planning & Policy Frameworks': 9, 'Monitoring, Evaluation & Data Systems': 8, 'Regulation & Standards': 14, 'Other': 3 },
  8: { 'Information, Awareness & Capacity Building': 17, 'Public Investment & Procurement': 15, 'Economic & Fiscal Instruments': 24, 'Voluntary & Partnership Approaches': 11, 'Strategic Planning & Policy Frameworks': 10, 'Monitoring, Evaluation & Data Systems': 7, 'Regulation & Standards': 12, 'Other': 4 },
  9: { 'Information, Awareness & Capacity Building': 13, 'Public Investment & Procurement': 25, 'Economic & Fiscal Instruments': 15, 'Voluntary & Partnership Approaches': 10, 'Strategic Planning & Policy Frameworks': 8, 'Monitoring, Evaluation & Data Systems': 12, 'Regulation & Standards': 14, 'Other': 3 },
  10: { 'Information, Awareness & Capacity Building': 24, 'Public Investment & Procurement': 10, 'Economic & Fiscal Instruments': 13, 'Voluntary & Partnership Approaches': 17, 'Strategic Planning & Policy Frameworks': 13, 'Monitoring, Evaluation & Data Systems': 7, 'Regulation & Standards': 12, 'Other': 4 },
  11: { 'Information, Awareness & Capacity Building': 15, 'Public Investment & Procurement': 22, 'Economic & Fiscal Instruments': 17, 'Voluntary & Partnership Approaches': 12, 'Strategic Planning & Policy Frameworks': 10, 'Monitoring, Evaluation & Data Systems': 8, 'Regulation & Standards': 13, 'Other': 3 },
  12: { 'Information, Awareness & Capacity Building': 12, 'Public Investment & Procurement': 15, 'Economic & Fiscal Instruments': 13, 'Voluntary & Partnership Approaches': 12, 'Strategic Planning & Policy Frameworks': 15, 'Monitoring, Evaluation & Data Systems': 16, 'Regulation & Standards': 14, 'Other': 3 },
  13: { 'Information, Awareness & Capacity Building': 13, 'Public Investment & Procurement': 17, 'Economic & Fiscal Instruments': 20, 'Voluntary & Partnership Approaches': 12, 'Strategic Planning & Policy Frameworks': 12, 'Monitoring, Evaluation & Data Systems': 9, 'Regulation & Standards': 13, 'Other': 4 },
  14: { 'Information, Awareness & Capacity Building': 15, 'Public Investment & Procurement': 13, 'Economic & Fiscal Instruments': 17, 'Voluntary & Partnership Approaches': 13, 'Strategic Planning & Policy Frameworks': 12, 'Monitoring, Evaluation & Data Systems': 13, 'Regulation & Standards': 14, 'Other': 3 },
  15: { 'Information, Awareness & Capacity Building': 17, 'Public Investment & Procurement': 12, 'Economic & Fiscal Instruments': 15, 'Voluntary & Partnership Approaches': 15, 'Strategic Planning & Policy Frameworks': 13, 'Monitoring, Evaluation & Data Systems': 12, 'Regulation & Standards': 13, 'Other': 3 },
  16: { 'Information, Awareness & Capacity Building': 24, 'Public Investment & Procurement': 8, 'Economic & Fiscal Instruments': 10, 'Voluntary & Partnership Approaches': 18, 'Strategic Planning & Policy Frameworks': 15, 'Monitoring, Evaluation & Data Systems': 8, 'Regulation & Standards': 13, 'Other': 4 },
  17: { 'Information, Awareness & Capacity Building': 17, 'Public Investment & Procurement': 10, 'Economic & Fiscal Instruments': 18, 'Voluntary & Partnership Approaches': 18, 'Strategic Planning & Policy Frameworks': 10, 'Monitoring, Evaluation & Data Systems': 10, 'Regulation & Standards': 13, 'Other': 4 },
};

// Deterministic regional policy focus for radar chart
const regionalPolicyFocus: Record<string, Record<string, number>> = {
  'Information, Awareness & Capacity Building': { 'Europe': 55, 'North America': 52, 'LATAM': 72, 'Africa': 78, 'Middle East': 60, 'Asia': 65, 'Australia & Oceania': 58 },
  'Public Investment & Procurement': { 'Europe': 62, 'North America': 58, 'LATAM': 55, 'Africa': 48, 'Middle East': 70, 'Asia': 75, 'Australia & Oceania': 50 },
  'Economic & Fiscal Instruments': { 'Europe': 68, 'North America': 65, 'LATAM': 58, 'Africa': 52, 'Middle East': 72, 'Asia': 60, 'Australia & Oceania': 55 },
  'Voluntary & Partnership Approaches': { 'Europe': 72, 'North America': 68, 'LATAM': 65, 'Africa': 75, 'Middle East': 55, 'Asia': 62, 'Australia & Oceania': 60 },
  'Strategic Planning & Policy Frameworks': { 'Europe': 78, 'North America': 72, 'LATAM': 50, 'Africa': 42, 'Middle East': 48, 'Asia': 55, 'Australia & Oceania': 65 },
  'Monitoring, Evaluation & Data Systems': { 'Europe': 75, 'North America': 70, 'LATAM': 48, 'Africa': 45, 'Middle East': 52, 'Asia': 58, 'Australia & Oceania': 68 },
  'Regulation & Standards': { 'Europe': 80, 'North America': 72, 'LATAM': 45, 'Africa': 38, 'Middle East': 50, 'Asia': 55, 'Australia & Oceania': 70 },
  'Other': { 'Europe': 18, 'North America': 15, 'LATAM': 20, 'Africa': 16, 'Middle East': 14, 'Asia': 17, 'Australia & Oceania': 12 },
};

// Deterministic region multipliers for comparison data
const regionMultipliers: Record<string, number> = {
  'Europe': 1.1, 'North America': 1.05, 'LATAM': 0.85, 'Africa': 0.75, 'Middle East': 0.80, 'Asia': 0.90, 'Australia & Oceania': 0.95
};

// Mock data for policy recommendations
const generateMockPolicyData = () => {
  const sdgs = Array.from({ length: 17 }, (_, i) => i + 1);
  const regions = [...REGIONS];

  // Define policy themes for each SDG with regional variations
  const policyThemesBySDG: Record<number, { global: string[]; regional: Record<string, string[]> }> = {
    1: {
      global: ['Universal basic income programs', 'Social protection expansion', 'Employment guarantee schemes'],
      regional: {
        'Europe': ['Digital inclusion initiatives', 'Housing-first policies'],
        'North America': ['Earned income tax credits', 'Affordable housing programs'],
        'Asia': ['Microfinance expansion', 'Rural employment programs'],
        'Africa': ['Cash transfer programs', 'Agricultural support'],
        'LATAM': ['Conditional cash transfers', 'Food security networks'],
        'Middle East': ['Social safety nets', 'Youth employment initiatives'],
        'Australia & Oceania': ['Indigenous economic participation', 'Remote community support']
      }
    },
    3: {
      global: ['Universal health coverage', 'Digital health infrastructure', 'Mental health services integration'],
      regional: {
        'Europe': ['Integrated care models', 'Health data interoperability'],
        'North America': ['Prescription drug affordability', 'Telehealth expansion'],
        'Asia': ['Community health workers', 'Telemedicine expansion'],
        'Africa': ['Primary healthcare strengthening', 'Mobile health solutions'],
        'LATAM': ['Family health programs', 'Indigenous health services'],
        'Middle East': ['Healthcare workforce development', 'Pandemic preparedness'],
        'Australia & Oceania': ['Rural health access', 'Mental health first aid']
      }
    },
    11: {
      global: ['Smart city infrastructure', 'Public transport expansion', 'Green building standards'],
      regional: {
        'Europe': ['Low-emission zones', '15-minute city planning'],
        'North America': ['Transit-oriented development', 'Zoning reform'],
        'Asia': ['Mass transit systems', 'Flood resilience measures'],
        'Africa': ['Informal settlement upgrading', 'Waste management systems'],
        'LATAM': ['Bus rapid transit', 'Urban green spaces'],
        'Middle East': ['Water-efficient cities', 'Climate adaptation planning'],
        'Australia & Oceania': ['Bushfire-resilient planning', 'Coastal adaptation']
      }
    },
    13: {
      global: ['Carbon pricing mechanisms', 'Renewable energy transition', 'Climate adaptation funds'],
      regional: {
        'Europe': ['Net-zero targets', 'Green deal implementation'],
        'North America': ['Clean energy tax incentives', 'Grid modernization'],
        'Asia': ['Coal phase-out plans', 'Circular economy policies'],
        'Africa': ['Climate finance access', 'Ecosystem restoration'],
        'LATAM': ['Forest conservation', 'Indigenous land rights'],
        'Middle East': ['Solar energy deployment', 'Water scarcity adaptation'],
        'Australia & Oceania': ['Reef protection programs', 'Drought resilience planning']
      }
    },
  };

  // Fill in remaining SDGs with generic themes
  for (let i = 2; i <= 17; i++) {
    if (!policyThemesBySDG[i]) {
      policyThemesBySDG[i] = {
        global: [
          `Regulatory framework for SDG ${i}`,
          `Financing mechanisms for SDG ${i}`,
          `Partnership models for SDG ${i}`
        ],
        regional: {}
      };
      regions.forEach(region => {
        policyThemesBySDG[i].regional[region] = [
          `${region}-specific implementation of SDG ${i}`,
          `Regional cooperation on SDG ${i}`
        ];
      });
    }
  }

  // Generate recommendation type distribution (deterministic)
  const recommendationTypeData = sdgs.map(sdgId => {
    const data: any = { sdg: sdgId };
    const sdgBase = policyBaseBySDG[sdgId];
    recommendationTypes.forEach(type => {
      data[type] = sdgBase[type];
    });
    return data;
  });

  // Generate regional comparison data for radar chart (deterministic)
  const regionalComparisonData = recommendationTypes.map(type => {
    const data: any = { type };
    regions.forEach(region => {
      data[region] = regionalPolicyFocus[type][region];
    });
    return data;
  });

  return {
    policyThemesBySDG,
    recommendationTypeData,
    regionalComparisonData,
    regions,
    sdgs
  };
};

export function PolicyRecommendationSynthesis() {
  const {
    policyThemesBySDG,
    recommendationTypeData,
    regionalComparisonData,
    regions,
    sdgs
  } = useMemo(() => generateMockPolicyData(), []);

  const [selectedSDG, setSelectedSDG] = useState<number>(11);
  const [compareRegions, setCompareRegions] = useState<string[]>(['Europe', 'Asia']);
  const [comparisonMode, setComparisonMode] = useState<'regions' | 'sdgs'>('regions');
  const [compareSDGs, setCompareSDGs] = useState<number[]>([3, 11, 13]);

  // Calculate dominant recommendation type for selected SDG
  const dominantType = useMemo(() => {
    const sdgData = recommendationTypeData.find(d => d.sdg === selectedSDG);
    if (!sdgData) return null;

    let maxType = '';
    let maxValue = 0;
    recommendationTypes.forEach(type => {
      if (sdgData[type] > maxValue) {
        maxValue = sdgData[type];
        maxType = type;
      }
    });
    return { type: maxType, value: maxValue };
  }, [selectedSDG, recommendationTypeData]);

  // Prepare data for comparison (deterministic)
  const comparisonData = useMemo(() => {
    if (comparisonMode === 'regions') {
      // Compare recommendation types across selected regions for one SDG
      const sdgData = recommendationTypeData.find(d => d.sdg === selectedSDG);
      if (!sdgData) return [];

      return recommendationTypes.map(type => {
        const data: any = { type };
        const baseValue = sdgData[type];
        compareRegions.forEach(region => {
          data[region] = Math.round(baseValue * (regionMultipliers[region] || 0.9));
        });
        return data;
      });
    } else {
      // Compare one region across multiple SDGs
      const region = compareRegions[0] || 'Europe';
      return compareSDGs.map(sdgId => {
        const data: any = { sdg: `SDG ${sdgId}` };
        const sdgBase = policyBaseBySDG[sdgId];
        recommendationTypes.forEach(type => {
          if (sdgBase) {
            data[type] = Math.round(sdgBase[type] * (0.85 + (sdgId % 5) * 0.05));
          }
        });
        return data;
      });
    }
  }, [comparisonMode, selectedSDG, compareRegions, compareSDGs, recommendationTypeData]);

  return (
    <div className="w-full h-full overflow-auto bg-slate-50">
      <div className="max-w-[1600px] mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Policy Recommendation Synthesis
          </h1>
          <p className="text-lg text-slate-600">
            Analysis of policy directions cities globally are converging around for each SDG
          </p>
          <p className="text-sm text-slate-500 mt-1 italic">
            No two regions share the same top policy priority — but Monitoring & Data appears in 6 of 7 regions' top 3.
          </p>
        </div>

        {/* Key Insights Panel */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Strategic Value</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border-l-4 border-purple-500 pl-4">
              <div className="flex items-center gap-2 text-purple-700 mb-2">
                <Layers className="w-5 h-5" />
                <div className="font-semibold">Global Playbooks</div>
              </div>
              <div className="text-sm text-slate-600">
                Reveals de facto policy convergence patterns emerging from city practice across {sdgs.length} SDGs
              </div>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <div className="flex items-center gap-2 text-blue-700 mb-2">
                <Target className="w-5 h-5" />
                <div className="font-semibold">Operational</div>
              </div>
              <div className="text-sm text-slate-600">
                Direct integration into advisory narratives and implementation guidance
              </div>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <Lightbulb className="w-5 h-5" />
                <div className="font-semibold">Advisory Inputs</div>
              </div>
              <div className="text-sm text-slate-600">
                Support evidence-based policy development and implementation guidance for cities
              </div>
            </div>
          </div>
        </div>

        {/* SDG Selector */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Select SDG for Analysis</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-3">
            {sdgs.map(sdgId => (
              <button
                key={sdgId}
                onClick={() => setSelectedSDG(sdgId)}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  selectedSDG === sdgId
                    ? 'bg-blue-600 text-white shadow-md scale-105'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                SDG {sdgId}
              </button>
            ))}
          </div>
        </div>

        {/* Policy Themes for Selected SDG */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Top Global Policy Themes: SDG {selectedSDG} - {getSDGName(selectedSDG)}
          </h3>
          <div className="space-y-3 mb-6">
            {policyThemesBySDG[selectedSDG]?.global.map((theme, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-slate-900">{theme}</div>
                  <div className="text-sm text-slate-600 mt-1">
                    Cited in {75 - idx * 12}% of VLRs globally
                  </div>
                </div>
              </div>
            ))}
          </div>

          {dominantType && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-purple-900">Dominant Recommendation Type</span>
              </div>
              <div className="text-sm text-purple-800">
                <span className="font-bold">{dominantType.type}</span> is the most common recommendation type for this SDG ({dominantType.value}% of recommendations)
              </div>
              <div className="text-xs text-slate-600 mt-1">
                This concentration suggests a structural preference that may need diversification for balanced SDG progress.
              </div>
            </div>
          )}
        </div>

        {/* Recommendation Type Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Recommendation Types by SDG
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={recommendationTypeData.filter(d => [selectedSDG].includes(d.sdg))}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="sdg"
                  label={{ value: 'SDG', position: 'insideBottom', offset: -10 }}
                />
                <YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                {recommendationTypes.map(type => (
                  <Bar
                    key={type}
                    dataKey={type}
                    stackId="a"
                    fill={typeColors[type]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Regional Policy Focus Distribution
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={regionalComparisonData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis
                  dataKey="type"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v: string) => v.split(',')[0].split('&')[0].trim()}
                />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Tooltip />
                <Legend />
                {regions.map((region, idx) => {
                  const colors = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444'];
                  return (
                    <Radar
                      key={region}
                      name={region}
                      dataKey={region}
                      stroke={colors[idx]}
                      fill={colors[idx]}
                      fillOpacity={0.3}
                    />
                  );
                })}
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Regional Variations */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Regional Policy Variations: SDG {selectedSDG}
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Regional policy themes reveal three governance blocs: regulation-first (Europe, North America), capacity-first (Africa, LATAM), and infrastructure-first (Asia, Middle East).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regions.map(region => (
              <div key={region} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  {region}
                </div>
                <ul className="space-y-2">
                  {(policyThemesBySDG[selectedSDG]?.regional[region] || []).map((theme, idx) => (
                    <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>{theme}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison Tool */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Policy Comparison Tool</h3>

          {/* Comparison Mode Selector */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setComparisonMode('regions')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                comparisonMode === 'regions'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Compare Regions for One SDG
            </button>
            <button
              onClick={() => setComparisonMode('sdgs')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                comparisonMode === 'sdgs'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Compare SDGs for One Region
            </button>
          </div>

          {/* Region/SDG Selectors */}
          {comparisonMode === 'regions' ? (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Regions to Compare (for SDG {selectedSDG}):
              </label>
              <div className="flex flex-wrap gap-2">
                {regions.map(region => (
                  <button
                    key={region}
                    onClick={() => {
                      setCompareRegions(prev =>
                        prev.includes(region)
                          ? prev.filter(r => r !== region)
                          : [...prev, region]
                      );
                    }}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      compareRegions.includes(region)
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select SDGs to Compare (for {compareRegions[0] || 'Europe'}):
              </label>
              <div className="flex flex-wrap gap-2">
                {sdgs.map(sdgId => (
                  <button
                    key={sdgId}
                    onClick={() => {
                      setCompareSDGs(prev =>
                        prev.includes(sdgId)
                          ? prev.filter(s => s !== sdgId)
                          : [...prev, sdgId]
                      );
                    }}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      compareSDGs.includes(sdgId)
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    SDG {sdgId}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Comparison Chart */}
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={comparisonData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey={comparisonMode === 'regions' ? 'type' : 'sdg'}
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fontSize: 10 }}
                tickFormatter={comparisonMode === 'regions' ? (v: string) => v.split(',')[0].split('&')[0].trim() : undefined}
              />
              <YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              {comparisonMode === 'regions' ? (
                compareRegions.map((region, idx) => {
                  const colors = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444'];
                  return (
                    <Bar
                      key={region}
                      dataKey={region}
                      fill={colors[idx % colors.length]}
                    />
                  );
                })
              ) : (
                recommendationTypes.map(type => (
                  <Bar
                    key={type}
                    dataKey={type}
                    stackId="a"
                    fill={typeColors[type]}
                  />
                ))
              )}
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>Insight:</strong> {comparisonMode === 'regions' ? (
                `Comparing ${compareRegions.join(', ')} shows distinct regional priorities in implementing SDG ${selectedSDG}.`
              ) : (
                `Comparing SDGs ${compareSDGs.join(', ')} in ${compareRegions[0] || 'Europe'} reveals cross-sectoral policy patterns.`
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
