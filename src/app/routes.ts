import { createBrowserRouter } from 'react-router';
import { Root } from '@/app/components/Root';
import { SDGCoverageAnalysis } from '@/app/components/SDGCoverageAnalysis';
import { PolicyRecommendationSynthesis } from '@/app/components/PolicyRecommendationSynthesis';
import { ChallengesBarriersAnalysis } from '@/app/components/ChallengesBarriersAnalysis';
import { CommitmentStatementsAnalysis } from '@/app/components/CommitmentStatementsAnalysis';
import { EmergingThematicAnalysis } from '@/app/components/EmergingThematicAnalysis';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: SDGCoverageAnalysis },
      { path: 'policy-recommendations', Component: PolicyRecommendationSynthesis },
      { path: 'challenges-barriers', Component: ChallengesBarriersAnalysis },
      { path: 'commitment-statements', Component: CommitmentStatementsAnalysis },
      { path: 'emerging-themes', Component: EmergingThematicAnalysis },
    ],
  },
], { basename: import.meta.env.BASE_URL.replace(/\/$/, '') });