import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  Target,
  TrendingUp,
  DollarSign,
  Building,
  Database,
  AlertCircle,
  Calendar,
  Filter,
  Scroll,
  Rocket,
  Handshake,
  Crosshair,
  MoreHorizontal,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { REGIONS, COMMITMENT_CATEGORIES, CommitmentId, getSDGName } from './data/constants';

const COMMITMENT_ICON_MAP: Record<CommitmentId, { icon: LucideIcon; shortName: string }> = {
  strategy_plan:            { icon: TrendingUp,    shortName: 'Strategy & Plans' },
  regulatory_reform:        { icon: Scroll,        shortName: 'Regulatory Reform' },
  capital_investment:       { icon: DollarSign,    shortName: 'Capital Investment' },
  programme_service:        { icon: Rocket,        shortName: 'Programmes' },
  institutional_capacity:   { icon: Building,      shortName: 'Institutional' },
  data_reporting:           { icon: Database,      shortName: 'Data & Reporting' },
  partnership_collaboration:{ icon: Handshake,     shortName: 'Partnerships' },
  target_goal:              { icon: Crosshair,     shortName: 'Targets & Goals' },
  other_commitment:         { icon: MoreHorizontal,shortName: 'Other' },
};

// Generate commitment data
const generateCommitmentData = () => {
  const sdgs = Array.from({ length: 17 }, (_, i) => i + 1);
  const regions = ['All Regions', ...REGIONS];

  const commitmentBaseBySDG: Record<number, Record<string, number>> = {
    1:  { strategy_plan: 18, regulatory_reform: 14, capital_investment: 12, programme_service: 13, institutional_capacity: 9, data_reporting: 8, partnership_collaboration: 8, target_goal: 12, other_commitment: 3 },
    2:  { strategy_plan: 15, regulatory_reform: 12, capital_investment: 15, programme_service: 12, institutional_capacity: 7, data_reporting: 10, partnership_collaboration: 7, target_goal: 10, other_commitment: 3 },
    3:  { strategy_plan: 20, regulatory_reform: 15, capital_investment: 10, programme_service: 15, institutional_capacity: 7, data_reporting: 8, partnership_collaboration: 7, target_goal: 13, other_commitment: 2 },
    4:  { strategy_plan: 16, regulatory_reform: 13, capital_investment: 12, programme_service: 13, institutional_capacity: 11, data_reporting: 10, partnership_collaboration: 9, target_goal: 12, other_commitment: 3 },
    5:  { strategy_plan: 14, regulatory_reform: 11, capital_investment: 8, programme_service: 10, institutional_capacity: 13, data_reporting: 12, partnership_collaboration: 11, target_goal: 10, other_commitment: 4 },
    6:  { strategy_plan: 12, regulatory_reform: 10, capital_investment: 28, programme_service: 10, institutional_capacity: 7, data_reporting: 10, partnership_collaboration: 7, target_goal: 8, other_commitment: 3 },
    7:  { strategy_plan: 11, regulatory_reform: 9, capital_investment: 30, programme_service: 11, institutional_capacity: 6, data_reporting: 12, partnership_collaboration: 5, target_goal: 9, other_commitment: 3 },
    8:  { strategy_plan: 15, regulatory_reform: 12, capital_investment: 15, programme_service: 12, institutional_capacity: 9, data_reporting: 8, partnership_collaboration: 8, target_goal: 10, other_commitment: 3 },
    9:  { strategy_plan: 12, regulatory_reform: 10, capital_investment: 25, programme_service: 11, institutional_capacity: 7, data_reporting: 15, partnership_collaboration: 7, target_goal: 9, other_commitment: 3 },
    10: { strategy_plan: 16, regulatory_reform: 13, capital_investment: 10, programme_service: 12, institutional_capacity: 12, data_reporting: 10, partnership_collaboration: 10, target_goal: 10, other_commitment: 4 },
    11: { strategy_plan: 18, regulatory_reform: 14, capital_investment: 22, programme_service: 13, institutional_capacity: 9, data_reporting: 12, partnership_collaboration: 8, target_goal: 12, other_commitment: 2 },
    12: { strategy_plan: 14, regulatory_reform: 11, capital_investment: 12, programme_service: 12, institutional_capacity: 9, data_reporting: 18, partnership_collaboration: 8, target_goal: 10, other_commitment: 3 },
    13: { strategy_plan: 18, regulatory_reform: 14, capital_investment: 18, programme_service: 15, institutional_capacity: 7, data_reporting: 15, partnership_collaboration: 7, target_goal: 13, other_commitment: 2 },
    14: { strategy_plan: 12, regulatory_reform: 10, capital_investment: 15, programme_service: 11, institutional_capacity: 10, data_reporting: 15, partnership_collaboration: 10, target_goal: 9, other_commitment: 3 },
    15: { strategy_plan: 14, regulatory_reform: 11, capital_investment: 12, programme_service: 12, institutional_capacity: 10, data_reporting: 14, partnership_collaboration: 10, target_goal: 10, other_commitment: 3 },
    16: { strategy_plan: 18, regulatory_reform: 14, capital_investment: 8, programme_service: 10, institutional_capacity: 15, data_reporting: 10, partnership_collaboration: 12, target_goal: 10, other_commitment: 3 },
    17: { strategy_plan: 14, regulatory_reform: 11, capital_investment: 12, programme_service: 9, institutional_capacity: 9, data_reporting: 12, partnership_collaboration: 8, target_goal: 9, other_commitment: 4 },
  };

  const regionCommitmentModifiers: Record<string, Record<string, number>> = {
    'All Regions': { strategy_plan: 0, regulatory_reform: 0, capital_investment: 0, programme_service: 0, institutional_capacity: 0, data_reporting: 0, partnership_collaboration: 0, target_goal: 0, other_commitment: 0 },
    'Europe': { strategy_plan: 3, regulatory_reform: 4, capital_investment: -2, programme_service: 2, institutional_capacity: 1, data_reporting: 8, partnership_collaboration: 2, target_goal: 1, other_commitment: -1 },
    'North America': { strategy_plan: 2, regulatory_reform: 3, capital_investment: -1, programme_service: 1, institutional_capacity: 2, data_reporting: 6, partnership_collaboration: 2, target_goal: 1, other_commitment: 0 },
    'LATAM': { strategy_plan: 3, regulatory_reform: 4, capital_investment: 3, programme_service: 1, institutional_capacity: -1, data_reporting: -3, partnership_collaboration: -1, target_goal: 1, other_commitment: 1 },
    'Africa': { strategy_plan: -2, regulatory_reform: -2, capital_investment: -8, programme_service: -1, institutional_capacity: 3, data_reporting: -5, partnership_collaboration: 3, target_goal: -1, other_commitment: 1 },
    'Middle East': { strategy_plan: 1, regulatory_reform: 2, capital_investment: 5, programme_service: 2, institutional_capacity: 4, data_reporting: -2, partnership_collaboration: 5, target_goal: 1, other_commitment: 0 },
    'Asia': { strategy_plan: 2, regulatory_reform: 2, capital_investment: 4, programme_service: 5, institutional_capacity: -1, data_reporting: 2, partnership_collaboration: 0, target_goal: 4, other_commitment: 0 },
    'Australia & Oceania': { strategy_plan: 1, regulatory_reform: 2, capital_investment: -3, programme_service: 0, institutional_capacity: 1, data_reporting: 5, partnership_collaboration: 0, target_goal: 0, other_commitment: 1 },
  };

  const specificityRegionMod: Record<string, number> = {
    'All Regions': 0, 'Europe': 15, 'North America': 10, 'Asia': 8,
    'Australia & Oceania': 5, 'LATAM': 0, 'Middle East': -5, 'Africa': -10,
  };

  const resourceRegionMod: Record<string, number> = {
    'All Regions': 0, 'Europe': 10, 'North America': 8, 'Asia': 5,
    'Australia & Oceania': 3, 'LATAM': -3, 'Middle East': -5, 'Africa': -20,
  };

  // Generate commitment data by SDG and Region
  const commitmentsBySDGAndRegion: any = {};

  regions.forEach(region => {
    commitmentsBySDGAndRegion[region] = sdgs.map(sdgId => {
      const commitments: any = { sdg: sdgId, region };
      const bases = commitmentBaseBySDG[sdgId];
      const mods = regionCommitmentModifiers[region] || regionCommitmentModifiers['All Regions'];

      COMMITMENT_CATEGORIES.forEach(cat => {
        const base = bases[cat.id] || 10;
        const modifier = mods[cat.id] || 0;
        commitments[cat.id] = Math.round(Math.max(2, Math.min(95, base + modifier)));
      });

      // Ambition metrics
      const specificityBase = 45 + (sdgId * 3) % 40;
      const resourceBase = 35 + (sdgId * 5) % 45;

      commitments.specificity = Math.round(Math.max(10, Math.min(95, specificityBase + (specificityRegionMod[region] || 0))));
      commitments.resourceCommitment = Math.round(Math.max(10, Math.min(95, resourceBase + (resourceRegionMod[region] || 0))));
      commitments.totalCommitments = 80 + sdgId * 7;

      return commitments;
    });
  });

  // Challenge-Commitment Gap Analysis by Region
  const gapBySDG: Record<number, number> = {
    1: -15, 2: -18, 3: -5, 4: -2, 5: -22, 6: -4, 7: -8, 8: -6,
    9: -16, 10: -24, 11: 12, 12: -16, 13: -37, 14: -32, 15: -28,
    16: -19, 17: -21
  };

  const gapRegionMod: Record<string, number> = {
    'All Regions': 0, 'Europe': 8, 'North America': 6, 'Asia': 3,
    'LATAM': -2, 'Middle East': -3, 'Africa': -10, 'Australia & Oceania': 4,
  };

  const gapAnalysisByRegion: any = {};

  regions.forEach(region => {
    gapAnalysisByRegion[region] = sdgs.map(sdgId => {
      const baseGap = gapBySDG[sdgId];
      const regionMod = gapRegionMod[region] || 0;
      const adjustedGap = baseGap + regionMod;

      const commitmentIntensity = 50 + (sdgId * 3) % 30;
      const challengeIntensity = commitmentIntensity - adjustedGap;

      const clampedChallenge = Math.round(Math.max(20, Math.min(95, challengeIntensity)));
      const clampedCommitment = Math.round(Math.max(15, Math.min(95, commitmentIntensity)));
      const gap = clampedChallenge - clampedCommitment;

      return {
        sdg: sdgId,
        region,
        challengeIntensity: clampedChallenge,
        commitmentIntensity: clampedCommitment,
        gap: Math.round(gap),
        gapCategory: gap > 20 ? 'Large Gap' : gap > 0 ? 'Moderate Gap' : 'Well Addressed',
      };
    });
  });

  // Regional ambition profiles (not filtered by region selector)
  const regionalAmbitionData: Record<string, Record<string, number>> = {
    'Europe': { strategy_plan: 58, regulatory_reform: 55, capital_investment: 48, programme_service: 50, institutional_capacity: 48, data_reporting: 68, partnership_collaboration: 52, target_goal: 45, other_commitment: 15 },
    'North America': { strategy_plan: 55, regulatory_reform: 52, capital_investment: 50, programme_service: 48, institutional_capacity: 45, data_reporting: 62, partnership_collaboration: 48, target_goal: 42, other_commitment: 12 },
    'LATAM': { strategy_plan: 48, regulatory_reform: 45, capital_investment: 55, programme_service: 42, institutional_capacity: 38, data_reporting: 38, partnership_collaboration: 42, target_goal: 40, other_commitment: 18 },
    'Africa': { strategy_plan: 42, regulatory_reform: 38, capital_investment: 35, programme_service: 38, institutional_capacity: 45, data_reporting: 32, partnership_collaboration: 45, target_goal: 35, other_commitment: 16 },
    'Middle East': { strategy_plan: 45, regulatory_reform: 42, capital_investment: 55, programme_service: 45, institutional_capacity: 50, data_reporting: 40, partnership_collaboration: 52, target_goal: 38, other_commitment: 14 },
    'Asia': { strategy_plan: 50, regulatory_reform: 48, capital_investment: 52, programme_service: 58, institutional_capacity: 42, data_reporting: 48, partnership_collaboration: 45, target_goal: 52, other_commitment: 15 },
    'Australia & Oceania': { strategy_plan: 52, regulatory_reform: 48, capital_investment: 45, programme_service: 45, institutional_capacity: 44, data_reporting: 58, partnership_collaboration: 46, target_goal: 40, other_commitment: 13 },
  };

  const regionalAmbition = [...REGIONS].map(region => {
    const profile: any = { region, ...regionalAmbitionData[region] };
    return profile;
  });

  // Timeframe distribution
  const timeframeData = [
    { timeframe: 'Short-term (1-2 years)', strategy_plan: 15, regulatory_reform: 10, capital_investment: 18, programme_service: 22, institutional_capacity: 12, data_reporting: 42, partnership_collaboration: 18, target_goal: 28, other_commitment: 8 },
    { timeframe: 'Medium-term (3-5 years)', strategy_plan: 35, regulatory_reform: 28, capital_investment: 32, programme_service: 30, institutional_capacity: 28, data_reporting: 30, partnership_collaboration: 25, target_goal: 35, other_commitment: 10 },
    { timeframe: 'Long-term (5+ years)', strategy_plan: 22, regulatory_reform: 25, capital_investment: 48, programme_service: 18, institutional_capacity: 18, data_reporting: 20, partnership_collaboration: 15, target_goal: 15, other_commitment: 5 },
  ];

  return {
    commitmentsBySDGAndRegion,
    gapAnalysisByRegion,
    regionalAmbition,
    regionalAmbitionData,
    timeframeData,
    regions,
  };
};

