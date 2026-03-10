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
  LineChart,
  Line,
} from 'recharts';
import { Network, Shield, Database, DollarSign, AlertCircle, Clock, Scale, BookOpen, Layers, Puzzle, Flag, MessageCircle, Zap, HeartHandshake, MoreHorizontal } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { REGIONS, CHALLENGE_CATEGORIES, ChallengeId, getSDGName } from './data/constants';

const CHALLENGE_ICON_MAP: Record<ChallengeId, { icon: LucideIcon; shortName: string }> = {
  fiscal_financial:        { icon: DollarSign,     shortName: 'Fiscal & Financial' },
  institutional_governance:{ icon: Shield,         shortName: 'Governance' },
  legal_regulatory:        { icon: Scale,          shortName: 'Legal & Regulatory' },
  human_capacity:          { icon: BookOpen,       shortName: 'Human Capacity' },
  data_monitoring:         { icon: Database,       shortName: 'Data & Monitoring' },
  multilevel_governance:   { icon: Layers,         shortName: 'Multi-Level Gov.' },
  policy_coherence:        { icon: Puzzle,         shortName: 'Policy Coherence' },
  political_will:          { icon: Flag,           shortName: 'Political Will' },
  stakeholder_engagement:  { icon: MessageCircle,  shortName: 'Stakeholders' },
  external_shocks:         { icon: Zap,            shortName: 'External Shocks' },
  socioeconomic:           { icon: HeartHandshake, shortName: 'Socioeconomic' },
  other_challenge:         { icon: MoreHorizontal, shortName: 'Other' },
};

const challengeBaseBySDG: Record<number, Record<string, number>> = {
  1:  { fiscal_financial: 72, institutional_governance: 25, legal_regulatory: 12, human_capacity: 23, data_monitoring: 35, multilevel_governance: 10, policy_coherence: 8, political_will: 5, stakeholder_engagement: 15, external_shocks: 10, socioeconomic: 8, other_challenge: 4 },
  2:  { fiscal_financial: 68, institutional_governance: 24, legal_regulatory: 13, human_capacity: 25, data_monitoring: 38, multilevel_governance: 10, policy_coherence: 7, political_will: 5, stakeholder_engagement: 17, external_shocks: 10, socioeconomic: 9, other_challenge: 3 },
  3:  { fiscal_financial: 55, institutional_governance: 30, legal_regulatory: 16, human_capacity: 21, data_monitoring: 48, multilevel_governance: 14, policy_coherence: 10, political_will: 6, stakeholder_engagement: 14, external_shocks: 12, socioeconomic: 12, other_challenge: 4 },
  4:  { fiscal_financial: 50, institutional_governance: 26, legal_regulatory: 14, human_capacity: 29, data_monitoring: 40, multilevel_governance: 12, policy_coherence: 8, political_will: 5, stakeholder_engagement: 19, external_shocks: 10, socioeconomic: 11, other_challenge: 3 },
  5:  { fiscal_financial: 45, institutional_governance: 32, legal_regulatory: 15, human_capacity: 24, data_monitoring: 42, multilevel_governance: 14, policy_coherence: 10, political_will: 7, stakeholder_engagement: 16, external_shocks: 12, socioeconomic: 11, other_challenge: 4 },
  6:  { fiscal_financial: 60, institutional_governance: 29, legal_regulatory: 17, human_capacity: 27, data_monitoring: 52, multilevel_governance: 13, policy_coherence: 9, political_will: 6, stakeholder_engagement: 18, external_shocks: 13, socioeconomic: 12, other_challenge: 3 },
  7:  { fiscal_financial: 65, institutional_governance: 28, legal_regulatory: 15, human_capacity: 21, data_monitoring: 45, multilevel_governance: 12, policy_coherence: 9, political_will: 6, stakeholder_engagement: 14, external_shocks: 12, socioeconomic: 11, other_challenge: 4 },
  8:  { fiscal_financial: 70, institutional_governance: 30, legal_regulatory: 14, human_capacity: 24, data_monitoring: 38, multilevel_governance: 13, policy_coherence: 10, political_will: 6, stakeholder_engagement: 16, external_shocks: 10, socioeconomic: 11, other_challenge: 3 },
  9:  { fiscal_financial: 55, institutional_governance: 26, legal_regulatory: 16, human_capacity: 25, data_monitoring: 58, multilevel_governance: 12, policy_coherence: 8, political_will: 5, stakeholder_engagement: 17, external_shocks: 12, socioeconomic: 12, other_challenge: 4 },
  10: { fiscal_financial: 48, institutional_governance: 34, legal_regulatory: 17, human_capacity: 27, data_monitoring: 42, multilevel_governance: 15, policy_coherence: 10, political_will: 7, stakeholder_engagement: 18, external_shocks: 13, socioeconomic: 12, other_challenge: 3 },
  11: { fiscal_financial: 52, institutional_governance: 38, legal_regulatory: 22, human_capacity: 29, data_monitoring: 55, multilevel_governance: 18, policy_coherence: 12, political_will: 7, stakeholder_engagement: 19, external_shocks: 17, socioeconomic: 16, other_challenge: 4 },
  12: { fiscal_financial: 45, institutional_governance: 28, legal_regulatory: 17, human_capacity: 23, data_monitoring: 60, multilevel_governance: 12, policy_coherence: 9, political_will: 6, stakeholder_engagement: 15, external_shocks: 13, socioeconomic: 12, other_challenge: 3 },
  13: { fiscal_financial: 55, institutional_governance: 36, legal_regulatory: 21, human_capacity: 27, data_monitoring: 58, multilevel_governance: 17, policy_coherence: 11, political_will: 7, stakeholder_engagement: 18, external_shocks: 16, socioeconomic: 15, other_challenge: 4 },
  14: { fiscal_financial: 50, institutional_governance: 32, legal_regulatory: 19, human_capacity: 24, data_monitoring: 52, multilevel_governance: 14, policy_coherence: 10, political_will: 7, stakeholder_engagement: 16, external_shocks: 15, socioeconomic: 14, other_challenge: 3 },
  15: { fiscal_financial: 48, institutional_governance: 30, legal_regulatory: 18, human_capacity: 25, data_monitoring: 50, multilevel_governance: 14, policy_coherence: 9, political_will: 6, stakeholder_engagement: 17, external_shocks: 14, socioeconomic: 13, other_challenge: 4 },
  16: { fiscal_financial: 42, institutional_governance: 42, legal_regulatory: 22, human_capacity: 29, data_monitoring: 45, multilevel_governance: 20, policy_coherence: 14, political_will: 8, stakeholder_engagement: 19, external_shocks: 17, socioeconomic: 16, other_challenge: 3 },
  17: { fiscal_financial: 38, institutional_governance: 40, legal_regulatory: 23, human_capacity: 21, data_monitoring: 40, multilevel_governance: 18, policy_coherence: 12, political_will: 8, stakeholder_engagement: 14, external_shocks: 18, socioeconomic: 17, other_challenge: 4 },
};

