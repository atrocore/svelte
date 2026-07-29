/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

import type { TreeNodeSelection } from '$lib/types/ui/tree-node-selection';
import type { PageMode } from './page-mode';

export type LeftSidebarContext = {
    enabled: boolean;
    activeTab: string | null;
    tabProps: Record<string, Record<string, any>>;
    onNodeSelect: ((node: TreeNodeSelection) => void) | null;
    onWidthChange: ((width: number) => void) | null;
    renderLayoutEditor: ((container: HTMLElement) => void) | null;
};

export type PageContext = {
    pageId: string | null;
    scope: string | null;
    mode: PageMode;
    model: any;
    collection: any;
    isAdminPage: boolean;
    leftSidebar: LeftSidebarContext;
};