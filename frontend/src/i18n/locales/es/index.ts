/**
 * Spanish catalog — SOURCE OF TRUTH for message keys.
 * One file per namespace (= feature). Add keys here first; other languages must mirror them.
 */
import { account } from './account';
import { cardSorting } from './cardSorting';
import { auth } from './auth';
import { common, meta } from './common';
import { marketing } from './marketing';
import { productContext } from './productContext';
import { projects } from './projects';
import { studies } from './studies';
import { system } from './system';
import { workspace } from './workspace';

export const messages = { common, meta, auth, account, projects, workspace, productContext, cardSorting, studies, system, marketing };