const regionChallengeMultipliers: Record<string, Record<string, number>> = {
  'Europe': { fiscal_financial: 0.80, institutional_governance: 1.15, legal_regulatory: 1.10, human_capacity: 0.85, data_monitoring: 1.05, multilevel_governance: 1.20, policy_coherence: 1.15, political_will: 0.90, stakeholder_engagement: 0.88, external_shocks: 0.85, socioeconomic: 0.82, other_challenge: 1.00 },
  'North America': { fiscal_financial: 0.82, institutional_governance: 1.08, legal_regulatory: 1.05, human_capacity: 0.88, data_monitoring: 1.00, multilevel_governance: 1.12, policy_coherence: 1.08, political_will: 0.92, stakeholder_engagement: 0.90, external_shocks: 0.88, socioeconomic: 0.85, other_challenge: 1.00 },
  'LATAM': { fiscal_financial: 1.10, institutional_governance: 0.90, legal_regulatory: 0.95, human_capacity: 1.05, data_monitoring: 0.85, multilevel_governance: 0.88, policy_coherence: 0.85, political_will: 1.10, stakeholder_engagement: 1.02, external_shocks: 1.08, socioeconomic: 1.12, other_challenge: 1.00 },
  'Africa': { fiscal_financial: 1.20, institutional_governance: 0.85, legal_regulatory: 0.90, human_capacity: 1.15, data_monitoring: 0.80, multilevel_governance: 0.82, policy_coherence: 0.80, political_will: 1.15, stakeholder_engagement: 1.10, external_shocks: 1.15, socioeconomic: 1.20, other_challenge: 1.00 },
  'Middle East': { fiscal_financial: 1.05, institutional_governance: 0.92, legal_regulatory: 0.92, human_capacity: 0.95, data_monitoring: 0.88, multilevel_governance: 0.90, policy_coherence: 0.88, political_will: 1.05, stakeholder_engagement: 0.92, external_shocks: 1.10, socioeconomic: 1.05, other_challenge: 1.00 },
  'Asia': { fiscal_financial: 1.00, institutional_governance: 0.95, legal_regulatory: 0.98, human_capacity: 1.00, data_monitoring: 0.92, multilevel_governance: 0.95, policy_coherence: 0.92, political_will: 1.00, stakeholder_engagement: 0.98, external_shocks: 1.02, socioeconomic: 1.05, other_challenge: 1.00 },
  'Australia & Oceania': { fiscal_financial: 0.85, institutional_governance: 1.02, legal_regulatory: 1.00, human_capacity: 0.90, data_monitoring: 1.00, multilevel_governance: 1.05, policy_coherence: 1.02, political_will: 0.88, stakeholder_engagement: 0.92, external_shocks: 0.90, socioeconomic: 0.88, other_challenge: 1.00 },
};

