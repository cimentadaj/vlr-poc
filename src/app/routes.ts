import { createHashRouter } from 'react-router';
import { Root } from '@/app/components/Root';
import { Overview } from '@/app/components/Overview';
import { SDGCoverageAnalysis } from '@/app/components/SDGCoverageAnalysis';
import { PolicyRecommendationSynthesis } from '@/app/components/PolicyRecommendationSynthesis';
import { ChallengesBarriersAnalysis } from '@/app/components/ChallengesBarriersAnalysis';
import { CommitmentStatementsAnalysis } from '@/app/components/CommitmentStatementsAnalysis';
import { Methodology } from '@/app/components/Methodology';

// HashRouter is used because the app is served as a subdirectory of a
// custom-domain GitHub Pages site (nexusgovernance.eu/vlr-observatory/), and
// GitHub Pages custom-domain sites only serve the root-level 404.html — a
// subdirectory SPA fallback won't work. Hash-based routes (e.g.
// /vlr-observatory/#/sdg-coverage) need no server-side routing.
export const router = createHashRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: Overview },
      { path: 'sdg-coverage', Component: SDGCoverageAnalysis },
      { path: 'policy-actions', Component: PolicyRecommendationSynthesis },
      { path: 'challenges-barriers', Component: ChallengesBarriersAnalysis },
      { path: 'commitment-statements', Component: CommitmentStatementsAnalysis },
      { path: 'methodology', Component: Methodology },
    ],
  },
]);
