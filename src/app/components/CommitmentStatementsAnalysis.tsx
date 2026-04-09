import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Target,
  TrendingUp,
  DollarSign,
  Building,
  Database,
  AlertCircle,
  Filter,
  Scroll,
  Rocket,
  Handshake,
  Crosshair,
  MoreHorizontal,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { REGIONS, COMMITMENT_CATEGORIES, CommitmentId, getSDGName } from './data/constants';
import { Tooltip as UITooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import commitmentRaw from '@/data/generated/commitment-distribution.json';
import challengeRaw from '@/data/generated/challenge-distribution.json';

const COMMITMENT_ICON_MAP: Record<CommitmentId, { icon: LucideIcon; shortName: string }> = {
  strategy_plan:            { icon: TrendingUp,    shortName: 'Strategy & Plans' },
  regulatory_reform:        { icon: Scroll,        shortName: 'Regulatory Reform' },
  capital_investment:       { icon: DollarSign,    shortName: 'Capital Investment' },
  programme_service:        { icon: Rocket,        shortName: 'Programmes' },
  institutional_capacity:   { icon: Building,      shortName: 'Institutional' },
  data_reporting:           { icon: Database,      shortName: 'Data & Reporting' },
  partnership_collaboration:{ icon: Handshake,     shortName: 'Partnerships' },
  target_goal:              { icon: Crosshair,     shortName: 'Quantitative Targets' },
  other_commitment:         { icon: MoreHorizontal,shortName: 'Other' },
};

// Commitment quality tiers
const ASPIRATIONAL_IDS = ['target_goal', 'strategy_plan'];
const OPERATIONAL_IDS = ['programme_service', 'partnership_collaboration', 'institutional_capacity', 'data_reporting'];
const STRUCTURAL_IDS = ['capital_investment', 'regulatory_reform'];

type DistItem = { sdgId: number; categoryId: string; region: string; year: number; count: number };
const commitmentData = commitmentRaw as DistItem[];
const challengeData = challengeRaw as DistItem[];
const sdgs = Array.from({ length: 17 }, (_, i) => i + 1);
const allRegions = ['All Regions', ...REGIONS];

function getCommitmentDistribution(sdgId: number, region: string): Record<string, number> {
  let items = commitmentData.filter(d => d.sdgId === sdgId);
  if (region !== 'All Regions') items = items.filter(d => d.region === region);
  const total = items.reduce((s, d) => s + d.count, 0);
  const result: Record<string, number> = {};
  COMMITMENT_CATEGORIES.forEach(cat => {
    const catCount = items.filter(d => d.categoryId === cat.id).reduce((s, d) => s + d.count, 0);
    result[cat.id] = total > 0 ? Math.round((catCount / total) * 100) : 0;
  });
  return result;
}

function buildGapAnalysis(region: string) {
  return sdgs.map(sdgId => {
    let cItems = challengeData.filter(d => d.sdgId === sdgId);
    let mItems = commitmentData.filter(d => d.sdgId === sdgId);
    if (region !== 'All Regions') {
      cItems = cItems.filter(d => d.region === region);
      mItems = mItems.filter(d => d.region === region);
    }
    const challengeCount = cItems.reduce((s, d) => s + d.count, 0);
    const commitmentCount = mItems.reduce((s, d) => s + d.count, 0);
    const crr = challengeCount > 0 ? Math.round((commitmentCount / challengeCount) * 100) / 100 : null;
    return {
      sdg: sdgId,
      challengeCount,
      commitmentCount,
      crr,
      totalVolume: challengeCount + commitmentCount,
      gapCategory: crr === null ? 'No Challenges'
                 : crr < 0.7 ? 'Significant Deficit'
                 : crr < 0.9 ? 'Moderate Deficit'
                 : crr < 1.1 ? 'Balanced'
                 : crr < 1.5 ? 'Moderate Surplus'
                 : 'Strong Surplus',
    };
  });
}

export function CommitmentStatementsAnalysis() {
  const [selectedSDG, setSelectedSDG] = useState<number>(11);
  const [selectedRegion, setSelectedRegion] = useState<string>('All Regions');

  const selectedSDGData = useMemo(() => {
    const dist = getCommitmentDistribution(selectedSDG, selectedRegion);
    let items = commitmentData.filter(d => d.sdgId === selectedSDG);
    if (selectedRegion !== 'All Regions') items = items.filter(d => d.region === selectedRegion);
    const totalCommitments = items.reduce((s, d) => s + d.count, 0);
    return { ...dist, totalCommitments };
  }, [selectedSDG, selectedRegion]);

  const gapAnalysis = useMemo(() => buildGapAnalysis(selectedRegion), [selectedRegion]);
  const selectedGapData = gapAnalysis.find(d => d.sdg === selectedSDG);

  // Commitment quality tiers per SDG — reactive to region
  const qualityData = useMemo(() => {
    return sdgs.map(sdgId => {
      let items = commitmentData.filter(d => d.sdgId === sdgId && d.categoryId !== 'other_commitment');
      if (selectedRegion !== 'All Regions') items = items.filter(d => d.region === selectedRegion);
      const total = items.reduce((s, d) => s + d.count, 0);
      if (total === 0) return { sdgId, aspirational: 0, operational: 0, structural: 0, pctConcrete: 0, total: 0 };

      const aspirational = items.filter(d => ASPIRATIONAL_IDS.includes(d.categoryId)).reduce((s, d) => s + d.count, 0);
      const operational = items.filter(d => OPERATIONAL_IDS.includes(d.categoryId)).reduce((s, d) => s + d.count, 0);
      const structural = items.filter(d => STRUCTURAL_IDS.includes(d.categoryId)).reduce((s, d) => s + d.count, 0);

      return {
        sdgId,
        aspirational: Math.round((aspirational / total) * 100),
        operational: Math.round((operational / total) * 100),
        structural: Math.round((structural / total) * 100),
        pctConcrete: Math.round(((operational + structural) / total) * 100),
        total,
      };
    }).sort((a, b) => b.pctConcrete - a.pctConcrete);
  }, [selectedRegion]);

  return (
    <div className="w-full h-full overflow-auto bg-slate-50">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Commitment Statements Analysis
          </h1>
          <p className="text-lg text-slate-600">
            What are cities actually committing to when they publish a VLR?
          </p>
        </div>

        {/* Region Filter */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Region:</span>
            </div>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {allRegions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Challenge-Commitment Gap Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Where Are Cities' Commitments Falling Short?
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Comparing the volume of identified challenges versus commitments across all SDGs
            </p>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={[...gapAnalysis].filter(d => d.crr !== null).sort((a, b) => (a.crr as number) - (b.crr as number))}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 60, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  domain={[0, Math.ceil(Math.max(...gapAnalysis.filter(d => d.crr !== null).map(d => d.crr as number)) * 10) / 10]}
                  tickFormatter={(v: number) => `${v}x`}
                />
                <YAxis
                  type="category"
                  dataKey="sdg"
                  width={55}
                  tickFormatter={(v: number) => `SDG ${v}`}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any, _name: any, props: any) => {
                    const entry = props.payload;
                    return [
                      `${value}x (${entry.commitmentCount.toLocaleString()} commitments / ${entry.challengeCount.toLocaleString()} challenges)`,
                      'Response Ratio'
                    ];
                  }}
                  labelFormatter={(v: number) => `SDG ${v} — ${getSDGName(v)}`}
                />
                <Bar
                  dataKey="crr"
                  name="Commitment Response Ratio"
                  radius={[0, 4, 4, 0]}
                  cursor="pointer"
                  onClick={(data: any) => { if (data?.sdg) setSelectedSDG(data.sdg); }}
                >
                  {[...gapAnalysis].filter(d => d.crr !== null).sort((a, b) => (a.crr as number) - (b.crr as number)).map((entry, index) => (
                    <Cell
                      key={`gap-${index}`}
                      fill={(entry.crr as number) < 0.7 ? '#ef4444' : (entry.crr as number) < 0.9 ? '#f59e0b' : (entry.crr as number) < 1.1 ? '#fbbf24' : (entry.crr as number) < 1.5 ? '#10b981' : '#059669'}
                      stroke={entry.sdg === selectedSDG ? '#1e293b' : 'none'}
                      strokeWidth={entry.sdg === selectedSDG ? 2 : 0}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{backgroundColor:'#ef4444'}}></span> &lt;0.7x Deficit</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{backgroundColor:'#f59e0b'}}></span> 0.7-0.9x Moderate</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{backgroundColor:'#fbbf24'}}></span> 0.9-1.1x Balanced</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{backgroundColor:'#10b981'}}></span> 1.1-1.5x Surplus</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{backgroundColor:'#059669'}}></span> &gt;1.5x Strong</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              SDG {selectedSDG} Profile
            </h3>
            <p className="text-sm text-slate-600 mb-4">{getSDGName(selectedSDG)}</p>

            <Tabs defaultValue="breakdown">
              <TabsList className="w-full">
                <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
                <TabsTrigger value="gap">Gap</TabsTrigger>
              </TabsList>
              <TabsContent value="breakdown">
                <div className="text-sm font-medium text-slate-700 mb-2">Commitment Breakdown</div>
                {COMMITMENT_CATEGORIES.map(cat => {
                  const value = selectedSDGData?.[cat.id] || 0;
                  const meta = COMMITMENT_ICON_MAP[cat.id];
                  return (
                    <div key={cat.id} className="mb-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className="text-slate-700 cursor-help border-b border-dotted border-slate-300">{meta.shortName}</span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>{cat.description}</p>
                          </TooltipContent>
                        </UITooltip>
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
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Total Commitments</span>
                    <span className="font-semibold text-slate-900">{selectedSDGData?.totalCommitments?.toLocaleString()}</span>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="gap">
                {selectedGapData && (
                  <div className={`rounded-lg p-4 ${
                    selectedGapData.crr === null ? 'border-slate-300 bg-slate-50' :
                    (selectedGapData.crr as number) < 0.9 ? 'border-red-300 bg-red-50' :
                    (selectedGapData.crr as number) < 1.1 ? 'border-yellow-300 bg-yellow-50' :
                    'border-green-300 bg-green-50'
                  }`}>
                    <div className="text-sm font-medium text-slate-900 mb-2">Commitment Response Ratio</div>
                    <div className="text-2xl font-bold text-slate-900 mb-1">{selectedGapData.crr !== null ? `${selectedGapData.crr}x` : 'N/A'}</div>
                    <div className={`text-xs font-medium ${
                      selectedGapData.crr === null ? 'text-slate-700' :
                      (selectedGapData.crr as number) < 0.9 ? 'text-red-700' :
                      (selectedGapData.crr as number) < 1.1 ? 'text-yellow-700' :
                      'text-green-700'
                    }`}>
                      {selectedGapData.gapCategory}
                    </div>
                    <div className="text-xs text-slate-600 mt-2">
                      {selectedGapData.challengeCount.toLocaleString()} challenges · {selectedGapData.commitmentCount.toLocaleString()} commitments
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Commitment Quality — Aggregate bar + 3 buckets */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            How Concrete Are These Commitments?
          </h3>
          <p className="text-sm text-slate-500 mb-5">
            Not all commitments are equal. Are cities setting targets, or actually building infrastructure and launching programmes?
          </p>

          {/* Overall aggregate bar */}
          {(() => {
            const totals = qualityData.reduce((acc, d) => {
              acc.aspirational += d.aspirational * d.total;
              acc.operational += d.operational * d.total;
              acc.structural += d.structural * d.total;
              acc.total += d.total;
              return acc;
            }, { aspirational: 0, operational: 0, structural: 0, total: 0 });
            const pctA = totals.total > 0 ? Math.round(totals.aspirational / totals.total) : 0;
            const pctO = totals.total > 0 ? Math.round(totals.operational / totals.total) : 0;
            const pctS = totals.total > 0 ? Math.round(totals.structural / totals.total) : 0;
            const pctConcrete = pctO + pctS;

            return (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">
                    Overall: <span className="font-bold text-blue-700">{pctConcrete}% concrete</span>
                  </span>
                  <span className="text-sm text-slate-400">{pctA}% aspirational</span>
                </div>
                <div className="flex h-8 rounded-lg overflow-hidden">
                  <div
                    className="h-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ width: `${pctS}%`, backgroundColor: '#1e3a5f' }}
                  >
                    {pctS > 5 && `${pctS}%`}
                  </div>
                  <div
                    className="h-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ width: `${pctO}%`, backgroundColor: '#3b82f6' }}
                  >
                    {pctO > 5 && `${pctO}%`}
                  </div>
                  <div
                    className="h-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ width: `${pctA}%`, backgroundColor: '#94a3b8' }}
                  >
                    {pctA > 5 && `${pctA}%`}
                  </div>
                </div>
                <div className="flex items-center gap-6 mt-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm" style={{backgroundColor:'#1e3a5f'}} /> Structural (Infrastructure, Regulation)</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm" style={{backgroundColor:'#3b82f6'}} /> Operational (Programmes, Partnerships)</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm" style={{backgroundColor:'#94a3b8'}} /> Aspirational (Targets, Strategies)</span>
                </div>
              </div>
            );
          })()}

          {/* Three bucket cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                label: 'Action-Oriented',
                description: 'More than 55% concrete commitments',
                filter: (d: typeof qualityData[0]) => d.pctConcrete > 55,
                borderColor: 'border-blue-300',
                bgColor: 'bg-blue-50',
                textColor: 'text-blue-800',
                badgeColor: 'bg-blue-600',
              },
              {
                label: 'Balanced',
                description: '45–55% concrete commitments',
                filter: (d: typeof qualityData[0]) => d.pctConcrete >= 45 && d.pctConcrete <= 55,
                borderColor: 'border-slate-300',
                bgColor: 'bg-slate-50',
                textColor: 'text-slate-700',
                badgeColor: 'bg-slate-500',
              },
              {
                label: 'Aspirational-Heavy',
                description: 'Less than 45% concrete commitments',
                filter: (d: typeof qualityData[0]) => d.pctConcrete < 45,
                borderColor: 'border-amber-300',
                bgColor: 'bg-amber-50',
                textColor: 'text-amber-800',
                badgeColor: 'bg-amber-500',
              },
            ].map(bucket => {
              const sdgsInBucket = qualityData.filter(bucket.filter).sort((a, b) => b.pctConcrete - a.pctConcrete);
              return (
                <div key={bucket.label} className={`rounded-xl border ${bucket.borderColor} ${bucket.bgColor} p-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-bold ${bucket.textColor}`}>{bucket.label}</span>
                    <span className={`${bucket.badgeColor} text-white text-xs font-bold px-2 py-0.5 rounded-full`}>
                      {sdgsInBucket.length}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">{bucket.description}</p>
                  {sdgsInBucket.length > 0 ? (
                    <div className="space-y-1.5">
                      {sdgsInBucket.map(d => (
                        <div
                          key={d.sdgId}
                          className={`flex items-center justify-between text-sm cursor-pointer rounded px-1.5 py-0.5 transition-colors ${
                            d.sdgId === selectedSDG ? 'bg-white/70 font-bold' : 'hover:bg-white/50'
                          }`}
                          onClick={() => setSelectedSDG(d.sdgId)}
                        >
                          <span className={bucket.textColor}>
                            SDG {d.sdgId} <span className="text-xs opacity-70">{getSDGName(d.sdgId).length > 16 ? getSDGName(d.sdgId).slice(0, 16) + '…' : getSDGName(d.sdgId)}</span>
                          </span>
                          <span className="tabular-nums font-medium text-xs">{d.pctConcrete}%</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No SDGs in this category</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