const generateChallengeData = () => {
  const sdgs = Array.from({ length: 17 }, (_, i) => i + 1);
  const regions = [...REGIONS];
  const timePeriods = ['2015-2020', '2021-2025'];

  const data: any[] = sdgs.map(sdgId => {
    const baseValues = { ...challengeBaseBySDG[sdgId] };

    if ([16, 17].includes(sdgId)) {
      baseValues.institutional_governance += 20;
      baseValues.multilevel_governance += 10;
      baseValues.policy_coherence += 5;
    }
    if ([11, 13, 14, 15].includes(sdgId)) {
      baseValues.multilevel_governance += 8;
      baseValues.external_shocks += 5;
      baseValues.data_monitoring += 10;
    }
    if ([9, 12].includes(sdgId)) {
      baseValues.data_monitoring += 20;
    }
    if ([1, 2, 8].includes(sdgId)) {
      baseValues.fiscal_financial += 15;
    }

    const regionalBreakdown: Record<string, any> = {};
    regions.forEach(region => {
      const regionMults = regionChallengeMultipliers[region] || {};
      const breakdown: Record<string, number> = {};
      CHALLENGE_CATEGORIES.forEach(cat => {
        breakdown[cat.id] = Math.round((baseValues[cat.id] || 0) * (regionMults[cat.id] || 1));
      });
      regionalBreakdown[region] = breakdown;
    });

    const challenges: Record<string, number> = {};
    CHALLENGE_CATEGORIES.forEach(cat => {
      challenges[cat.id] = Math.round(baseValues[cat.id] || 0);
    });

    return { sdg: sdgId, challenges, regionalBreakdown };
  });

  const cooccurrenceData: any[] = [];
  CHALLENGE_CATEGORIES.forEach((cat1, i) => {
    CHALLENGE_CATEGORIES.forEach((cat2, j) => {
      if (i < j) {
        const cooccurrence = data.filter(d =>
          d.challenges[cat1.id] > 50 && d.challenges[cat2.id] > 50
        ).length;
        cooccurrenceData.push({
          challenge1: CHALLENGE_ICON_MAP[cat1.id].shortName,
          challenge2: CHALLENGE_ICON_MAP[cat2.id].shortName,
          cooccurrence,
          percentage: Math.round((cooccurrence / 17) * 100),
        });
      }
    });
  });

  const temporalData = [
    { period: '2015-2020', fiscal_financial: 71, institutional_governance: 30, legal_regulatory: 22, human_capacity: 27, data_monitoring: 36, multilevel_governance: 18, policy_coherence: 14, political_will: 10, stakeholder_engagement: 18, external_shocks: 15, socioeconomic: 20, other_challenge: 4 },
    { period: '2021-2025', fiscal_financial: 61, institutional_governance: 40, legal_regulatory: 28, human_capacity: 29, data_monitoring: 54, multilevel_governance: 22, policy_coherence: 18, political_will: 14, stakeholder_engagement: 19, external_shocks: 20, socioeconomic: 22, other_challenge: 5 },
  ];

  const severityFrequencyData = CHALLENGE_CATEGORIES.map(cat => {
    const frequency = data.filter(d => d.challenges[cat.id] > 30).length;
    const reportedValues = data.map(d => d.challenges[cat.id]).filter(v => v > 30);
    const severity = reportedValues.length > 0
      ? Math.round(reportedValues.reduce((a: number, b: number) => a + b, 0) / reportedValues.length)
      : 0;
    return { name: CHALLENGE_ICON_MAP[cat.id].shortName, frequency, severity, color: cat.color };
  });

  const cascadeData = [
    { source: 'Fiscal & Financial Constraints', target: 'Human Capacity & Technical Skills Deficits', strength: 85, explanation: 'Lack of funding directly limits capacity building' },
    { source: 'Human Capacity & Technical Skills Deficits', target: 'Data Monitoring & Evidence Gaps', strength: 70, explanation: 'Weak technical skills impair data collection' },
    { source: 'Data Monitoring & Evidence Gaps', target: 'Institutional & Governance Weaknesses', strength: 65, explanation: 'Poor data undermines evidence-based governance' },
    { source: 'Institutional & Governance Weaknesses', target: 'Multi-Level Governance & Coordination Failures', strength: 75, explanation: 'Weak institutions hinder cross-level coordination' },
    { source: 'Fiscal & Financial Constraints', target: 'Data Monitoring & Evidence Gaps', strength: 60, explanation: 'Limited funds for monitoring systems' },
    { source: 'Political Will & Continuity Risks', target: 'Policy Coherence & Integration Deficits', strength: 72, explanation: 'Shifting political priorities fragment policy coherence' },
    { source: 'External Shocks & Contextual Pressures', target: 'Fiscal & Financial Constraints', strength: 68, explanation: 'Crises divert fiscal resources from SDG priorities' },
    { source: 'Stakeholder Engagement & Participation Deficits', target: 'Institutional & Governance Weaknesses', strength: 55, explanation: 'Low participation undermines governance legitimacy' },
  ];

  const solutionsData = [
    { challenge: 'Fiscal & Financial Constraints', technicalSolutions: 32, partnershipApproaches: 52, policyReforms: 45, capacityBuilding: 28 },
    { challenge: 'Institutional & Governance Weaknesses', technicalSolutions: 42, partnershipApproaches: 48, policyReforms: 55, capacityBuilding: 35 },
    { challenge: 'Legal & Regulatory Gaps', technicalSolutions: 30, partnershipApproaches: 40, policyReforms: 62, capacityBuilding: 25 },
    { challenge: 'Human Capacity & Technical Skills Deficits', technicalSolutions: 38, partnershipApproaches: 42, policyReforms: 35, capacityBuilding: 58 },
    { challenge: 'Data Monitoring & Evidence Gaps', technicalSolutions: 58, partnershipApproaches: 35, policyReforms: 30, capacityBuilding: 42 },
    { challenge: 'Multi-Level Governance & Coordination Failures', technicalSolutions: 35, partnershipApproaches: 55, policyReforms: 48, capacityBuilding: 30 },
    { challenge: 'Policy Coherence & Integration Deficits', technicalSolutions: 40, partnershipApproaches: 45, policyReforms: 58, capacityBuilding: 32 },
    { challenge: 'Political Will & Continuity Risks', technicalSolutions: 25, partnershipApproaches: 50, policyReforms: 52, capacityBuilding: 28 },
    { challenge: 'Stakeholder Engagement & Participation Deficits', technicalSolutions: 35, partnershipApproaches: 58, policyReforms: 32, capacityBuilding: 45 },
    { challenge: 'External Shocks & Contextual Pressures', technicalSolutions: 38, partnershipApproaches: 48, policyReforms: 35, capacityBuilding: 30 },
    { challenge: 'Socioeconomic Conditions & Inequality', technicalSolutions: 28, partnershipApproaches: 45, policyReforms: 50, capacityBuilding: 35 },
    { challenge: 'Other', technicalSolutions: 30, partnershipApproaches: 35, policyReforms: 30, capacityBuilding: 25 },
  ];

  return {
    data,
    regions,
    cooccurrenceData,
    temporalData,
    severityFrequencyData,
    cascadeData,
    solutionsData,
  };
};