export function CommitmentStatementsAnalysis() {
  const {
    commitmentsBySDGAndRegion,
    gapAnalysisByRegion,
    regionalAmbition,
    regionalAmbitionData,
    timeframeData,
    regions,
  } = useMemo(() => generateCommitmentData(), []);

  const [selectedSDG, setSelectedSDG] = useState<number>(11);
  const [selectedRegion, setSelectedRegion] = useState<string>('All Regions');
  const [radarRegions, setRadarRegions] = useState<string[]>(['Europe', 'Asia', 'Africa']);

  // Get data for selected SDG and Region
  const selectedSDGData = commitmentsBySDGAndRegion[selectedRegion].find(d => d.sdg === selectedSDG);
  const selectedGapData = gapAnalysisByRegion[selectedRegion].find(d => d.sdg === selectedSDG);

  const radarData = useMemo(() => {
    return COMMITMENT_CATEGORIES.map(cat => {
      const entry: Record<string, string | number> = { type: COMMITMENT_ICON_MAP[cat.id].shortName };
      REGIONS.forEach(region => {
        entry[region] = regionalAmbitionData[region]?.[cat.id] ?? 0;
      });
      return entry;
    });
  }, [regionalAmbitionData]);

  return (
    <div className="w-full h-full overflow-auto bg-slate-50">
      <div className="max-w-[1600px] mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Commitment Statements Analysis
          </h1>
          <p className="text-lg text-slate-600">
            What are cities actually committing to when they publish a VLR?
          </p>
          <p className="text-sm text-slate-500 mt-1 italic">
            11 of 17 SDGs show a Large Gap between challenges and commitments. 53% of commitments are plans about plans.
          </p>
        </div>

        {/* Strategic Value */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Strategic Value</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border-l-4 border-green-500 pl-4">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <Target className="w-5 h-5" />
                <div className="font-semibold">Ambition Assessment</div>
              </div>
              <div className="text-sm text-slate-600">
                Reveals where ambition is high versus symbolic through specificity and resource analysis
              </div>
            </div>
            <div className="border-l-4 border-orange-500 pl-4">
              <div className="flex items-center gap-2 text-orange-700 mb-2">
                <AlertCircle className="w-5 h-5" />
                <div className="font-semibold">Gap Analysis</div>
              </div>
              <div className="text-sm text-slate-600">
                Compares identified challenges with stated commitments to find implementation gaps
              </div>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <div className="flex items-center gap-2 text-blue-700 mb-2">
                <TrendingUp className="w-5 h-5" />
                <div className="font-semibold">Foresight Bridge</div>
              </div>
              <div className="text-sm text-slate-600">
                Creates pathway from current state to implementation discussions and accountability
              </div>
            </div>
          </div>
        </div>

        {/* SDG Selector */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Select SDG for Detailed Analysis</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-3">
            {Array.from({ length: 17 }, (_, i) => i + 1).map(sdgId => (
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

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Filter:</span>
            </div>

            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Challenge-Commitment Gap Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Where Are Cities' Commitments Falling Short?
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Comparing the intensity of identified challenges versus commitment strength across all SDGs
            </p>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={gapAnalysisByRegion[selectedRegion]} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="sdg"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  label={{ value: 'SDG', position: 'insideBottom', offset: -50 }}
                />
                <YAxis label={{ value: 'Intensity (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="challengeIntensity" name="Challenge Intensity" fill="#ef4444" />
                <Bar dataKey="commitmentIntensity" name="Commitment Intensity" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="text-sm text-orange-800">
                <strong>Gap Insight:</strong> SDG 13 (Climate Action) shows the largest gap at −37 points, while SDG 11 (Sustainable Cities) is the only goal where commitments exceed challenges. Cities are over-planning where they're comfortable and under-committing where it matters most.
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              SDG {selectedSDG} Profile
            </h3>
            <p className="text-sm text-slate-600 mb-4">{getSDGName(selectedSDG)}</p>

            <div className="space-y-4">
              <div className="border border-slate-200 rounded-lg p-4">
                <div className="text-sm font-medium text-slate-700 mb-2">Commitment Breakdown</div>
                {COMMITMENT_CATEGORIES.map(cat => {
                  const value = selectedSDGData?.[cat.id] || 0;
                  const meta = COMMITMENT_ICON_MAP[cat.id];
                  return (
                    <div key={cat.id} className="mb-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-slate-700">{meta.shortName}</span>
                        <span className="font-medium text-slate-900">{value}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{ width: `${value}%`, backgroundColor: cat.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border border-slate-200 rounded-lg p-4">
                <div className="text-sm font-medium text-slate-700 mb-2">Ambition Metrics</div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Specificity Score</span>
                    <span className="font-semibold text-slate-900">{selectedSDGData?.specificity}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Resource Commitment</span>
                    <span className="font-semibold text-slate-900">{selectedSDGData?.resourceCommitment}%</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-2 italic">
                    {selectedSDGData?.specificity > 60 ? 'High specificity suggests actionable, measurable commitments.' : 'Low specificity suggests aspirational language without concrete targets.'}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Total Commitments</span>
                    <span className="font-semibold text-slate-900">{selectedSDGData?.totalCommitments}</span>
                  </div>
                </div>
              </div>

              {selectedGapData && (
                <div className={`border rounded-lg p-4 ${
                  selectedGapData.gapCategory === 'Large Gap' ? 'border-red-300 bg-red-50' :
                  selectedGapData.gapCategory === 'Moderate Gap' ? 'border-yellow-300 bg-yellow-50' :
                  'border-green-300 bg-green-50'
                }`}>
                  <div className="text-sm font-medium text-slate-900 mb-2">Challenge-Commitment Gap</div>
                  <div className={`text-xs font-medium ${
                    selectedGapData.gapCategory === 'Large Gap' ? 'text-red-700' :
                    selectedGapData.gapCategory === 'Moderate Gap' ? 'text-yellow-700' :
                    'text-green-700'
                  }`}>
                    {selectedGapData.gapCategory}
                  </div>
                  <div className="text-xs text-slate-600 mt-2">
                    Challenges: {selectedGapData.challengeIntensity}% | Commitments: {selectedGapData.commitmentIntensity}%
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Regional Ambition & Timeframe */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              How Do Regions' Strategies Differ?
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Commitment type preferences by region
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {REGIONS.map((region, idx) => {
                const colors = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444'];
                return (
                  <button
                    key={region}
                    onClick={() => {
                      setRadarRegions(prev => {
                        if (prev.includes(region)) {
                          return prev.length > 1 ? prev.filter(r => r !== region) : prev;
                        }
                        return prev.length >= 4 ? prev : [...prev, region];
                      });
                    }}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      radarRegions.includes(region)
                        ? 'text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                    style={radarRegions.includes(region) ? { backgroundColor: colors[idx % colors.length] } : undefined}
                  >
                    {region}
                  </button>
                );
              })}
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="type" tick={{ fontSize: 9, fontWeight: 600 }} />
                <PolarRadiusAxis angle={90} domain={[0, 80]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                {radarRegions.map((region) => {
                  const colors = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444'];
                  return (
                    <Radar
                      key={region}
                      name={region}
                      dataKey={region}
                      stroke={colors[REGIONS.indexOf(region) % colors.length]}
                      fill={colors[REGIONS.indexOf(region) % colors.length]}
                      fillOpacity={0.2}
                    />
                  );
                })}
              </RadarChart>
            </ResponsiveContainer>
            <div className="mt-4 text-sm text-slate-600">
              <strong>Regional Patterns:</strong> Europe shows stronger data/monitoring commitments,
              while Asia-Pacific focuses on strategies. Africa faces investment commitment challenges
              due to resource constraints.
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              How Are Cities Sequencing Their Actions?
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              When do cities plan to deliver on commitments?
            </p>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={timeframeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis type="category" dataKey="timeframe" width={150} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                {COMMITMENT_CATEGORIES.map(cat => (
                  <Bar
                    key={cat.id}
                    dataKey={cat.id}
                    name={COMMITMENT_ICON_MAP[cat.id].shortName}
                    stackId="a"
                    fill={cat.color}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 text-sm text-slate-600">
              <strong>Temporal Insight:</strong> Policy reforms cluster in medium-term (3-5 years),
              infrastructure investments in long-term (5+ years), while data improvements show
              more short-term action.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
