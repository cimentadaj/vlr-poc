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
  'Africa',
  'Arab States',
  'Asia & Pacific',
  'Europe',
  'Latin America & Caribbean',
  'North America',
] as const;

export type Region = (typeof REGIONS)[number];

// ============================================================
// Challenge Categories (8 categories from pipeline's 4_classify.py)
// ============================================================
export const CHALLENGE_CATEGORIES = [
  { id: 'quality_of_life', name: 'Quality of Life & Access to Basic Services', color: '#10b981', description: 'Residents lacking access to or experiencing inadequate provision of basic public services and quality-of-life essentials — income/food/energy security, housing adequacy, health and well-being outcomes, learning and human-capital outcomes.' },
  { id: 'demographic_inequalities', name: 'Demographic & Group-Based Inequalities', color: '#f97316', description: 'Unequal outcomes across demographic lines (gender, ethnicity, disability, migration status, age, rural/urban) where the disparity itself is the stated problem.' },
  { id: 'labour_livelihood', name: 'Labour Market & Livelihood Problems', color: '#eab308', description: 'Adverse employment conditions facing residents: unemployment, youth joblessness, informality, precarious work, workplace injuries, or sectoral labour decline.' },
  { id: 'safety_violence', name: 'Safety, Violence & Social Cohesion', color: '#dc2626', description: 'Victimisation, crime, violence, insecurity, stigma, or loneliness experienced by residents.' },
  { id: 'environmental_hazards', name: 'Environmental Hazards & Habitat Quality', color: '#84cc16', description: 'Residents\' exposure to pollution, sanitation gaps, degraded ecosystems, unsafe or inadequate housing stock, or unreliable local infrastructure.' },
  { id: 'government_capacity', name: 'Government Capacity & Coordination Failures', color: '#8b5cf6', description: 'Any government-internal barrier: insufficient budgets, missing data/baselines/monitoring, shortage of trained staff or expertise, fragmented mandates, weak institutions, missing/outdated laws, poor coordination across levels or sectors, weak stakeholder engagement, leadership turnover, lack of political will.' },
  { id: 'external_shocks', name: 'External Shocks & Contextual Pressures', color: '#06b6d4', description: 'Climate disasters, pandemics, migration surges, geopolitical disruptions, or other context beyond local government control.' },
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
