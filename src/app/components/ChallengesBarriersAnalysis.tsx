import { useState, useMemo } from 'react';
// recharts removed — slope chart is pure SVG
import { Network, Shield, Database, DollarSign, Clock, Scale, BookOpen, Layers, Puzzle, Flag, MessageCircle, Zap, HeartHandshake, MoreHorizontal } from 'lucide-react';
import { Tooltip as UITooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import type { LucideIcon } from 'lucide-react';
import { REGIONS, CHALLENGE_CATEGORIES, ChallengeId, getSDGName } from './data/constants';
import challengeRaw from '@/data/generated/challenge-distribution.json';
import temporalRaw from '@/data/generated/temporal-trends.json';

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

type ChallengeItem = { sdgId: number; categoryId: string; region: string; year: number; count: number };
type TemporalItem = { itemType: string; categoryId: string; year: number; count: number };

const challengeData = challengeRaw as ChallengeItem[];
const temporalData = (temporalRaw as TemporalItem[]).filter(t => t.itemType === 'Challenge');
const regions = [...REGIONS];

// Pre-compute challenge intensities per SDG (percentage of total challenges for that SDG)
function buildSDGChallengeData() {
  const sdgIds = Array.from({ length: 17 }, (_, i) => i + 1);

  return sdgIds.map(sdgId => {
    // Global totals
    const sdgItems = challengeData.filter(d => d.sdgId === sdgId);
    const totalCount = sdgItems.reduce((s, d) => s + d.count, 0);
    const challenges: Record<string, number> = {};
    CHALLENGE_CATEGORIES.forEach(cat => {
      const catCount = sdgItems.filter(d => d.categoryId === cat.id).reduce((s, d) => s + d.count, 0);
      challenges[cat.id] = totalCount > 0 ? Math.round((catCount / totalCount) * 100) : 0;
    });

    // Regional breakdown
    const regionalBreakdown: Record<string, Record<string, number>> = {};
    regions.forEach(region => {
      const regionItems = sdgItems.filter(d => d.region === region);
      const regionTotal = regionItems.reduce((s, d) => s + d.count, 0);
      const breakdown: Record<string, number> = {};
      CHALLENGE_CATEGORIES.forEach(cat => {
        const catCount = regionItems.filter(d => d.categoryId === cat.id).reduce((s, d) => s + d.count, 0);
        breakdown[cat.id] = regionTotal > 0 ? Math.round((catCount / regionTotal) * 100) : 0;
      });
      regionalBreakdown[region] = breakdown;
    });

    return { sdg: sdgId, challenges, regionalBreakdown };
  });
}

const sdgChallengeData = buildSDGChallengeData();

// Build temporal trend data from DB
function buildTemporalEvolution() {
  const years = [...new Set(temporalData.map(t => t.year))].sort((a, b) => a - b);

  return years.map(year => {
    const yearItems = temporalData.filter(t => t.year === year);
    const totalCount = yearItems.reduce((s, t) => s + t.count, 0);
    const entry: any = { period: String(year) };
    CHALLENGE_CATEGORIES.forEach(cat => {
      const catCount = yearItems.filter(t => t.categoryId === cat.id).reduce((s, t) => s + t.count, 0);
      entry[cat.id] = totalCount > 0 ? Math.round((catCount / totalCount) * 100) : 0;
    });
    return entry;
  });
}

const temporalEvolution = buildTemporalEvolution();

export function ChallengesBarriersAnalysis() {
  const [selectedChallenge, setSelectedChallenge] = useState<string>('fiscal_financial');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [hoveredSDG, setHoveredSDG] = useState<number | null>(null);
  const [hoveredSlope, setHoveredSlope] = useState<string | null>(null);

  // Dynamic threshold: mean + 0.5*stdev for the selected category
  // This ensures ~30-40% of SDGs are connected regardless of category baseline
  const connectedSDGs = useMemo(() => {
    const values = sdgChallengeData.map(d => {
      if (selectedRegion === 'All') {
        return d.challenges[selectedChallenge] || 0;
      } else {
        return d.regionalBreakdown[selectedRegion]?.[selectedChallenge] || 0;
      }
    });

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdev = Math.sqrt(values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length);
    const dynamicThreshold = mean + 0.5 * stdev;

    return sdgChallengeData
      .filter((_, i) => values[i] > dynamicThreshold)
      .map(d => d.sdg);
  }, [selectedChallenge, selectedRegion]);

  // Max value for the selected challenge across all SDGs (for node normalization)
  const maxChallengeValue = useMemo(() => {
    const values = sdgChallengeData.map(d => {
      if (selectedRegion === 'All') return d.challenges[selectedChallenge] || 0;
      return d.regionalBreakdown[selectedRegion]?.[selectedChallenge] || 0;
    });
    return Math.max(...values, 1);
  }, [selectedChallenge, selectedRegion]);

  const selectedChallengeDetails = useMemo(() => {
    const cat = CHALLENGE_CATEGORIES.find(c => c.id === selectedChallenge);
    if (!cat) return null;
    return { id: cat.id, name: cat.name, color: cat.color, icon: CHALLENGE_ICON_MAP[cat.id as ChallengeId].icon };
  }, [selectedChallenge]);

  // Regional prevalence for the selected challenge (reactive)
  const regionalPrevalence = useMemo(() => {
    return regions.map(region => {
      const regionItems = challengeData.filter(d => d.region === region);
      const totalCount = regionItems.reduce((s, d) => s + d.count, 0);
      const catCount = regionItems.filter(d => d.categoryId === selectedChallenge).reduce((s, d) => s + d.count, 0);
      return {
        region,
        pct: totalCount > 0 ? Math.round((catCount / totalCount) * 1000) / 10 : 0,
      };
    }).sort((a, b) => b.pct - a.pct);
  }, [selectedChallenge]);

  // Slope chart data: 2019 vs 2025 for all challenge categories
  const slopeData = useMemo(() => {
    const startYear = temporalEvolution.find(d => Number(d.period) === 2019);
    const endYear = temporalEvolution.find(d => Number(d.period) === 2025);
    if (!startYear || !endYear) return [];
    return CHALLENGE_CATEGORIES
      .filter(cat => cat.id !== 'other_challenge')
      .map(cat => ({
        id: cat.id,
        name: CHALLENGE_ICON_MAP[cat.id as ChallengeId].shortName,
        color: cat.color,
        start: (startYear as any)[cat.id] || 0,
        end: (endYear as any)[cat.id] || 0,
        change: ((endYear as any)[cat.id] || 0) - ((startYear as any)[cat.id] || 0),
      }))
      .sort((a, b) => b.change - a.change);
  }, []);

  return (
    <div className="w-full h-full overflow-auto bg-slate-50">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Challenges & Barriers Analysis
          </h1>
          <p className="text-lg text-slate-600">
            What do cities consistently identify as their main constraints to SDG implementation?
          </p>
        </div>

        {/* Challenge Selector */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Select Challenge Type</h3>
          <div className="flex flex-wrap gap-2 items-center">
            {CHALLENGE_CATEGORIES.map(cat => {
              const meta = CHALLENGE_ICON_MAP[cat.id];
              const Icon = meta.icon;
              const isSelected = selectedChallenge === cat.id;
              return (
                <UITooltip key={cat.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setSelectedChallenge(cat.id)}
                      className={`flex items-center gap-2 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-current shadow-lg px-4 py-2'
                          : 'border-slate-200 hover:border-slate-300 p-2'
                      }`}
                      style={{ color: isSelected ? cat.color : undefined }}
                    >
                      <Icon className={isSelected ? 'w-6 h-6' : 'w-5 h-5 text-slate-500'} />
                      {isSelected && <span className="text-sm font-medium">{meta.shortName}</span>}
                    </button>
                  </TooltipTrigger>
                  {!isSelected && (
                    <TooltipContent className="max-w-xs">
                      <p className="font-medium">{meta.shortName}</p>
                      <p className="mt-1 opacity-80">{cat.description}</p>
                    </TooltipContent>
                  )}
                </UITooltip>
              );
            })}
          </div>
          {selectedChallengeDetails && (
            <p className="mt-3 text-sm text-slate-600 italic">
              {CHALLENGE_CATEGORIES.find(c => c.id === selectedChallenge)?.description}
            </p>
          )}
        </div>

        {/* Network Visualization */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Which SDGs Face This Challenge Together? — {selectedChallengeDetails?.name}
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                SDGs connected by shared challenge barriers
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
            <div className="bg-slate-50 rounded-lg p-8 min-h-[650px] border-2 border-slate-200">
              <svg width="100%" height="650" className="overflow-visible">
                {/* Draw connections */}
                {connectedSDGs.map((sdg1, i) =>
                  connectedSDGs.slice(i + 1).map((sdg2) => {
                    const angle1 = (sdg1 - 1) * (2 * Math.PI / 17);
                    const angle2 = (sdg2 - 1) * (2 * Math.PI / 17);
                    const radius = 250;
                    const centerX = 450;
                    const centerY = 325;

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
                  const radius = 250;
                  const centerX = 450;
                  const centerY = 325;
                  const x = centerX + radius * Math.cos(angle - Math.PI / 2);
                  const y = centerY + radius * Math.sin(angle - Math.PI / 2);
                  const isConnected = connectedSDGs.includes(sdg);

                  const sdgEntry = sdgChallengeData.find(d => d.sdg === sdg);
                  const value = selectedRegion === 'All'
                    ? sdgEntry?.challenges[selectedChallenge] || 0
                    : sdgEntry?.regionalBreakdown[selectedRegion]?.[selectedChallenge] || 0;
                  const normalizedValue = maxChallengeValue > 0 ? Math.min(value / maxChallengeValue, 1) : 0;
                  const circleRadius = 18 + normalizedValue * 14;
                  const fillOpacity = 0.3 + normalizedValue * 0.7;
                  const challengeColor = selectedChallengeDetails?.color || '#3b82f6';

                  return (
                    <g key={sdg} onMouseEnter={() => setHoveredSDG(sdg)} onMouseLeave={() => setHoveredSDG(null)}>
                      <circle
                        cx={x}
                        cy={y}
                        r={circleRadius}
                        fill={challengeColor}
                        fillOpacity={fillOpacity}
                        stroke={isConnected ? '#fff' : challengeColor}
                        strokeWidth={isConnected ? 3 : 1}
                        strokeOpacity={isConnected ? 1 : 0.4}
                        className="transition-all cursor-pointer"
                      />
                      <text
                        x={x}
                        y={y}
                        textAnchor="middle"
                        dy="0.35em"
                        className="text-sm font-bold pointer-events-none"
                        fill={fillOpacity > 0.6 ? '#fff' : '#334155'}
                      >
                        {sdg}
                      </text>
                      {isConnected && (
                        <text
                          x={x}
                          y={y + circleRadius + 14}
                          textAnchor="middle"
                          className="text-xs font-medium pointer-events-none"
                          fill="#475569"
                        >
                          {getSDGName(sdg)}
                        </text>
                      )}
                      {hoveredSDG === sdg && (
                        <foreignObject x={x - 60} y={y - circleRadius - 35} width="120" height="40">
                          <div className="bg-white border border-slate-300 rounded-lg shadow-lg px-2 py-1 text-center">
                            <div className="text-xs font-semibold text-slate-900">{getSDGName(sdg)}</div>
                            <div className="text-xs text-slate-600">{value}%</div>
                          </div>
                        </foreignObject>
                      )}
                    </g>
                  );
                })}

                {/* Center label */}
                <text x="450" y="325" textAnchor="middle" className="text-lg font-bold" fill="#1e293b">
                  {selectedChallengeDetails?.name}
                </text>
                <text x="450" y="345" textAnchor="middle" className="text-sm" fill="#64748b">
                  {connectedSDGs.length} SDGs Connected
                </text>
              </svg>
            </div>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 border-l-4 border-l-blue-500 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>Network Insight:</strong> {connectedSDGs.length} SDGs share notable intensity of{' '}
                <strong>{selectedChallengeDetails?.name}</strong> challenges
                {selectedRegion !== 'All' && ` in ${selectedRegion}`}.
                This indicates a {connectedSDGs.length > 10 ? 'universal structural bottleneck' : 'SDG-specific barrier pattern'} requiring
                {connectedSDGs.length > 10 ? ' system-level interventions.' : ' targeted solutions.'}
              </div>
            </div>
          </div>
        </div>

        {/* Reactive panels: Regional prevalence + Temporal trend for selected challenge */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Left: Where is this challenge most prevalent? */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
              <Network className="w-5 h-5" style={{ color: selectedChallengeDetails?.color }} />
              Where Is {selectedChallengeDetails?.name || 'This Challenge'} Most Prevalent?
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Share of all challenges in each region that fall into this category.
            </p>
            <div className="space-y-3">
              {regionalPrevalence.map(({ region, pct }) => {
                const maxPct = regionalPrevalence[0]?.pct || 1;
                return (
                  <div key={region} className="flex items-center gap-3">
                    <div className="w-36 text-right text-sm font-medium text-slate-700 truncate">
                      {region}
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                        <div
                          className="h-5 rounded-full transition-all duration-300"
                          style={{
                            width: `${maxPct > 0 ? (pct / maxPct) * 100 : 0}%`,
                            backgroundColor: selectedChallengeDetails?.color || '#3b82f6',
                          }}
                        />
                      </div>
                      <span className="text-sm font-bold tabular-nums w-12 text-right" style={{ color: selectedChallengeDetails?.color }}>
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Slope chart — how has each challenge's share shifted 2019→2025 */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              How Have Challenge Priorities Shifted?
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Share of all challenges in 2019 vs 2025. Rising lines = growing concern.
            </p>
            {slopeData.length > 0 && (() => {
              const w = 400, h = 380;
              const padTop = 20, padBot = 30, padLeft = 10, padRight = 10;
              const colLeft = padLeft + 100;
              const colRight = w - padRight - 100;
              const maxVal = Math.max(...slopeData.flatMap(d => [d.start, d.end]), 1);
              const scaleY = (v: number) => padTop + ((maxVal - v) / maxVal) * (h - padTop - padBot);

              return (
                <div className="flex justify-center">
                  <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-md" style={{ fontFamily: 'system-ui, sans-serif' }}>
                    {/* Column headers */}
                    <text x={colLeft} y={12} textAnchor="middle" fontSize={12} fontWeight={600} fill="#475569">2019</text>
                    <text x={colRight} y={12} textAnchor="middle" fontSize={12} fontWeight={600} fill="#475569">2025</text>

                    {/* Vertical axes */}
                    <line x1={colLeft} y1={padTop} x2={colLeft} y2={h - padBot} stroke="#e2e8f0" />
                    <line x1={colRight} y1={padTop} x2={colRight} y2={h - padBot} stroke="#e2e8f0" />

                    {/* Slope lines */}
                    {slopeData.map(d => {
                      const isSelected = d.id === selectedChallenge;
                      const isHovered = d.id === hoveredSlope;
                      const highlighted = isSelected || isHovered;
                      const y1 = scaleY(d.start);
                      const y2 = scaleY(d.end);
                      return (
                        <g
                          key={d.id}
                          opacity={highlighted ? 1 : 0.2}
                          style={{ cursor: 'pointer' }}
                          onMouseEnter={() => setHoveredSlope(d.id)}
                          onMouseLeave={() => setHoveredSlope(null)}
                        >
                          {/* Invisible wider hit area for easier hovering */}
                          <line
                            x1={colLeft} y1={y1} x2={colRight} y2={y2}
                            stroke="transparent"
                            strokeWidth={12}
                          />
                          <line
                            x1={colLeft} y1={y1} x2={colRight} y2={y2}
                            stroke={d.color}
                            strokeWidth={highlighted ? 3 : 1.5}
                          />
                          {/* Left dot + label */}
                          <circle cx={colLeft} cy={y1} r={highlighted ? 5 : 3} fill={d.color} />
                          <text x={colLeft - 8} y={y1 + 4} textAnchor="end"
                            fontSize={highlighted ? 11 : 9} fill={d.color} fontWeight={highlighted ? 700 : 400}>
                            {d.start}%
                          </text>
                          {/* Right dot + label */}
                          <circle cx={colRight} cy={y2} r={highlighted ? 5 : 3} fill={d.color} />
                          <text x={colRight + 8} y={y2 + 4} textAnchor="start"
                            fontSize={highlighted ? 11 : 9} fill={d.color} fontWeight={highlighted ? 700 : 400}>
                            {d.end}%
                          </text>
                          {/* Name label on highlighted line */}
                          {highlighted && (
                            <text x={(colLeft + colRight) / 2} y={Math.min(y1, y2) - 10} textAnchor="middle"
                              fontSize={11} fill={d.color} fontWeight={700}>
                              {d.name} ({d.change > 0 ? '+' : ''}{d.change.toFixed(1)}pp)
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
