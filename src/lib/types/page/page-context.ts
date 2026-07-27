/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

/** What the page does with the record or records it shows. */
export type PageMode = 'list' | 'detail' | 'edit';

/** A node the user picked in the left sidebar tree. */
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
    /** Whether this page has a left sidebar at all. False hides it without discarding the tree it holds. */
    enabled: boolean;
    /** Whether the "Items" tab exists. Changing this rebuilds the tab strip from the navigation layout. */
    hasItemsTab: boolean;
    /** Whether an existing "Items" tab is visible. */
    showItemsTab: boolean;
    /** The user clicked a node. */
    onNodeSelect: ((node: TreeNodeSelection) => void) | null;
    /**
     * The tree finished loading its data, or the page moved on to another record. Pages mark their own nodes
     * from here — for instance the categories the product being shown belongs to.
     */
    onTreeLoad: ((treeScope: string | null, treeData: unknown) => void) | null;
    /** The user resized the sidebar. */
    onWidthChange: ((width: number) => void) | null;
    /** The "Items" tab became active and its content has to be rendered into the given container. */
    onItemsTabActivated: ((container: HTMLElement) => void) | null;
    /** The sidebar finished building itself for this page. */
    onReady: (() => void) | null;
    /** Renders the navigation layout editor into the container the sidebar provides. Admins only. */
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
    /** Identifies the publishing view, so consumers can tell a new page from a re-publish of the same one. */
    pageId: string | null;
    /** Entity the page is about; null when it is about none. */
    scope: string | null;
    mode: PageMode;
    /** BackboneJS model of the record shown on a detail or edit page. */
    model: any;
    /** BackboneJS collection behind a list page. */
    collection: any;
    /** The page belongs to the administration area, where the sidebar shows the system menu instead of a tree. */
    isAdminPage: boolean;
    leftSidebar: LeftSidebarContext;
};