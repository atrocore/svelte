/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

export type PageMode = 'list' | 'detail' | 'edit';

export type TreeNodeSelection = {
    id: string;
    scope: string;
    /** Ancestors of the node, pipe-wrapped and pipe-delimited (`|a|b|`); empty for a root node. */
    route: string;
    click?: boolean;
};

/**
 * Everything the left sidebar needs from the page it currently describes.
 *
 * The handlers are the page's own behaviour: the sidebar reports what the user did and lets the page decide,
 * rather than navigating or fetching on its behalf.
 */
export type LeftSidebarContext = {
    enabled: boolean;
    /** Changing this rebuilds the tabs from the navigation layout. */
    hasItemsTab: boolean;
    showItemsTab: boolean;
    onNodeSelect: ((node: TreeNodeSelection) => void) | null;
    onWidthChange: ((width: number) => void) | null;
    /** What the "Items" tab lists, for pages that have one. */
    itemsProps: Record<string, any> | null;
    /** Admins only. */
    renderLayoutEditor: ((container: HTMLElement) => void) | null;
};

/**
 * A declarative description of the view currently occupying `#main`, published by that view itself and read by
 * the shell components that outlive it — see `getPageContext()` in `views/main.js` on the BackboneJS side.
 *
 * It holds what the page owns: what it shows, and how it behaves when the shell reports user activity. State
 * owned by somebody else does not belong here — the user's favourites, a record's followers, or a component's
 * own collapse and width all live in their own stores.
 */
export type PageContext = {
    /** Tells a new page from a re-publish of the same one. */
    pageId: string | null;
    scope: string | null;
    mode: PageMode;
    model: any;
    collection: any;
    /** The administration area, where the sidebar shows the system menu instead of a tree. */
    isAdminPage: boolean;
    leftSidebar: LeftSidebarContext;
};