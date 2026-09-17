/**
 * Public API of the card-sorting feature (docs/modules/card-sorting.md).
 * Heavy pages (rich text editor, charts) are lazy so importing this index never grows the initial bundle.
 * Pages receive the project and links from the router owner (workspace / app).
 */
import { lazy } from 'react';

export const CardSortListPage = lazy(() => import('./pages/CardSortListPage').then((m) => ({ default: m.CardSortListPage })));
export const CardSortStudyPage = lazy(() => import('./pages/StudyPage').then((m) => ({ default: m.StudyPage })));
export { SharedStudiesSection } from './pages/SharedStudiesSection';
export { cardSortingRoutes, participantRoutes } from './routes';