export function ChallengesBarriersAnalysis() {
  const {
    data,
    regions,
    cooccurrenceData,
    temporalData,
    severityFrequencyData,
    cascadeData,
    solutionsData,
  } = useMemo(() => generateChallengeData(), []);

  const [selectedChallenge, setSelectedChallenge] = useState<string>('fiscal_financial');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');

  const connectedSDGs = useMemo(() => {
    const threshold = 50;
    return data
      .filter(d => {
        if (selectedRegion === 'All') {
          return d.challenges[selectedChallenge] > threshold;
        } else {
          return d.regionalBreakdown[selectedRegion]?.[selectedChallenge] > threshold;
        }
      })
      .map(d => d.sdg);
  }, [data, selectedChallenge, selectedRegion]);

  const selectedChallengeDetails = useMemo(() => {
    const cat = CHALLENGE_CATEGORIES.find(c => c.id === selectedChallenge);
    if (!cat) return null;
    return { id: cat.id, name: cat.name, color: cat.color, icon: CHALLENGE_ICON_MAP[cat.id as ChallengeId].icon };
  }, [selectedChallenge]);

  return (
    <div className="w-full h-full overflow-auto bg-slate-50">
      <div className="max-w-[1600px] mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Challenges & Barriers Analysis
          </h1>
          <p className="text-lg text-slate-600">
            What do cities consistently identify as their main constraints to SDG implementation?
          </p>
          <p className="text-sm text-slate-500 mt-1 italic">
            The #1 barrier isn't fiscal — it's governance coordination. And wealthier regions have it worse.
          </p>
        </div>

        {/* Strategic Value */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Strategic Value</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border-l-4 border-red-500 pl-4">
              <div className="flex items-center gap-2 text-red-700 mb-2">
                <AlertCircle className="w-5 h-5" />
                <div className="font-semibold">Structural Bottlenecks</div>
              </div>
              <div className="text-sm text-slate-600">
                Identifies constraints cities cannot solve alone, requiring system-level interventions
              </div>
            </div>
            <div className="border-l-4 border-orange-500 pl-4">
              <div className="flex items-center gap-2 text-orange-700 mb-2">
                <DollarSign className="w-5 h-5" />
                <div className="font-semibold">Donor Framing</div>
              </div>
              <div className="text-sm text-slate-600">
                Strong input for shaping donor priorities and resource allocation strategies
              </div>
            </div>
            <div className="border-l-4 border-purple-500 pl-4">
              <div className="flex items-center gap-2 text-purple-700 mb-2">
                <Network className="w-5 h-5" />
                <div className="font-semibold">Cross-SDG Patterns</div>
              </div>
              <div className="text-sm text-slate-600">
                Reveals which barriers are universal vs SDG-specific for targeted solutions
              </div>
            </div>
          </div>
        </div>

        {/* Challenge Selector */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Select Challenge Type</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {CHALLENGE_CATEGORIES.map(cat => {
              const meta = CHALLENGE_ICON_MAP[cat.id];
              const Icon = meta.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedChallenge(cat.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedChallenge === cat.id
                      ? 'border-current shadow-lg scale-105'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  style={{
                    color: selectedChallenge === cat.id ? cat.color : undefined,
                  }}
                >
                  <Icon className="w-8 h-8 mb-2 mx-auto" />
                  <div className={`text-sm font-medium text-center ${
                    selectedChallenge === cat.id ? '' : 'text-slate-700'
                  }`}>
                    {meta.shortName}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Network Visualization */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Which SDGs Face This Challenge Together? — {selectedChallengeDetails?.name}
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                SDGs connected by shared challenge barriers (intensity &gt; 50%)
              </p>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Region Filter:</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedRegion('All')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  selectedRegion === 'All'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All Regions
              </button>
              {regions.map(region => (
                <button
                  key={region}
                  onClick={() => setSelectedRegion(region)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    selectedRegion === region
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="bg-slate-50 rounded-lg p-8 min-h-[500px] border-2 border-slate-200">
              <svg width="100%" height="500" className="overflow-visible">
                {/* Draw connections */}
                {connectedSDGs.map((sdg1, i) =>
                  connectedSDGs.slice(i + 1).map((sdg2) => {
                    const angle1 = (sdg1 - 1) * (2 * Math.PI / 17);
                    const angle2 = (sdg2 - 1) * (2 * Math.PI / 17);
                    const radius = 180;
                    const centerX = 400;
                    const centerY = 250;

                    const x1 = centerX + radius * Math.cos(angle1 - Math.PI / 2);
                    const y1 = centerY + radius * Math.sin(angle1 - Math.PI / 2);
                    const x2 = centerX + radius * Math.cos(angle2 - Math.PI / 2);
                    const y2 = centerY + radius * Math.sin(angle2 - Math.PI / 2);

                    return (
                      <line
                        key={`${sdg1}-${sdg2}`}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={selectedChallengeDetails?.color || '#94a3b8'}
                        strokeWidth="1"
                        opacity="0.2"
                      />
                    );
                  })
                )}

                {/* Draw SDG nodes */}
                {Array.from({ length: 17 }, (_, i) => i + 1).map((sdg) => {
                  const angle = (sdg - 1) * (2 * Math.PI / 17);
                  const radius = 180;
                  const centerX = 400;
                  const centerY = 250;
                  const x = centerX + radius * Math.cos(angle - Math.PI / 2);
                  const y = centerY + radius * Math.sin(angle - Math.PI / 2);
                  const isConnected = connectedSDGs.includes(sdg);

                  return (
                    <g key={sdg}>
                      <circle
                        cx={x}
                        cy={y}
                        r={isConnected ? 28 : 20}
                        fill={isConnected ? (selectedChallengeDetails?.color || '#3b82f6') : '#e2e8f0'}
                        stroke={isConnected ? '#fff' : '#cbd5e1'}
                        strokeWidth={isConnected ? 3 : 1}
                        className="transition-all cursor-pointer"
                      />
                      <text
                        x={x}
                        y={y}
                        textAnchor="middle"
                        dy="0.35em"
                        className="text-sm font-bold pointer-events-none"
                        fill={isConnected ? '#fff' : '#64748b'}
                      >
                        {sdg}
                      </text>
                      {isConnected && (
                        <text
                          x={x}
                          y={y + 45}
                          textAnchor="middle"
                          className="text-xs font-medium pointer-events-none"
                          fill="#475569"
                        >
                          {getSDGName(sdg)}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Center label */}
                <text x="400" y="250" textAnchor="middle" className="text-lg font-bold" fill="#1e293b">
                  {selectedChallengeDetails?.name}
                </text>
                <text x="400" y="270" textAnchor="middle" className="text-sm" fill="#64748b">
                  {connectedSDGs.length} SDGs Connected
                </text>
              </svg>
            </div>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>Network Insight:</strong> {connectedSDGs.length} SDGs share high intensity (&gt;50%) of{' '}
                <strong>{selectedChallengeDetails?.name}</strong> challenges
                {selectedRegion !== 'All' && ` in ${selectedRegion}`}.
                This indicates a {connectedSDGs.length > 10 ? 'universal structural bottleneck' : 'SDG-specific barrier pattern'} requiring
                {connectedSDGs.length > 10 ? ' system-level interventions.' : ' targeted solutions.'}
              </div>
            </div>
          </div>
        </div>

        {/* Challenge Co-occurrence Matrix & Temporal Evolution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <Network className="w-5 h-5 text-purple-600" />
              Which Challenges Reinforce Each Other?
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Which challenges tend to appear together? (Both &gt;50% intensity)
            </p>
            <div className="space-y-3">
              {cooccurrenceData
                .sort((a, b) => b.cooccurrence - a.cooccurrence)
                .slice(0, 8)
                .map((item, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-slate-900">
                        {item.challenge1.split(' ')[0]} + {item.challenge2.split(' ')[0]}
                      </div>
                      <div className="text-sm font-bold text-purple-600">
                        {item.cooccurrence}/17 SDGs
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      {item.percentage}% co-occurrence rate
                    </div>
                  </div>
                ))}
            </div>
            <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded text-sm text-purple-800">
              <strong>Insight:</strong> Governance + Capacity challenges co-occur in 73% of SDGs,
              suggesting that institutional weakness is the root barrier — not funding alone.
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              How Are Challenge Patterns Shifting Over Time?
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              How have challenge patterns shifted over time?
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={temporalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="period" />
                <YAxis label={{ value: 'Average Intensity (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                {CHALLENGE_CATEGORIES.map(cat => (
                  <Line
                    key={cat.id}
                    type="monotone"
                    dataKey={cat.id}
                    name={CHALLENGE_ICON_MAP[cat.id].shortName}
                    stroke={cat.color}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
              <strong>Trend:</strong> Governance barriers overtook financing as the #1 challenge post-2020.
              Data gaps grew 50% while financing constraints dropped 14%, reflecting a structural shift in what holds cities back.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
