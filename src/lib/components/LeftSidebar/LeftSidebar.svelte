<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { onMount, tick } from 'svelte';
    import { Storage } from "$lib/core/storage";
    import { Config } from '$lib/core/config';
    import { UserData } from "$lib/core/user-data";
    import TabbedSidebar from "$lib/components/TabbedSidebar/TabbedSidebar.svelte";
    import { getTabIcon } from '$lib/helpers/icon';
    import { isMobileViewport } from '$lib/helpers/viewport';
    import SelectedNodesBadges from './SelectedNodesBadges/SelectedNodesBadges.svelte';
    import type { SelectedNode } from './types/selected-node';
    import type { Tab } from './tab-config';
    import { getTabScope, loadTabs } from './tab-config';
    import { getGeneralFilterStore } from '$lib/stores/general-filter.store';
    import { createEmptyLeftSidebarContext, pageContextStore } from '$lib/stores/page-context.store';
    import type { LeftSidebarContext, PageContext, PageMode } from '$lib/types/page/page-context';
    import { buildRuleForNode, saveNodes, loadNodes, filterStaleNodes } from './utils/tree-node-rule';

    export let uniqueKey: string = 'default';
    export let minWidth: number = 300;
    export let maxWidth: number = 600;
    export let currentWidth: number = minWidth;
    export let isCollapsed: boolean = false;
    export let maxSize: number = Config.get('recordsPerPageSmall') || 20;

    export let showApplySortOrder: boolean = true

    let scope: string = '';
    let mode: PageMode = 'list';
    let model: any = null;
    let collection: any = null;
    let isAdminPage: boolean = false;
    let pageId: string | null = null;
    let sidebar: LeftSidebarContext = createEmptyLeftSidebarContext();

    let loadedScope: string | null = null;
    let loadedIsAdminPage: boolean = false;
    let loadedHasItemsTab: boolean = false;
    let layoutToken: number = 0;
    let tabsScope: string | null = null;

    let isPinned: boolean = true;
    let layoutEditorElement: HTMLElement;
    let mountedEditorElement: HTMLElement | null = null;
    let tabContent: any = null;
    let tabItems: Tab[] = [];
    let tabsLoading: boolean = false;
    let activeTab: Tab | null = null;
    let layoutData: any;

    let isHidden: boolean = false;
    const generalFilterStore = getGeneralFilterStore(uniqueKey);
    const treeNodeRules = generalFilterStore.treeNodeRules;
    let mounted = false;
    let selectedNodes: SelectedNode[] = [];
    let updatingFromTree = false;

    $: tabContext = {
        scope,
        mode,
        model,
        maxSize,
        selectedNodes,
        showSort: showApplySortOrder,
        showItems: sidebar.showItemsTab,
        sidebar,
        onNodeToggle: toggleSelectedNode
    };

    export function activateTab(name: string) {
        setActiveTab(tabItems.find(tab => tab.name === name));
    }

    export function handleCollectionSearch(searchedCollection) {
        if (collection && searchedCollection.name === scope) {
            Storage.set('treeWhereData', scope, searchedCollection.where)
            Storage.set('useDataRequest', scope, searchedCollection.length < 50 ? 'yes' : 'no')
        }
        if (!isCollapsed) {
            rebuildTree()
        }
    }

    export function rebuildTree() {
        tabContent?.rebuild?.();
    }

    export function selectTreeNode(id, ids) {
        tabContent?.selectNode?.(id, ids);
    }

    export function unSelectTreeNode(id) {
        tabContent?.unselectNode?.(id);
    }

    export function getTreeEl() {
        return tabContent?.getElement?.();
    }

    export function reloadIfShowing(entity: string) {
        if (activeTab && getTabScope(activeTab.name, scope) === entity) {
            rebuildTree()
        }
    }

    export function getLayoutData() {
        return layoutData;
    }

    export function refreshLayout() {
        const token = ++layoutToken;

        loadLayout(token, () => {
            tick().then(() => {
                if (token !== layoutToken) {
                    return;
                }
                rebuildTree()
            })
        })
    }

    function onTreeNodeRulesChanged(rules: any[]): void {
        if (!mounted || updatingFromTree) return;
        const filtered = filterStaleNodes(selectedNodes, rules);
        if (filtered.length !== selectedNodes.length) {
            selectedNodes = filtered;
            saveNodes(scope, filtered);
        }
    }

    function setSelectedNodes(nodes: SelectedNode[]): void {
        selectedNodes = nodes;
        saveNodes(scope, nodes);
        updatingFromTree = true;
        treeNodeRules.set(nodes.map(n => buildRuleForNode(n, scope)));
        updatingFromTree = false;
    }

    function toggleSelectedNode(node: Omit<SelectedNode, 'icon'>): void {
        const existing = selectedNodes.find(n => n.link === node.link);
        if (existing?.id === node.id) {
            setSelectedNodes(selectedNodes.filter(n => n.link !== node.link));
        } else {
            const icon = node.scope ? getTabIcon(node.scope) : null;
            setSelectedNodes([...selectedNodes.filter(n => n.link !== node.link), { ...node, icon }]);
        }
    }

    function removeSelectedNode(id: string, link: string): void {
        setSelectedNodes(selectedNodes.filter(n => n.link !== link));
    }

    function getLinkScope(link: string): string | null {
        return getTabScope(link, scope);
    }

    function onTabSelect(tab: Tab): void {
        setActiveTab(tabItems.find(item => item.name === tab.name));
    }

    function setActiveTab(tab: Tab | undefined) {
        if (!tab || activeTab?.name === tab.name) {
            return
        }

        // the search belongs to the tab being left
        Storage.clear('treeSearchValue', scope)
        Storage.clear('treeSearchValue', '_admin')

        activeTab = tab
        Storage.set('treeItem', scope, tab.name)
    }

    /** @param token discards tabs that arrive after the user has navigated on. */
    function loadLayout(token: number, callback: () => void = () => {}) {
        tabsLoading = true;

        loadTabs(scope, isAdminPage, sidebar.hasItemsTab).then(loaded => {
            // a newer load is already under way and owns the indicator
            if (token !== layoutToken) {
                return;
            }

            tabsLoading = false;
            layoutData = loaded.layoutData;
            tabItems = loaded.tabs;
            tabsScope = scope;

            if (tabItems.length > 0) {
                const stored = tabItems.find(tab => tab.name === Storage.get('treeItem', scope));
                activeTab = stored ?? tabItems[0];
                if (!stored) {
                    Storage.set('treeItem', scope, activeTab.name);
                }
            }

            callback();
        })
    }


    function reload(): void {
        const token = ++layoutToken;

        loadedScope = scope;
        loadedIsAdminPage = isAdminPage;
        loadedHasItemsTab = sidebar.hasItemsTab;

        isHidden = false;

        setSelectedNodes(loadNodes(scope, getLinkScope));

        const savedWidth = Storage.get('panelWidth', scope);
        currentWidth = savedWidth ? (parseInt(savedWidth) || minWidth) : minWidth;

        isCollapsed = isMobileViewport() || !!Storage.get('catalog-tree-panel', scope);
        isPinned = Storage.get('catalog-tree-panel-pin', scope) !== 'not-pinned';

        loadLayout(token, () => {
            if (tabItems.length === 0) {
                isCollapsed = true
                if (!UserData.get()?.user?.isAdmin) {
                    // hide panel if user cannot configure
                    isHidden = true
                }
            }
        });
    }

    // The editor is a BackboneJS view that delegates its events to the container itself, so a page that keeps
    // its view alive would keep answering clicks in it. Hence a container per page, and one editor per container.
    $: if (layoutEditorElement && sidebar.renderLayoutEditor && layoutEditorElement !== mountedEditorElement) {
        mountedEditorElement = layoutEditorElement;
        sidebar.renderLayoutEditor(layoutEditorElement);
    }

    function applyContext(context: PageContext): void {
        const pageChanged = context.pageId !== pageId;
        const previousCollection = collection;

        pageId = context.pageId;
        scope = context.scope ?? '';
        mode = context.mode;
        model = context.model;
        collection = context.collection;
        isAdminPage = context.isAdminPage;
        sidebar = context.leftSidebar;

        if (!mounted || !sidebar.enabled || !scope) {
            return;
        }

        if (collection && collection !== previousCollection) {
            Storage.set('treeWhereData', scope, collection.where)
        }

        // these three decide which tabs exist at all
        if (scope !== loadedScope || isAdminPage !== loadedIsAdminPage || sidebar.hasItemsTab !== loadedHasItemsTab) {
            reload();
            return;
        }

        tick().then(() => tabContent?.syncAfterNavigation?.());
    }

    onMount(() => {
        mounted = true;

        const unsubscribeRules = treeNodeRules.subscribe(onTreeNodeRulesChanged);
        const unsubscribeContext = pageContextStore.subscribe(applyContext);

        return () => {
            unsubscribeContext();
            unsubscribeRules();
        };
    });

    function onSidebarResize(e: CustomEvent): void {
        Storage.set('panelWidth', scope, currentWidth.toString());

        if (sidebar.onWidthChange) {
            sidebar.onWidthChange(currentWidth);
        }
    }

    function onSidebarCollapse(e: CustomEvent): void {
        Storage.set('catalog-tree-panel', scope, isCollapsed ? 'collapsed' : '');
    }

    function onSidebarPin(e: CustomEvent): void {
        Storage.set('catalog-tree-panel-pin', scope, isPinned ? 'pin' : 'not-pinned');
    }
