// Shared constants aligned with the VLR extraction pipeline taxonomy
// Source: vlr_collection/vlr_extraction pipeline (steps 2-4)

// ============================================================
// SDG Names
// ============================================================
export const SDG_NAMES: Record<number, string> = {
  1: 'No Poverty',
  2: 'Zero Hunger',
  3: 'Good Health',
  4: 'Quality Education',
  5: 'Gender Equality',
  6: 'Clean Water',
  7: 'Clean Energy',
  8: 'Decent Work',
  9: 'Innovation',
  10: 'Reduced Inequalities',
  11: 'Sustainable Cities',
  12: 'Responsible Consumption',
  13: 'Climate Action',
  14: 'Life Below Water',
  15: 'Life on Land',
  16: 'Peace & Justice',
  17: 'Partnerships',
};

export function getSDGName(id: number): string {
  return SDG_NAMES[id] || `SDG ${id}`;
}

// ============================================================
// Regions (from pipeline's 2_slice.py region classification)
// ============================================================
export const REGIONS = [
  'LATAM',
  'North America',
  'Europe',
  'Africa',
  'Middle East',
  'Asia',
  'Australia & Oceania',
] as const;

export type Region = (typeof REGIONS)[number];

// ============================================================
// Challenge Categories (12 categories from pipeline's 4_classify.py)
// ============================================================
export const CHALLENGE_CATEGORIES = [
  { id: 'fiscal_financial', name: 'Fiscal & Financial Constraints', color: '#ef4444', description: 'Insufficient government budgets, revenue shortfalls, donor dependency, or inability to mobilise private finance for public programmes.' },
  { id: 'institutional_governance', name: 'Institutional & Governance Weaknesses', color: '#dc2626', description: 'Fragmented mandates, weak local agencies, unclear roles, or lack of enforcement capacity.' },
  { id: 'legal_regulatory', name: 'Legal & Regulatory Gaps', color: '#f59e0b', description: 'Absent, outdated, or conflicting laws, by-laws, or regulatory frameworks.' },
  { id: 'human_capacity', name: 'Human Capacity & Technical Skills Deficits', color: '#eab308', description: 'Shortage of trained staff, brain drain, or lack of specialised expertise.' },
  { id: 'data_monitoring', name: 'Data Monitoring & Evidence Gaps', color: '#f97316', description: 'Missing baselines, unreliable statistics, or absence of monitoring infrastructure.' },
  { id: 'multilevel_governance', name: 'Multi-Level Governance & Coordination Failures', color: '#8b5cf6', description: 'Misalignment between national and local governments, or poor inter-agency coordination.' },
  { id: 'policy_coherence', name: 'Policy Coherence & Integration Deficits', color: '#a855f7', description: 'Siloed sectoral policies within a single level of government that contradict or ignore each other.' },
  { id: 'political_will', name: 'Political Will & Continuity Risks', color: '#ec4899', description: 'Leadership turnover, shifting priorities, or lack of political commitment to long-term goals.' },
  { id: 'stakeholder_engagement', name: 'Stakeholder Engagement & Participation Deficits', color: '#3b82f6', description: 'Insufficient inclusion of civil society, private sector, or marginalised groups in decision-making.' },
  { id: 'external_shocks', name: 'External Shocks & Contextual Pressures', color: '#06b6d4', description: 'Climate disasters, pandemics, migration surges, or geopolitical disruptions beyond local control.' },
  { id: 'socioeconomic', name: 'Socioeconomic Conditions & Inequality', color: '#10b981', description: 'Population-level problems such as poverty, health disparities, debt burdens, housing insecurity, educational gaps, or unequal outcomes across demographic groups.' },
  { id: 'other_challenge', name: 'Other', color: '#94a3b8', description: 'Challenges that do not fit any category above or are too vague to classify.' },
] as const;

export type ChallengeId = (typeof CHALLENGE_CATEGORIES)[number]['id'];

// ============================================================
// Policy Categories (8 categories from pipeline's 4_classify.py)
// ============================================================
export const POLICY_CATEGORIES = [
  { id: 'information_awareness', name: 'Information, Awareness & Capacity Building', color: '#3b82f6', description: 'Public campaigns, training programmes, and knowledge-sharing activities aimed at raising awareness or building skills.' },
  { id: 'public_investment', name: 'Public Investment & Procurement', color: '#8b5cf6', description: 'Direct government spending on infrastructure, services, or procurement contracts to deliver public goods.' },
  { id: 'economic_fiscal', name: 'Tax & Fiscal Incentives', color: '#ec4899', description: 'Tax breaks, subsidies, fees, levies, or other financial mechanisms used to incentivize or disincentivize behavior.' },
  { id: 'voluntary_partnership', name: 'Voluntary & Partnership Approaches', color: '#f59e0b', description: 'Non-binding agreements, voluntary standards, and public-private partnerships relying on collaboration rather than regulation.' },
  { id: 'strategic_planning', name: 'Strategic Planning & Policy Frameworks', color: '#10b981', description: 'Master plans, roadmaps, and formal frameworks that set direction without direct spending or regulation.' },
  { id: 'monitoring_evaluation', name: 'Monitoring, Evaluation & Data Systems', color: '#06b6d4', description: 'Indicator frameworks, dashboards, and data collection systems to track progress.' },
  { id: 'regulation_standards', name: 'Regulation & Standards', color: '#ef4444', description: 'Mandatory rules, building codes, emission standards, or other legally binding requirements.' },
  { id: 'other_policy', name: 'Other', color: '#94a3b8', description: 'Policy actions that do not fit any category above.' },
] as const;

export type PolicyId = (typeof POLICY_CATEGORIES)[number]['id'];

// ============================================================
// Commitment Categories (9 categories from pipeline's 4_classify.py)
// ============================================================
export const COMMITMENT_CATEGORIES = [
  { id: 'strategy_plan', name: 'Strategy & Plan Development', color: '#3b82f6', description: 'Commitments to create or adopt strategic plans, roadmaps, or policy frameworks.' },
  { id: 'regulatory_reform', name: 'Regulatory & Legislative Reform', color: '#ef4444', description: 'Commitments to change laws, regulations, by-laws, or standards.' },
  { id: 'capital_investment', name: 'Capital Investment & Infrastructure', color: '#f59e0b', description: 'Commitments to fund or build physical infrastructure or major capital projects.' },
  { id: 'programme_service', name: 'Programme & Service Launch', color: '#10b981', description: 'Commitments to start new programmes, services, or operational initiatives.' },
  { id: 'institutional_capacity', name: 'Institutional Restructuring & Capacity Building', color: '#8b5cf6', description: 'Commitments to reorganize agencies, create new offices, or train government staff.' },
  { id: 'data_reporting', name: 'Data Monitoring & Reporting Systems', color: '#06b6d4', description: 'Commitments to establish or improve data collection, indicators, or reporting.' },
  { id: 'partnership_collaboration', name: 'Partnership & Collaboration', color: '#ec4899', description: 'Commitments to form or strengthen partnerships with other governments, private sector, or civil society.' },
  { id: 'target_goal', name: 'Quantitative Target Setting', color: '#f97316', description: 'Specific numerical targets or measurable goals (e.g., "reduce emissions 40% by 2030").' },
  { id: 'other_commitment', name: 'Other', color: '#94a3b8', description: 'Commitments that do not fit any category above.' },
] as const;

export type CommitmentId = (typeof COMMITMENT_CATEGORIES)[number]['id'];
