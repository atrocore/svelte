/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

import { Acl } from '$lib/core/acl';
import { Language } from '$lib/core/language';
import { LayoutManager } from '$lib/core/layout-manager';
import { Metadata } from '$lib/core/metadata';
import SelectionItemList from '$lib/components/SelectionItemList/SelectionItemList.svelte';
import { getSystemIconUrl, getTabIcon } from '$lib/helpers/icon';
import type { LeftSidebarContext, PageMode } from '$lib/types/page/page-context';
import type { SidebarTab, SidebarTabContent } from '$lib/types/ui/sidebar-tab';
import RecordTree from './RecordTree/RecordTree.svelte';
import type { SelectedNode } from './types/selected-node';

export const SELF_TAB = '_self';
export const BOOKMARK_TAB = '_bookmark';
export const LAST_VIEWED_TAB = '_lastViewed';
export const ADMIN_TAB = '_admin';
export const ITEMS_TAB = '_items';

export type TabContext = {
    scope: string;
    mode: PageMode;
    model: any;
    maxSize: number;
    selectedNodes: SelectedNode[];
    showSort: boolean;
    showItems: boolean;
    sidebar: LeftSidebarContext;
    onNodeToggle: (node: Omit<SelectedNode, 'icon'>) => void;
};

export type Tab = SidebarTab<TabContext>;

export type LoadedTabs = {
    tabs: Tab[];
    layoutData: any;
};

type TabDefinition = {
    scope?: (name: string, pageScope: string) => string | null;
    label: (name: string, pageScope: string, tabScope: string | null) => string;
    icon?: (tabScope: string | null) => string | null;
    isAllowed?: (tabScope: string | null) => boolean;
    content: SidebarTabContent<TabContext>;
};

type TreeBehaviour = Partial<{
    recordScope: string | null;
    selectable: boolean;
    marksPageRecord: boolean;
    filtersOwnRecords: boolean;
    hierarchical: boolean;
    searchable: boolean;
    showSort: boolean;
    source: 'records' | 'adminMenu';
}>;

const plural = (scope: string) => Language.get('Global', 'scopeNamesPlural', scope) as string;

function tree(behaviour: (ctx: TabContext) => TreeBehaviour): SidebarTabContent<TabContext> {
    return {
        component: RecordTree,
        props: (tab, ctx) => {
            const treeScope = getTabScope(tab.name, ctx.scope);

            return {
                link: tab.name,
                scope: ctx.scope,
                treeScope,
                recordScope: treeScope,
                mode: ctx.mode,
                model: ctx.model,
                maxSize: ctx.maxSize,
                selectedNodes: ctx.selectedNodes,
                showSort: ctx.showSort,
                onNodeSelect: ctx.sidebar.onNodeSelect,
                onNodeToggle: ctx.onNodeToggle,
                ...behaviour(ctx)
            };
        }
    };
}

const SELECTION_ITEMS: SidebarTabContent<TabContext> = {
    component: SelectionItemList,
    props: (tab, ctx) => ctx.sidebar.itemsProps ?? { scope: ctx.scope, records: [], selectedIds: [] },
    isVisible: (tab, ctx) => ctx.showItems,
    keepCollapsed: true
};

const TABS: Record<string, TabDefinition> = {
    [SELF_TAB]: {
        scope: (name, pageScope) => pageScope,
        label: (name, pageScope) => plural(pageScope),
        content: tree(() => ({ marksPageRecord: true, filtersOwnRecords: true }))
    },

    [BOOKMARK_TAB]: {
        scope: () => 'Bookmark',
        label: () => plural('Bookmark'),
        // the requests go to Bookmark, but every node is a record of the entity the page is about
        content: tree(ctx => ({
            recordScope: ctx.scope,
            marksPageRecord: true,
            filtersOwnRecords: true,
            hierarchical: false
        }))
    },

    [LAST_VIEWED_TAB]: {
        scope: () => 'LastViewed',
        label: () => plural('LastViewed'),
        content: tree(() => ({ marksPageRecord: true, searchable: false }))
    },

    [ADMIN_TAB]: {
        label: () => Language.get('Global', 'labels', 'Administration') as string,
        icon: () => getSystemIconUrl('gear'),
        content: tree(() => ({ source: 'adminMenu', showSort: false }))
    },

    [ITEMS_TAB]: {
        label: () => Language.get('Global', 'labels', 'Items') as string,
        icon: () => getSystemIconUrl('copy'),
        content: SELECTION_ITEMS
    }
};

const RELATION_TAB: TabDefinition = {
    scope: (name, pageScope) => Metadata.get(['entityDefs', pageScope, 'links', name, 'entity'])
        || Metadata.get(['entityDefs', pageScope, 'fields', name, 'entity']),
    label: (name, pageScope, tabScope) => {
        if (tabScope && Metadata.get(['entityDefs', pageScope, 'fields', name, 'type']) === 'link') {
            return plural(tabScope);
        }

        return (Language.get(pageScope, 'links', name)
            || Language.get(pageScope, 'fields', name)
            || Language.get('Global', 'fields', name)) as string;
    },
    isAllowed: tabScope => !tabScope || Acl.check(tabScope, 'read'),
    content: tree(() => ({ selectable: true }))
};

export function getTabScope(name: string, pageScope: string): string | null {
    const definition = TABS[name] ?? RELATION_TAB;

    return definition.scope?.(name, pageScope) ?? null;
}

export function loadTabs(pageScope: string, isAdminPage: boolean, hasItemsTab: boolean): Promise<LoadedTabs> {
    if (isAdminPage) {
        return Promise.resolve({ tabs: [buildTab(ADMIN_TAB, pageScope) as Tab], layoutData: null });
    }

    return new Promise(resolve => {
        LayoutManager.get(pageScope, 'navigation', null, null, (data: any) => {
            resolve({ tabs: buildTabs(pageScope, data.layout, hasItemsTab), layoutData: data });
        });
    });
}

function buildTabs(pageScope: string, layout: any[], hasItemsTab: boolean): Tab[] {
    const tabs = (layout || [])
        .map((item: any) => buildTab(item.name, pageScope))
        .filter((tab: Tab | null): tab is Tab => tab !== null)
        .filter((tab: Tab) => hasItemsTab || tab.name !== ITEMS_TAB);

    return tabs.map((tab: Tab) => tabs.filter((other: Tab) => other.label === tab.label).length > 1
        ? { ...tab, label: `${tab.label} (${tab.name})` }
        : tab);
}

function buildTab(name: string, pageScope: string): Tab | null {
    const definition = TABS[name] ?? RELATION_TAB;
    const tabScope = getTabScope(name, pageScope);

    if (definition.isAllowed && !definition.isAllowed(tabScope)) {
        return null;
    }

    return {
        name,
        label: definition.label(name, pageScope, tabScope),
        iconUrl: definition.icon ? definition.icon(tabScope) : (tabScope ? getTabIcon(tabScope) : null),
        content: definition.content
    };
}
