import { createBrowserRouter } from 'react-router';
import { Root } from '@/app/components/Root';
import { Overview } from '@/app/components/Overview';
import { SDGCoverageAnalysis } from '@/app/components/SDGCoverageAnalysis';
import { PolicyRecommendationSynthesis } from '@/app/components/PolicyRecommendationSynthesis';
import { ChallengesBarriersAnalysis } from '@/app/components/ChallengesBarriersAnalysis';
import { CommitmentStatementsAnalysis } from '@/app/components/CommitmentStatementsAnalysis';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: Overview },
      { path: 'sdg-coverage', Component: SDGCoverageAnalysis },
      { path: 'policy-actions', Component: PolicyRecommendationSynthesis },
      { path: 'challenges-barriers', Component: ChallengesBarriersAnalysis },
      { path: 'commitment-statements', Component: CommitmentStatementsAnalysis },
    ],
  },
], { basename: import.meta.env.BASE_URL.replace(/\/$/, '') });