</script>

<TabbedSidebar className="catalog-tree-panel" position="left" hidden={!sidebar.enabled || isHidden}
               bind:width={currentWidth} bind:isCollapsed={isCollapsed} bind:isPinned={isPinned}
               {minWidth} {maxWidth} on:sidebar-resize={onSidebarResize}
               on:sidebar-collapse={onSidebarCollapse} on:sidebar-pin={onSidebarPin}
               tabs={tabItems} context={tabContext} loading={tabsLoading}
               activeName={activeTab?.name} onSelect={onTabSelect}
               bind:content={tabContent} contentReady={tabsScope === scope}
               contentKey={`${scope}/${activeTab?.name}`}>
    <svelte:fragment slot="strip">
        {#key pageId}
            <span bind:this={layoutEditorElement} class="layout-editor-container"></span>
        {/key}
    </svelte:fragment>
    <svelte:fragment slot="footer">
        {#if mode === 'list'}
            <SelectedNodesBadges nodes={selectedNodes} onRemove={removeSelectedNode}
                                 onUnsetAll={() => setSelectedNodes([])}/>
        {/if}
    </svelte:fragment>
</TabbedSidebar>

<style>
    :global(.catalog-tree-panel .sidebar-inner) {
        display: flex;
        flex-direction: column;
    }

    .layout-editor-container:empty {
        display: none;
    }

    .layout-editor-container:not(:empty) {
        padding: 4px 0;
        line-height: 0;
    }

    .layout-editor-container:not(:empty):active {
        box-shadow: none;
    }
</style>
