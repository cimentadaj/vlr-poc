import { useState, useMemo, useRef, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { TrendingUp, Quote, Info } from 'lucide-react';
import { Tooltip as UITooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { REGIONS, POLICY_CATEGORIES, getSDGName } from './data/constants';
import policyRaw from '@/data/generated/policy-distribution.json';
import evidenceRaw from '@/data/generated/evidence-quotes.json';

const recommendationTypes = POLICY_CATEGORIES.map(p => p.name);
const typeColors: Record<string, string> = Object.fromEntries(POLICY_CATEGORIES.map(p => [p.name, p.color]));
const categoryIdToName: Record<string, string> = Object.fromEntries(POLICY_CATEGORIES.map(p => [p.id, p.name]));

const regions = [...REGIONS];
const sdgs = Array.from({ length: 17 }, (_, i) => i + 1);

const policyData = policyRaw as Array<{ sdgId: number; categoryId: string; region: string; year: number; count: number }>;
const evidenceData = (evidenceRaw as Array<any>).filter(e => e.itemType === 'Policy');

// Helper: compute percentage distribution from counts
function computeDistribution(items: Array<{ categoryId: string; count: number }>): Record<string, number> {
  const totals: Record<string, number> = {};
  let sum = 0;
  for (const item of items) {
    const name = categoryIdToName[item.categoryId];
    if (!name) continue;
    totals[name] = (totals[name] || 0) + item.count;
    sum += item.count;
  }
  if (sum === 0) return {};
  const result: Record<string, number> = {};
  for (const [name, count] of Object.entries(totals)) {
    result[name] = Math.round((count / sum) * 100);
  }
  return result;
}

const regionShort: Record<string, string> = {
  'Africa': 'AFR',
  'Arab States': 'ARB',
  'Asia & Pacific': 'AP',
  'Europe': 'EUR',
  'Latin America & Caribbean': 'LAC',
  'North America': 'NAM',
};

// Consistent SDG colors (spread across hue wheel)
const SDG_COLORS: Record<number, string> = {
  1: '#e5243b', 2: '#DDA63A', 3: '#4C9F38', 4: '#C5192D', 5: '#FF3A21',
  6: '#26BDE2', 7: '#FCC30B', 8: '#A21942', 9: '#FD6925', 10: '#DD1367',
  11: '#FD9D24', 12: '#BF8B2E', 13: '#3F7E44', 14: '#0A97D9', 15: '#56C02B',
  16: '#00689D', 17: '#19486A',
};

const REGION_COLORS: Record<string, string> = {
  'Africa': '#e5243b',
  'Arab States': '#A21942',
  'Asia & Pacific': '#FCC30B',
  'Europe': '#3F7E44',
  'Latin America & Caribbean': '#FD6925',
  'North America': '#00689D',
};

// Quadrant-based interpretations. Quadrant is defined by where the dot lands
// relative to the median (medX, medY) of all SDG centroids on the X/Y axes
// (X = Direct Investment %, Y = Strategic Planning %).
type Quadrant = 'comprehensive' | 'planning_led' | 'investment_led' | 'engagement_led';

const QUADRANT_LABEL: Record<Quadrant, string> = {
  comprehensive: 'Comprehensive',
  planning_led: 'Planning-led',
  investment_led: 'Investment-led',
  engagement_led: 'Engagement & partnership-led',
};

const QUADRANT_DESCRIPTION: Record<Quadrant, string> = {
  comprehensive:
    'Cities go all-in on this SDG — substantial direct investment AND strong strategic planning. Treated as a top-priority area where both money and frameworks line up.',
  planning_led:
    'Cities write plans, strategies and frameworks for this SDG but commit less direct funding. Heavy on strategy, lighter on execution-stage spending.',
  investment_led:
    'Cities pour direct investment and procurement into this SDG, but without a heavy strategic-planning wrapper. Action and capital outpace the policy frameworks around them.',
  engagement_led:
    'Cities address this SDG mainly through softer tools — partnerships, awareness campaigns and voluntary commitments — rather than dedicated funding or formal planning.',
};

function getQuadrant(x: number, y: number, medX: number, medY: number): Quadrant {
  const highX = x >= medX;
  const highY = y >= medY;
  if (highX && highY) return 'comprehensive';
  if (!highX && highY) return 'planning_led';
  if (highX && !highY) return 'investment_led';
  return 'engagement_led';
}

export function PolicyRecommendationSynthesis() {
  const [selectedSDG, setSelectedSDG] = useState<number | null>(11);
  const [activeRegion, setActiveRegion] = useState<string>('All');

  // Recommendation type distribution per SDG (bar chart)
  const recommendationTypeData = useMemo(() => {
    return sdgs.map(sdgId => {
      const items = policyData.filter(d => d.sdgId === sdgId);
      const dist = computeDistribution(items);
      return { sdg: sdgId, ...dist };
    });
  }, []);

  // Scatterplot data: centroids (global avg per SDG) + regional points
  const scatterData = useMemo(() => {
    return sdgs.map(sdgId => {
      const regionalPoints = regions.map(region => {
        const items = policyData.filter(d => d.sdgId === sdgId && d.region === region);
        const dist = computeDistribution(items);
        return {
          sdgId,
          region,
          regionShort: regionShort[region] || region,
          x: dist['Public Investment & Procurement'] || 0,
          y: dist['Strategic Planning & Policy Frameworks'] || 0,
          dominant: Object.entries(dist)
            .filter(([k]) => k !== 'Other')
            .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A',
          dominantPct: Object.entries(dist)
            .filter(([k]) => k !== 'Other')
            .sort((a, b) => b[1] - a[1])[0]?.[1] || 0,
        };
      });

      // Centroid = average across regions
      const cx = Math.round(regionalPoints.reduce((s, p) => s + p.x, 0) / regionalPoints.length);
      const cy = Math.round(regionalPoints.reduce((s, p) => s + p.y, 0) / regionalPoints.length);

      // Spread = max distance from centroid (a measure of disagreement)
      const spread = Math.round(Math.max(...regionalPoints.map(p =>
        Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2)
      )));

      return { sdgId, name: getSDGName(sdgId), cx, cy, spread, regionalPoints };
    });
  }, []);

  // Evidence quotes for selected SDG — one per country for diversity
  const topQuotes = useMemo(() => {
    if (selectedSDG === null) return [];
    const candidates = evidenceData.filter(e => e.sdgId === selectedSDG);
    const seen = new Set<string>();
    const result: typeof candidates = [];
    for (const q of candidates) {
      if (result.length >= 3) break;
      if (seen.has(q.country)) continue;
      seen.add(q.country);
      result.push(q);
    }
    return result;
  }, [selectedSDG]);

  // Calculate dominant recommendation type for selected SDG
  const dominantType = useMemo(() => {
    if (selectedSDG === null) return null;
    const sdgData = recommendationTypeData.find(d => d.sdg === selectedSDG);
    if (!sdgData) return null;

    let maxType = '';
    let maxValue = 0;
    recommendationTypes.forEach(type => {
      const val = (sdgData as any)[type] || 0;
      if (val > maxValue) {
        maxValue = val;
        maxType = type;
      }
    });
    return { type: maxType, value: maxValue };
  }, [selectedSDG, recommendationTypeData]);

  const [hoveredSDG, setHoveredSDG] = useState<number | null>(null);
  const detailRef = useRef<HTMLDivElement | null>(null);
  const isInitialMount = useRef(true);

  // Smooth-scroll to the detail panel when the user picks an SDG — but only
  // if the panel is currently below the viewport. Skips the initial mount so
  // we don't auto-scroll on first load (selectedSDG defaults to 11).
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (selectedSDG === null || !detailRef.current) return;
    const rect = detailRef.current.getBoundingClientRect();
    const isBelowFold = rect.top > window.innerHeight - 100;
    if (isBelowFold) {
      detailRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedSDG]);

  // Quadrant dividers (median X and Y across all SDG centroids)
  const medians = useMemo(() => {
    const xs = scatterData.map(s => s.cx).sort((a, b) => a - b);
    const ys = scatterData.map(s => s.cy).sort((a, b) => a - b);
    return {
      medX: xs[Math.floor(xs.length / 2)],
      medY: ys[Math.floor(ys.length / 2)],
    };
  }, [scatterData]);

  // Chart dimensions and scales
  const chartW = 700, chartH = 460;
  const margin = { top: 30, right: 30, bottom: 50, left: 60 };
  const plotW = chartW - margin.left - margin.right;
  const plotH = chartH - margin.top - margin.bottom;
  const xDomain = [0, 65] as const;
  const yDomain = [0, 50] as const;
  const scaleX = (v: number) => margin.left + ((v - xDomain[0]) / (xDomain[1] - xDomain[0])) * plotW;
  const scaleY = (v: number) => margin.top + plotH - ((v - yDomain[0]) / (yDomain[1] - yDomain[0])) * plotH;

  return (
    <div className="w-full h-full overflow-auto bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Policy Actions & Implementation
          </h1>
          <p className="text-lg text-slate-600">
            How are cities implementing policy actions across SDGs and regions?
          </p>
        </div>

        {/* Scatterplot — SDG policy landscape */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            Policy Approach Landscape
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Where an SDG falls shows how cities address it — through direct spending, strategic planning, or softer approaches like partnerships and awareness campaigns.
          </p>

          {/* Region selector */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setActiveRegion('All')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                activeRegion === 'All'
                  ? 'bg-slate-800 text-white border-transparent shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              All Regions
            </button>
            {regions.map(region => (
              <button
                key={region}
                onClick={() => setActiveRegion(region)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  activeRegion === region
                    ? 'text-white border-transparent shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
                style={activeRegion === region ? { backgroundColor: REGION_COLORS[region] } : undefined}
              >
                {region}
              </button>
            ))}
          </div>

          <div className="flex justify-center">
            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              className="w-full max-w-3xl"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              {/* Grid lines */}
              {[0, 10, 20, 30, 40, 50, 60].map(v => (
                <line key={`xg-${v}`} x1={scaleX(v)} y1={margin.top} x2={scaleX(v)} y2={margin.top + plotH}
                  stroke="#e2e8f0" strokeDasharray="3 3" />
              ))}
              {[0, 10, 20, 30, 40, 50].map(v => (
                <line key={`yg-${v}`} x1={margin.left} y1={scaleY(v)} x2={margin.left + plotW} y2={scaleY(v)}
                  stroke="#e2e8f0" strokeDasharray="3 3" />
              ))}

              {/* Quadrant dividers at median values */}
              <>
                <line x1={scaleX(medians.medX)} y1={margin.top} x2={scaleX(medians.medX)} y2={margin.top + plotH}
                  stroke="#94a3b8" strokeWidth={1} strokeDasharray="6 4" opacity={0.6} />
                <line x1={margin.left} y1={scaleY(medians.medY)} x2={margin.left + plotW} y2={scaleY(medians.medY)}
                  stroke="#94a3b8" strokeWidth={1} strokeDasharray="6 4" opacity={0.6} />
                <text x={margin.left + 4} y={margin.top + plotH - 4} textAnchor="start"
                  fontSize={11} fill="#94a3b8" fontWeight={500}>Engagement &amp; Partnership-led</text>
                <text x={margin.left + plotW - 4} y={margin.top + plotH - 4} textAnchor="end"
                  fontSize={11} fill="#94a3b8" fontWeight={500}>Investment-led</text>
                <text x={margin.left + plotW - 4} y={margin.top + 14} textAnchor="end"
                  fontSize={11} fill="#94a3b8" fontWeight={500}>Comprehensive</text>
                <text x={margin.left + 4} y={margin.top + 14} textAnchor="start"
                  fontSize={11} fill="#94a3b8" fontWeight={500}>Planning-led</text>
              </>

              {/* Axes */}
              <line x1={margin.left} y1={margin.top + plotH} x2={margin.left + plotW} y2={margin.top + plotH} stroke="#94a3b8" />
              <line x1={margin.left} y1={margin.top} x2={margin.left} y2={margin.top + plotH} stroke="#94a3b8" />

              {/* X tick labels */}
              {[0, 10, 20, 30, 40, 50, 60].map(v => (
                <text key={`xt-${v}`} x={scaleX(v)} y={margin.top + plotH + 18} textAnchor="middle"
                  fontSize={10} fill="#64748b">{v}%</text>
              ))}
              {/* Y tick labels */}
              {[0, 10, 20, 30, 40, 50].map(v => (
                <text key={`yt-${v}`} x={margin.left - 8} y={scaleY(v) + 4} textAnchor="end"
                  fontSize={10} fill="#64748b">{v}%</text>
              ))}

              {/* Axis labels */}
              <text x={margin.left + plotW / 2} y={chartH - 5} textAnchor="middle"
                fontSize={12} fill="#475569">Direct Investment →</text>
              <text x={15} y={margin.top + plotH / 2} textAnchor="middle"
                fontSize={12} fill="#475569" transform={`rotate(-90, 15, ${margin.top + plotH / 2})`}>Strategic Planning →</text>

              {/* Centroid dots — shown in "All Regions" mode */}
              {activeRegion === 'All' && scatterData.map(sdg => {
                const isSelected = selectedSDG === sdg.sdgId;
                const isHovered = hoveredSDG === sdg.sdgId;
                const r = isSelected ? 20 : isHovered ? 18 : 15;
                return (
                  <g
                    key={sdg.sdgId}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedSDG(isSelected ? null : sdg.sdgId)}
                    onMouseEnter={() => setHoveredSDG(sdg.sdgId)}
                    onMouseLeave={() => setHoveredSDG(null)}
                  >
                    <circle
                      cx={scaleX(sdg.cx)} cy={scaleY(sdg.cy)} r={r}
                      fill={SDG_COLORS[sdg.sdgId]}
                      stroke={isSelected ? '#1e293b' : 'white'}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                    />
                    <text
                      x={scaleX(sdg.cx)} y={scaleY(sdg.cy) + 1}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize={isSelected ? 11 : 10} fontWeight={700} fill="white"
                    >
                      {sdg.sdgId}
                    </text>
                  </g>
                );
              })}

              {/* Region view: show that region's dots with SDG colors */}
              {activeRegion !== 'All' && (() => {
                const region = activeRegion;
                return scatterData.map(sdg => {
                  const p = sdg.regionalPoints.find(rp => rp.region === region);
                  if (!p) return null;
                  const isSelected = selectedSDG === sdg.sdgId;
                  const isHovered = hoveredSDG === sdg.sdgId;
                  const r = isSelected ? 20 : isHovered ? 18 : 15;
                  return (
                    <g
                      key={`reg-${sdg.sdgId}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedSDG(isSelected ? null : sdg.sdgId)}
                      onMouseEnter={() => setHoveredSDG(sdg.sdgId)}
                      onMouseLeave={() => setHoveredSDG(null)}
                    >
                      <circle
                        cx={scaleX(p.x)} cy={scaleY(p.y)} r={r}
                        fill={SDG_COLORS[sdg.sdgId]}
                        stroke={isSelected ? '#1e293b' : 'white'}
                        strokeWidth={isSelected ? 2.5 : 1.5}
                      />
                      <text
                        x={scaleX(p.x)} y={scaleY(p.y) + 1}
                        textAnchor="middle" dominantBaseline="middle"
                        fontSize={isSelected ? 11 : 10} fontWeight={700} fill="white"
                      >
                        {sdg.sdgId}
                      </text>
                    </g>
                  );
                });
              })()}

              {/* Hover tooltip — SDG name + quadrant-specific interpretation */}
              {hoveredSDG !== null && (() => {
                const sdg = scatterData.find(s => s.sdgId === hoveredSDG)!;
                // Use the actual hovered dot's position (regional point if filtering by region)
                const point = activeRegion === 'All'
                  ? { x: sdg.cx, y: sdg.cy }
                  : sdg.regionalPoints.find(rp => rp.region === activeRegion) || { x: sdg.cx, y: sdg.cy };
                const dotX = scaleX(point.x);
                const dotY = scaleY(point.y);
                const quadrant = getQuadrant(point.x, point.y, medians.medX, medians.medY);
                const quadrantLabel = QUADRANT_LABEL[quadrant];
                const description = QUADRANT_DESCRIPTION[quadrant];

                const tooltipW = 340;
                const tooltipH = 145;
                // Default: above the dot. Flip below if would clip plot top.
                const desiredY = dotY - 16 - tooltipH;
                const flipDown = desiredY < margin.top + 2;
                const tooltipY = flipDown ? dotY + 22 : desiredY;
                // Clamp horizontally within plot area
                const tooltipX = Math.max(
                  margin.left,
                  Math.min(margin.left + plotW - tooltipW, dotX - tooltipW / 2),
                );

                return (
                  <g pointerEvents="none">
                    <rect
                      x={tooltipX}
                      y={tooltipY}
                      width={tooltipW}
                      height={tooltipH}
                      rx={6}
                      fill="white"
                      stroke="#cbd5e1"
                      strokeWidth={1}
                      filter="drop-shadow(0 2px 4px rgba(15,23,42,0.12))"
                    />
                    <foreignObject x={tooltipX} y={tooltipY} width={tooltipW} height={tooltipH}>
                      <div
                        xmlns="http://www.w3.org/1999/xhtml"
                        style={{
                          padding: '10px 12px',
                          fontFamily: 'system-ui, sans-serif',
                          fontSize: 11,
                          lineHeight: 1.4,
                          color: '#1e293b',
                          height: '100%',
                          boxSizing: 'border-box',
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>
                          SDG {sdg.sdgId} — {sdg.name}
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: SDG_COLORS[sdg.sdgId], marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                          {quadrantLabel}
                        </div>
                        <div style={{ color: '#475569' }}>
                          {description}
                        </div>
                        <div style={{ fontSize: 10, color: '#3b82f6', fontWeight: 600, marginTop: 6 }}>
                          Click to view full breakdown →
                        </div>
                      </div>
                    </foreignObject>
                  </g>
                );
              })()}
            </svg>
          </div>

          <p className="mt-3 text-xs text-slate-400 text-center">
            Click any SDG circle to see its full policy breakdown and evidence quotes below.
          </p>
        </div>

        {/* Detail section for selected SDG */}
        {selectedSDG !== null && (
          <div ref={detailRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 scroll-mt-4">
            {/* Left: Bar chart — absolute distribution for selected SDG */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                Policy Mix: SDG {selectedSDG} — {getSDGName(selectedSDG)}
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                Out of all policy actions extracted from VLR documents for this SDG, what share falls into each category? Each bar shows the percentage of total policy mentions that belong to that type of intervention — from direct spending to awareness campaigns.
              </p>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={recommendationTypes.filter(t => t !== 'Other').map(type => {
                    const sdgData = recommendationTypeData.find(d => d.sdg === selectedSDG);
                    return {
                      type,
                      shortType: type.split(',')[0].split('&')[0].trim(),
                      value: (sdgData as any)?.[type] || 0,
                    };
                  })}
                  margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="shortType"
                    angle={-35}
                    textAnchor="end"
                    height={100}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                    formatter={(value: any, _name: any, props: any) => [`${value}%`, props.payload.type]}
                  />
                  <Bar dataKey="value" name="Share of Actions" radius={[4, 4, 0, 0]}>
                    {recommendationTypes.filter(t => t !== 'Other').map((type, index) => (
                      <Cell key={index} fill={typeColors[type]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {dominantType && (
                <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <span className="font-semibold text-sm text-purple-900">Dominant Type</span>
                  </div>
                  <div className="text-sm text-purple-800">
                    <span className="font-bold">{dominantType.type}</span> — {dominantType.value}% of actions
                  </div>
                </div>
              )}

              {/* Category legend with tooltip descriptions */}
              <div className="flex flex-wrap gap-2 mt-4">
                {POLICY_CATEGORIES.filter(c => c.id !== 'other_policy').map(cat => (
                  <UITooltip key={cat.id}>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs cursor-help border border-slate-200 hover:border-slate-300 transition-colors">
                        <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: cat.color }} />
                        {cat.name}
                        <Info className="w-3 h-3 text-slate-400" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>{cat.description}</p>
                    </TooltipContent>
                  </UITooltip>
                ))}
              </div>
            </div>

            {/* Right: Evidence quotes */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Implementation Examples: SDG {selectedSDG} — {getSDGName(selectedSDG)}
              </h3>
              {topQuotes.length > 0 ? (
                <div className="space-y-4">
                  {topQuotes.map((q, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                      <Quote className="flex-shrink-0 w-5 h-5 text-blue-400 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-sm text-slate-900 italic leading-relaxed">
                          "{q.quote}"
                        </div>
                        <div className="text-xs text-slate-500 mt-2">
                          {q.city}, {q.country} ({q.year}) — {categoryIdToName[q.categoryId] || q.categoryId}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">No high-confidence evidence quotes available for this SDG.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
