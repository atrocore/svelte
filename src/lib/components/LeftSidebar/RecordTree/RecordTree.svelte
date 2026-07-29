<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { onMount } from 'svelte';
    import { ApiClient } from '$lib/core/api-client';
    import { Config } from '$lib/core/config';
    import { Language } from '$lib/core/language';
    import { Metadata } from '$lib/core/metadata';
    import { Storage } from '$lib/core/storage';
    import { Notifier } from '$lib/dom/notifier';
    import type { PageMode, TreeNodeSelection } from '$lib/types/page/page-context';
    import type { SelectedNode } from '../types/selected-node';
    import { getAdminTreeData, isAdminLinkUnique } from '../utils/admin-tree';
    import { loadLinkedRecords, parseRoute } from '../utils/linked-records';
    import { buildRuleForNode } from '../utils/tree-node-rule';
    import {
        ADMIN_SEARCH_SCOPE,
        clearTreeFilter,
        clearTreeSearch,
        loadTreeFilter,
        loadTreeSearch,
        saveTreeSearch
    } from '../utils/tree-state';

    /** Entity the page showing this tree is about. */
    export let scope: string;
    /** Relation the nodes belong to, as the API names it — `_self`, `_bookmark`, or a link name. */
    export let link: string;
    /** Entity the tree asks for its data. Null for the administration menu, which comes from metadata. */
    export let treeScope: string | null = null;
    /** Entity the nodes stand for. Parts from `treeScope` for bookmarks, where the two differ. */
    export let recordScope: string | null = null;
    export let mode: PageMode = 'list';
    export let model: any = null;
    export let maxSize: number = Config.get('recordsPerPageSmall') || 20;
    export let selectedNodes: SelectedNode[] = [];

    export let selectable: boolean = false;
    export let marksPageRecord: boolean = false;
    /** The filter of the list applies to these records rather than to the ones they relate to. */
    export let filtersOwnRecords: boolean = false;
    /** Whole branches can be asked for at once. */
    export let hierarchical: boolean = true;
    export let searchable: boolean = true;
    export let showSort: boolean = true;
    export let source: 'records' | 'adminMenu' = 'records';

    export let onNodeSelect: ((node: TreeNodeSelection) => void) | null = null;
    export let onNodeToggle: ((node: Omit<SelectedNode, 'icon'>) => void) | null = null;

    $: sortScope = recordScope ?? scope;

    let treeElement: HTMLElement;
    let searchInputElement: HTMLInputElement;
    let searchValue: string = '';
    let sortBy: string | null = null;
    let sortAsc: boolean = true;
    let showEmptyPlaceholder: boolean = false;
    let mounted = false;

    let treeLoaded = false;
    let markedRecordId: string | null = null;
    let linkedNodeIds: string[] = [];
    let insertedRootIds: string[] = [];
    let scrolledToNodeId: string | null = null;

    $: if (mounted) { selectedNodes; refreshSelection(); }

    onMount(() => {
        searchValue = loadTreeSearch(searchStorageKey());
        if (searchInputElement) {
            searchInputElement.value = searchValue;
        }

        initSorting();
        mounted = true;
        // cleared by the tree.load_data handler once the nodes arrive
        Notifier.notify('Loading...')
        buildTree();

        return () => destroyTree();
    });

    export function rebuild(): void {
        destroyTree();
        buildTree();
    }

    export function getElement() {
        return window.$(treeElement);
    }

    export function unselectNode(id: string): void {
        if (!hasNodes()) {
            return;
        }

        const $tree = getElement();
        const node = $tree.tree('getNodeById', id);

        if (node) {
            $tree.tree('removeFromSelection', node);
        }
    }

    /** A rebuild is only unavoidable when the opened record lies outside the slice currently loaded. */
    export function syncAfterNavigation(): void {
        if (!hasNodes()) {
            return;
        }

        if (source === 'adminMenu') {
            selectCurrentRecord();
            return;
        }

        if (!marksPageRecord) {
            const recordId = model?.get('id') ?? null;
            if (recordId !== markedRecordId) {
                    linkedNodeIds = [];
                markLinkedNodes();
            }

            refreshSelection();
            return;
        }

        const id = mode === 'detail' ? model?.get('id') : null;
        if (!id) {
            clearSelection();
            return;
        }

        const $tree = window.$(treeElement);
        const route = getCurrentRecordRoute();

        if (!$tree.tree('getNodeById', id) && !route.some(nodeId => $tree.tree('getNodeById', nodeId))) {
            rebuild();
            return;
        }

        selectNode(id, route);
    }

    export function selectNode(id, ids) {
        if (!hasNodes()) {
            return;
        }

        const $tree = window.$(treeElement);
        const onFinished = () => {
            let node = $tree.tree('getNodeById', id);
            if (node) {
                $tree.tree('addToSelection', node, false);

                // brought into view when the user moves to it, never while they load more nodes around it
                if (id !== scrolledToNodeId) {
                    scrolledToNodeId = id;
                    node.element?.scrollIntoView({ block: 'nearest' });
                }
            }

            $tree.find(`.jqtree-title`).each((k, el) => {
                el = window.$(el);
                let li = el.parent().parent();

                const elId = el.data('id') + ''
                if (elId !== id && $tree.tree('getNodeById', elId)) {
                    $tree.tree('removeFromSelection', $tree.tree('getNodeById', elId));
                    li.removeClass('jqtree-selected');
                    return;
                } else if (!li.hasClass('jqtree-selected')) {
                    li.addClass('jqtree-selected');
                }
            });
        }

        openNodes($tree, ids, onFinished);
    }

    export function refreshSelection(): void {
        if (!treeElement || !selectable) return;

        const $tree = window.$(treeElement);
        const currentRecordId = mode === 'detail' ? model?.get('id') : null;

        $tree.find('li.jqtree_common').each((_, el) => {
            const $li = window.$(el);
            const nodeId = $li.find('> .jqtree-element .jqtree-title').data('id') + '';
            // picked as a filter, or linked to the record on screen
            const isSelected = selectedNodes.some(n => n.id === nodeId && n.link === link)
                || linkedNodeIds.includes(nodeId);
            $li.toggleClass('jqtree-selected', isSelected);
            $li.toggleClass('current-record', !!currentRecordId && nodeId === currentRecordId + '');
        });
    }

    function isTreeBuilt(): boolean {
        return !!treeElement && !!window.$(treeElement).data('simple_widget_tree');
    }

    /** The widget only answers questions about nodes once they have arrived. */
    function hasNodes(): boolean {
        return isTreeBuilt() && treeLoaded;
    }

    function destroyTree() {
        insertedRootIds = [];
        scrolledToNodeId = null;
        treeLoaded = false;

        if (!isTreeBuilt()) {
            return;
        }

        const $tree = window.$(treeElement);
        $tree.tree('destroy');
        $tree.off('tree.load_data tree.refresh tree.move tree.click tree.open tree.close');
    }

    function buildTree(data = null): void {
        if (source === 'adminMenu') {
            data = getAdminTreeData(searchValue);
        }
        let $tree = window.$(treeElement);
        let whereData = getWhereData();
        let foreignWhereData = getForeignWhereData();
        let hasTextFilter = !!searchValue;

        if (
            data === null
            && Metadata.get(['scopes', recordScope, 'type']) === 'Hierarchy'
            && (canUseDataRequest() || hasTextFilter)
            && hierarchical
        ) {
            if (searchValue) {
                whereData.push({"type": "textFilter", "value": searchValue});
            }
            ApiClient.get(`${recordScope}/treeData`, {
                "where": whereData,
                "foreignWhere": foreignWhereData,
                "scope": scope,
                "link": link,
                "sortBy": sortBy,
                "asc": !!sortAsc
            }).then(response => {
                buildTree(filterResponse(response));
            });

            return;
        }

        let treeData = {
            dataUrl: generateUrl,
            dataFilter: response => filterResponse(response),
            selectable: true,
            saveState: false,
            autoOpen: false,
            dragAndDrop: Metadata.get(['scopes', recordScope, 'multiParents']) !== true && Metadata.get(['scopes', recordScope, 'dragAndDrop']) && sortBy === 'sortOrder',
            useContextMenu: false,
            closedIcon: window.$('<i class="ph ph-caret-right"></i>'),
            openedIcon: window.$('<i class="ph ph-caret-down"></i>'),
            onCreateLi: function (node, $li, is_selected) {
                if (node.disabled) {
                    $li.addClass('disabled');
                } else {
                    $li.removeClass('disabled');
                }

                const $title = $li.find('.jqtree-title');

                if (searchValue) {
                    let search = searchValue.replace(/\*/g, '');
                    if (search.length > 0) {
                        let name = $title.html();
                        let matches = name.match(new RegExp(search, 'ig'));
                        if (matches) {
                            let processed = [];
                            matches.forEach(v => {
                                if (!processed.includes(v)) {
                                    processed.push(v);
                                    $title.html(name.replace(new RegExp(v, 'g'), `<b>${v}</b>`));
                                }
                            });
                        }
                    }
                }

                if (model && model.get('id') === node.id && (marksPageRecord || node.scope === model.name)) {
                    $tree.tree('addToSelection', node, false);
                    $li.addClass('jqtree-selected');
                }

                // inside a sub-tree the record sits among records of the linked entity, so it is marked apart
                if (mode === 'detail' && model && model.get('id') === node.id && isNodeInSubTree(node)) {
                    $li.addClass('current-record');
                }

                if (selectable && selectedNodes.some(n => n.id === node.id && n.link === link)) {
                    $li.addClass('jqtree-selected');
                }

                if (source === 'adminMenu'
                    && ((Metadata.get(['scopes', getHashScope()])
                        && (node.id.includes('#' + getHashScope() + '/'))
                        && isAdminLinkUnique(getHashScope(), searchValue)) || node.id === window.location.hash)) {
                    $tree.tree('addToSelection', node, false);
                    $li.addClass('jqtree-selected');
                }

                $title.attr('data-id', node.id);

                if (node.showMoreDirection) {
                    $li.addClass('show-more');
                    $li.addClass('show-more-' + node.showMoreDirection);
                    $li.find('.jqtree-title').addClass('more-label');
                } else {
                    $title.attr('title', node.name);

                    if (source !== 'adminMenu' && scope !== recordScope && !isNodeInSubTree(node)) {
                        const $el = window.$(`<span class="load-items"></span>`)
                        $li.find('.jqtree-element').prepend($el);
                    }
                    if (!node.disabled && node.scope !== scope) {
                        const $el = $li.find('.jqtree-element .load-items');
                        $el.addClass('ph').addClass(node.subTreeLoaded ? 'ph-minus-square' : 'ph-plus-square');
                        $el.on('click', () => toggleSubTree($tree, node));
                        $li.addClass('sub-tree-container');
                        if (node.has_children) {
                            $li.addClass('has-children');
                        }
                    }
                }

                if ($li.hasClass('jqtree-folder')) {
                    return;
                }

                const $element = $li.find('> .jqtree-element');

                if ($element.children('.jqtree-toggler').length === 0) {
                    $element.prepend('<i class="jqtree-toggler jqtree_common jqtree-toggler-left" role="presentation"></i>')
                }
            }.bind(this),
            onCanMove: function (node) {
                return !isNodeInSubTree(node);
            }
        };

        if (data) {
            treeData['data'] = data;
            treeData['autoOpen'] = true;
            treeData['dragAndDrop'] = false;
            showEmptyPlaceholder = data.length === 0

            if (source !== 'adminMenu') {
                treeData['autoOpen'] = false;
                setInitialOpenState(data);
            }
        }

        let dataLoaded = false;

        $tree.on('tree.load_data', e => {
            Notifier.clearRegular()
            treeLoaded = true;
            if (dataLoaded) {
                return
            }

            markLinkedNodes();
            dataLoaded = true;
        })
        $tree.on('tree.refresh', e => {
            showEmptyPlaceholder = $tree.tree('getTree')?.children?.length === 0
            selectCurrentRecord();
        })
        $tree.on('tree.move', e => {
            e.preventDefault();

            const parentName = 'parent';

            let moveInfo = e.move_info;
            let data = {
                _position: moveInfo.position,
                _sortAsc: sortAsc,
                _target: moveInfo.target_node.id
            };

            data[parentName + 'Id'] = null;
            data[parentName + 'Name'] = null;

            if (moveInfo.position === 'inside') {
                data[parentName + 'Id'] = moveInfo.target_node.id;
                data[parentName + 'Name'] = moveInfo.target_node.name;
            } else if (moveInfo.target_node.parent.id) {
                data[parentName + 'Id'] = moveInfo.target_node.parent.id
                data[parentName + 'Name'] = moveInfo.target_node.parent.name;
            }

            ApiClient.patch(`${recordScope}/${moveInfo.moved_node.id}`, data).then(() => {
                moveInfo.do_move();
            });
        })
        $tree.on('tree.click', e => {
            e.preventDefault();

            if (source === 'adminMenu' && !e.node.disabled) {
                window.location.href = e.node.id;
                return;
            }

            if (e.node.disabled) {
                return false;
            }

            const el = window.$(e.click_event.target);
            if (el.hasClass('jqtree-title') || el.parent().hasClass('jqtree-title')) {
                let node = e.node;

                if (node.showMoreDirection) {
                    return loadMore(node);
                }

                // here a node is a filter as well as a destination
                if (selectable && !isNodeInSubTree(node)) {
                    if (onNodeToggle) {
                        onNodeToggle({
                            id: node.id,
                            name: node.name,
                            scope: node.scope || treeScope,
                            link: link
                        });
                    }

                    let route = [];
                    let n = node;
                    while (n.parent.id) {
                        route.push(n.parent.id);
                        n = n.parent;
                    }
                    const data: any = {id: node.id, route: '', scope: node.scope, click: true};
                    if (route.length > 0) {
                        data.route = '|' + route.reverse().join('|') + '|';
                    }
                    if (onNodeSelect) {
                        onNodeSelect(data);
                    }
                    return;
                }

                let route = [];
                while (node.parent.id) {
                    route.push(node.parent.id);
                    node = node.parent;
                }

                let data = {id: e.node.id, route: '', scope: e.node.scope, click: true};
                if (route.length > 0) {
                    data['route'] = "|" + route.reverse().join('|') + "|";
                }

                if (onNodeSelect) {
                    onNodeSelect(data);
                }
            }
        });

        $tree.on('tree.open', e => {
            if (!e.node?.element) {
                return;
            }

            if (!e.node.has_children) {
                setSubTreeIcon(e.node, 'open');
            }
        });

        $tree.on('tree.close', e => {
            if (!e.node?.element) {
                return;
            }
            const node = e.node
            if (getSubTreeToggler(node).length > 0) {
                setSubTreeIcon(node, 'closed');
                if (node.subTreeData && node.subTreeLoaded && node.has_children) {
                    node.subTreeLoaded = false;
                    $tree.tree('loadData', getDataWithoutSubTree(node), node);
                }
            }
        });

        $tree.tree(treeData);
    }

    async function toggleSubTree($tree, node) {
        if (node.disabled) {
            return;
        }

        if (!node.subTreeData) {
            setSubTreeIcon(node, 'loading');
            try {
                const respData = await ApiClient.get<any[]>(generateSubTreeUrl(node))
                node.subTreeData = filterResponse(respData).map(item => ({...item, scope: scope}))
            } catch (e) {
                setSubTreeIcon(node, 'closed');
                throw e;
            }
        }

        if (!node.subTreeLoaded) {
            if (node.has_children) {
                $tree.tree('loadData', [...node.subTreeData, ...node.getData()], node);
            } else if (node.getData().length === 0) {
                $tree.tree('loadData', node.subTreeData, node);
            }
            node.subTreeLoaded = true;
            if (!node.is_open) {
                $tree.tree('openNode', node, true, () => setSubTreeIcon(node, 'open'));
            } else {
                setSubTreeIcon(node, 'open');
            }
        } else {
            node.subTreeLoaded = false;
            if (!node.has_children) {
                $tree.tree('closeNode', node, true)
            } else {
                setSubTreeIcon(node, 'closed');
                $tree.tree('loadData', getDataWithoutSubTree(node), node);
            }
        }
    }

    function getSubTreeToggler(node: any) {
        return window.$(node.element).find('> .jqtree-element .load-items');
    }

    /** The toggler doubles as the progress indicator: while the sub-tree is fetched it spins in place. */
    function setSubTreeIcon(node: any, state: 'open' | 'closed' | 'loading'): void {
        const $toggler = getSubTreeToggler(node);
        if ($toggler.length === 0) {
            return;
        }

        $toggler.removeClass('ph-plus-square ph-minus-square ph-circle-notch ph-spin');

        if (state === 'loading') {
            $toggler.addClass('ph-circle-notch ph-spin');
        } else {
            $toggler.addClass(state === 'open' ? 'ph-minus-square' : 'ph-plus-square');
        }
    }

    function getDataWithoutSubTree(node) {
        return node.getData().filter(item => !node.subTreeData.find(i => i.id === item.id))
    }

    function isNodeInSubTree(node) {
        if (!node || !node.id) {
            return false;
        }
        return node.scope && node.scope !== recordScope
    }

    function getSubTreeRootId(node) {
        if (!node || !node.id) {
            return null;
        }
        if (!node.scope || node.scope === recordScope) {
            return node.id
        }

        while (node.parent) {
            node = node.parent;
            if (!node.scope || node.scope === recordScope) {
                return node.id
            }
        }

        return null
    }

    /** Marks the nodes the record on screen is linked to — the categories a product sits in, its brand. */
    async function markLinkedNodes(): Promise<void> {
        if (!recordScope || !hasNodes()) {
            return;
        }

        const recordId = mode === 'detail' ? model?.get('id') : null;

        if (!recordId || !selectable) {
            // there is no record to reveal, so the branches pulled in for the previous one can go
            markedRecordId = null;
            removeInsertedRootNodes(window.$(treeElement));
            return;
        }

        const isHierarchy = Metadata.get(['scopes', recordScope, 'type']) === 'Hierarchy';
        const linked = await loadLinkedRecords(scope, link, model, isHierarchy);

        // the user may have moved on to another record while the request was in flight
        if (!hasNodes() || model?.get('id') !== recordId) {
            return;
        }

        linkedNodeIds = linked.map(record => record.id);
        const $tree = window.$(treeElement);

        if (linked.length === 0) {
            // An unfetched model answers "no links" for a link field, which is indistinguishable from a record
            // that really has none. Leave the record unmarked so that the publish after the fetch tries again.
            removeInsertedRootNodes($tree);
            return;
        }

        markedRecordId = recordId;

        if (isHierarchy) {
            await syncInsertedRootNodes($tree, linked.map(record => record.id));
        }

        for (const record of linked) {
            const routes = record.routes.length > 0 ? record.routes : [''];
            for (const route of routes) {
                await openRoute($tree, parseRoute(route));
                selectNodeById($tree, record.id);
            }
        }
    }

    /**
     * A linked record may sit outside the loaded slice, so its branch is fetched and appended to the roots.
     * Branches this record does not need go away again — left in place they would pile up as the user walks
     * through records, and a later "Show more" would fetch them a second time next to the copy already there.
     */
    async function syncInsertedRootNodes($tree: any, ids: string[]): Promise<void> {
        // the endpoint reads ids as a query array, which ApiClient would otherwise JSON-encode into one string
        const response = await ApiClient.get<Record<string, any>>(`${recordScope}/treeData?${window.$.param({ ids })}`);
        const branches = response?.tree || [];

        removeInsertedRootNodes($tree, branches.map((node: any) => String(node.id)));

        branches.forEach((node: any) => {
            const roots = $tree.tree('getTree').children || [];
            if (roots.findIndex((root: any) => root.id === node.id) !== -1) {
                return;
            }

            const lastRoot = roots.slice().reverse().find((root: any) => !String(root.id).includes('show-more'));
            if (lastRoot) {
                $tree.tree('addNodeAfter', node, $tree.tree('getNodeById', lastRoot.id));
                insertedRootIds = [...insertedRootIds, String(node.id)];
            }
        });
    }

    function removeInsertedRootNodes($tree: any, keepIds: string[] = []): void {
        insertedRootIds.forEach(id => {
            if (keepIds.includes(id)) {
                return;
            }

            const node = $tree.tree('getNodeById', id);
            if (node) {
                $tree.tree('removeNode', node);
            }
        });

        insertedRootIds = insertedRootIds.filter(id => keepIds.includes(id));
    }

    function openRoute($tree: any, route: string[]): Promise<void> {
        return new Promise(resolve => {
            const openNext = (parent: any): void => {
                if (route.length === 0) {
                    resolve();
                    return;
                }

                const id = route.shift();
                const node = parent
                    ? (parent.children || []).find((child: any) => child.id === id)
                    : $tree.tree('getNodeById', id);

                if (!node) {
                    resolve();
                } else if (node.is_open) {
                    openNext(node);
                } else {
                    $tree.tree('openNode', node, false, openNext);
                }
            };

            openNext(null);
        });
    }

    function selectNodeById($tree: any, id: string): void {
        const node = $tree.tree('getNodeById', id);
        if (node) {
            $tree.tree('addToSelection', node, false);
        }
    }

    function getCurrentRecordRoute(): string[] {
        return (model?.get('routesNames')?.[0]?.map((item: any) => item.id) || []).reverse();
    }

    /** Highlights the record — or the admin page — the tree has just been built for. */
    function selectCurrentRecord(): void {
        if (source === 'adminMenu') {
            const hashScope = getHashScope();
            if (Metadata.get(['scopes', hashScope])) {
                selectNode('#' + hashScope, [])
            }
            return;
        }

        if (mode === 'detail' && model && marksPageRecord) {
            selectNode(model.get('id'), getCurrentRecordRoute())
        }
    }

    function clearSelection(): void {
        if (!hasNodes()) {
            return;
        }

        const $tree = window.$(treeElement);
        ($tree.tree('getSelectedNodes') || []).forEach((node: any) => $tree.tree('removeFromSelection', node));
        $tree.find('li.jqtree-selected').removeClass('jqtree-selected');
    }

    function openNodes($tree, ids, onFinished) {
        if (!Array.isArray(ids) || ids.length === 0) {
            onFinished()
            return
        }

        const item = ids[0]
        let els = $tree.find(`.jqtree-title[data-id="${item}"]`);
        if (els.length > 0) {
            els.each((k, el) => {
                el = window.$(el);
                let $li = el.parent().parent();
                if ($li.hasClass('jqtree-closed')) {
                    let node = $tree.tree('getNodeByHtmlElement', el);
                    $tree.tree('openNode', node, false, () => openNodes($tree, ids.slice(1), onFinished));
                } else {
                    openNodes($tree, ids.slice(1), onFinished)
                }
            });
        }
    }

    function loadMore(node) {
        setShowMoreLoading(node, true);
        ApiClient.get<Record<string, any>>(generateUrl(node)).then(response => {
            if (response['list']) {
                const $tree = window.$(treeElement);
                const parentNode = node.getParent();
                const items = filterResponse(JSON.parse(JSON.stringify(response)), node.showMoreDirection);

                // this page covers those nodes now, so they are no longer ours to take away again
                insertedRootIds = insertedRootIds.filter(id => !items.some(item => String(item.id) === id));

                if (node.showMoreDirection === 'up') {
                    // prepend
                    items.reverse().forEach(item => {
                        prependNode($tree, item, parentNode);
                    });
                } else if (node.showMoreDirection === 'down') {
                    // append
                    items.forEach(item => {
                        appendNode($tree, item, parentNode);
                    });
                }
                $tree.tree('removeNode', node);
                if (parentNode) {
                    // Fix caret loader
                    setSubTreeIcon(parentNode, 'open');
                }
            }
        }).finally(() => setShowMoreLoading(node, false));
    }

    /** The arrow gives way to a spinner while the page is on the way; the node itself is then replaced. */
    function setShowMoreLoading(node: any, loading: boolean): void {
        const $li = window.$(node.element);
        if ($li.length === 0) {
            return;
        }

        $li.toggleClass('show-more-loading', loading);
        $li.find('.show-more-loader').remove();

        if (loading) {
            // inside the label, because the element around it is a flex row that orders its children itself
            $li.find('.jqtree-title').append('<i class="ph ph-circle-notch ph-spin show-more-loader"></i>');
        }
    }

    function appendNode($tree, item, parent) {
        let element = parent || $tree.tree('getTree'),
            nodes = (element.children || []);

        if (nodes.findIndex(node => item.id === node.id) === -1) {
            $tree.tree('appendNode', item, parent);
        }
    }

    function prependNode($tree, item, parent) {
        let element = parent || $tree.tree('getTree'),
            nodes = (element.children || []);

        if (nodes.findIndex(node => item.id === node.id) === -1) {
            $tree.tree('prependNode', item, parent);
        }
    }

    function pushShowMore(list, direction) {
        if (!direction || direction === 'up') {
            let first = JSON.parse(JSON.stringify(list)).shift();
            if (first && first.offset && first.offset !== 0) {
                list.unshift({
                    id: 'show-more-' + first.offset,
                    offset: first.offset,
                    showMoreDirection: 'up',
                    name: Language.translate('Show more'),
                    scope: first.scope,
                });
            }
        }

        if (!direction || direction === 'down') {
            let last = JSON.parse(JSON.stringify(list)).pop();
            if (last && last.offset && last.total - 1 !== last.offset) {
                list.push({
                    id: 'show-more-' + last.offset,
                    offset: last.offset,
                    showMoreDirection: 'down',
                    name: Language.translate('Show more'),
                    scope: last.scope,
                });
            }
        }

        list.forEach(item => {
            if (item.children) {
                pushShowMore(item.children);
            }
        });
    }

    function generateUrl(node) {
        // only a tab standing for a relation shows records of another entity hanging off a node
        if (isNodeInSubTree(node) && selectable) {
            return generateSubTreeUrl(node)
        }

        let url = `entityTree?entityName=${treeScope}&isTreePanel=1&scope=${scope}&link=${link}`;
        if (sortBy) {
            url += `&sortBy=${sortBy}&asc=${sortAsc ? 'true' : 'false'}`
        }
        if (node && node.showMoreDirection) {
            let offset = node.offset;
            let maxSize1 = maxSize;
            if (node.showMoreDirection === 'up') {
                let diff = node.offset - maxSize1;
                offset = node.offset - maxSize1;
                if (diff < 0) {
                    offset = 0;
                    maxSize1 = maxSize1 + diff;
                } else {
                    offset = diff;
                }
            } else if (node.showMoreDirection === 'down') {
                offset = offset + 1;
            }
            url += '&offset=' + offset + '&maxSize=' + maxSize1;
            if (node.getParent()) {
                url += '&node=' + node.getParent().id;
            }
        } else if (node && node.id) {
            url += '&node=' + node.id + '&offset=0&maxSize=' + maxSize;
        } else if (model && model.id && [model.urlRoot, 'Bookmark'].includes(treeScope)) {
            url += '&selectedId=' + model.id;
        }
        let whereData = [];
        if (searchValue) {
            whereData.push({"type": "textFilter", "value": searchValue});
        }

        if (filtersOwnRecords) {
            whereData = [...whereData, ...getWhereData()]
        }

        if (whereData.length > 0) {
            url += "&";
            url += window.$.param({"where": whereData});
        }

        const foreignWhere = getForeignWhereData()
        if (foreignWhere.length > 0) {
            url += "&";
            url += window.$.param({"foreignWhere": foreignWhere});
        }

        return url;
    }

    function generateSubTreeUrl(node) {
        const foreignWhere = getForeignWhereData()
        let url = `entityTree?entityName=${scope}&isTreePanel=1&scope=${scope}&link=_self`;
        if (Metadata.get(['scopes', scope, 'type']) === 'Hierarchy') {
            url = `${scope}/treeData?scope=${scope}&link=_self`
        }

        if (node.showMoreDirection) {
            let offset = node.offset;
            let maxSize1 = maxSize;
            if (node.showMoreDirection === 'up') {
                let diff = node.offset - maxSize1;
                offset = node.offset - maxSize1;
                if (diff < 0) {
                    offset = 0;
                    maxSize1 = maxSize1 + diff;
                } else {
                    offset = diff;
                }
            } else if (node.showMoreDirection === 'down') {
                offset = offset + 1;
            }
            url += '&offset=' + offset + '&maxSize=' + maxSize1;
        } else if (isNodeInSubTree(node) && node.id) {
            url += '&node=' + node.id + '&offset=0&maxSize=' + maxSize;
        }

        foreignWhere.push({
            operator: 'linked_with',
            id: link,
            field: link,
            value: [getSubTreeRootId(node)]
        })
        url += "&";
        url += window.$.param({"where": foreignWhere});

        return url;
    }

    function getWhereData(): any[] {
        return filtersOwnRecords ? loadTreeFilter(scope) : [];
    }

    function getForeignWhereData() {
        let whereData = filtersOwnRecords ? [] : loadTreeFilter(scope);

        // When a node is selected in the current linked tab — exclude its rule from tree filtering
        // (the node is highlighted but the tree shows all items unfiltered)
        const activeNode = selectedNodes.find(n => n.link === link);
        if (activeNode && Array.isArray(whereData)) {
            const rule = buildRuleForNode(activeNode, scope);
            whereData = whereData.map((item: any) => {
                if (item.condition && Array.isArray(item.rules)) {
                    return {
                        ...item,
                        rules: item.rules.filter((r: any) =>
                            !(r.id === rule.id &&
                              r.operator === rule.operator &&
                              Array.isArray(r.value) &&
                              r.value[0] === rule.value[0])
                        )
                    };
                }
                return item;
            }).filter((item: any) => !(item.condition && item.rules?.length === 0));
        }

        return whereData
    }

    function canUseDataRequest() {
        if (!filtersOwnRecords || getWhereData().length > 0) {
            return true
        }
        return false
    }

    function getDisabledNodesFromFilter() {
        const res = []

        let field = link
        let operator = 'linked_with'

        if (Metadata.get(['entityDefs', scope, 'fields', field, 'type']) === 'link') {
            field = field + 'Id';
            operator = 'in'
        }

        getForeignWhereData().forEach(item => {
            if (item.rules) {
                item.rules.forEach(rule => {
                    if (rule.operator === operator && rule.id === field && rule.value.length === 1) {
                        res.push(rule.value[0])
                    }
                })
            }
        })
        return res
    }

    function filterResponse(response, direction = null) {
        let res;
        if (response.tree) {
            res = response.tree;
        } else if (!response.list) {
            res = response;
        } else {
            res = response.list;
            pushShowMore(response.list, direction);
        }

        getDisabledNodesFromFilter().forEach(id => {
            const node = res.find(item => item.id === id)
            if (node) {
                node.disabled = true;
            }
        })

        addHasChildren(res)

        return res;
    }

    function addHasChildren(list) {
        list.forEach(item => {
            if (item.load_on_demand) {
                item.has_children = true;
            }
            if (item.children && item.children.length > 0) {
                item.has_children = true;
                addHasChildren(item.children);
            }
        });
    }

    function setInitialOpenState(list) {
        list.forEach(item => {
            if (item.children && item.children.length > 0) {
                const hasGrandchildren = item.children.some(child => child.children && child.children.length > 0);
                item.is_open = hasGrandchildren;
                setInitialOpenState(item.children);
            }
        });
    }

    function getHashScope() {
        let locationHash = window.location.hash;
        return locationHash.split('/').shift().replace('#', '');
    }

    function searchStorageKey(): string {
        return source === 'adminMenu' ? ADMIN_SEARCH_SCOPE : scope;
    }

    /** Sorting is remembered per tab: each one lists a different set of records. */
    function sortStorageKey(): string {
        return `${scope}/${link}`;
    }

    function applySearch() {
        searchValue = searchInputElement.value
        if (searchValue) {
            saveTreeSearch(searchStorageKey(), searchValue)
        } else {
            clearTreeSearch(scope)
        }
        Notifier.notify('Loading...')
        rebuild()
    }

    function treeReset() {
        searchInputElement.value = ''
        if (mode === 'detail') {
            clearTreeFilter(scope)
        }
        applySearch()
    }

    function initSorting(): void {
        const stored = Storage.get('treeItemSorting', sortStorageKey())
        if (stored && typeof stored === 'object' && !!Metadata.get(['entityDefs', sortScope, 'fields', stored.sortBy])) {
            sortAsc = stored.sortAsc
            sortBy = stored.sortBy
            return
        }

        if (Metadata.get(['scopes', recordScope, 'type']) === 'Hierarchy' && hierarchical) {
            sortBy = 'sortOrder'
        } else {
            sortBy = Metadata.get(['entityDefs', sortScope, 'collection', 'sortBy']);
        }

        if (!sortBy || !Metadata.get(['entityDefs', sortScope, 'fields', sortBy])) {
            sortBy = getSortFields()[0]?.name
        }

        sortAsc = !!Metadata.get(['entityDefs', sortScope, 'collection', 'asc'])
        Storage.set('treeItemSorting', sortStorageKey(), {sortBy, sortAsc})
    }

    function getSortFields() {
        if (!sortScope) {
            return []
        }

        const fieldDefs = Metadata.get(['entityDefs', sortScope, 'fields']) ?? {};
        return Object.keys(fieldDefs).filter(function (item) {
            return ['varchar', 'text', 'int', 'float', 'date', 'datetime'].includes(fieldDefs[item].type) && !fieldDefs[item].notStorable;
        }).sort(function (v1, v2) {
            return Language.translate(v1, 'fields', sortScope).localeCompare(Language.translate(v2, 'fields', sortScope));
        }).map(item => {
            return {name: item, label: Language.translate(item, 'fields', sortScope)}
        })
    }

    function setSortBy(field: string): void {
        sortBy = field;
        Storage.set('treeItemSorting', sortStorageKey(), {sortBy, sortAsc});
        rebuild();
    }

    function onSortAscChange(event) {
        event.preventDefault();
        sortAsc = !sortAsc;
        Storage.set('treeItemSorting', sortStorageKey(), {sortBy, sortAsc})
        rebuild()
    }
</script>

<div class="panel-group category-search" style="margin-bottom: 20px" class:hidden={!searchable}>
    <div class="field" data-name="category-search">
        <input type="text" bind:this={searchInputElement}
               on:keydown={(e) => e.key === 'Enter' && applySearch()} tabindex="1"
               class="form-control category-search" class:search-enabled={!!searchValue}
               placeholder={Language.translate('typeToSearch')}>

        <div class="button-container">
            {#if searchValue}
                <button on:click={treeReset} class="ph ph-x reset-search-in-tree-button"></button>
            {/if}
            <button on:click={applySearch} class="search-in-tree-button">
                <i class="ph ph-magnifying-glass"></i>
            </button>
        </div>
    </div>
    <div class="search-wrapper">
        {#if showSort}
            <div class="sort-container">
                <div class="button-group">
                    <button type="button" class="sort-dir-button"
                            title={Language.translateOption(sortAsc?'asc':'desc','sortDirection','Entity')}
                            on:click={onSortAscChange}>
                        <i class={'ph '+(sortAsc ? 'ph-sort-descending':'ph-sort-ascending')}></i>
                    </button>
                    <button type="button" class="sort-by-button"
                            data-toggle="dropdown">{Language.translate(sortBy, 'fields', sortScope)}</button>
                    <ul class="dropdown-menu">
                        {#each getSortFields().filter(field => field.name !== sortBy) as field }
                            <li><a href="#"
                                   on:click|preventDefault={() => setSortBy(field.name)}>{field.label}</a>
                            </li>
                        {/each}
                    </ul>
                </div>
            </div>
        {/if}
    </div>
</div>

<div class={"panel-group category-tree tree-" + link} style="margin-left: -6px;" bind:this={treeElement}></div>

{#if showEmptyPlaceholder}
    <div class="no-data-container"><p>{Language.translate('No Data')}</p></div>
{/if}

<style>
    .field[data-name="category-search"] {
        position: relative;
    }

    .field[data-name="category-search"] > input.category-search {
        background-color: #fff;
        padding: 8px 36px 8px 12px;
        border-radius: 5px;
        border-bottom: 1px solid #e8eced;
    }

    .field[data-name="category-search"] > input.category-search:focus {
        border-color: #06c;
    }

    .field[data-name="category-search"] > input.category-search.search-enabled {
        padding-right: 58px;
    }

    .field[data-name="category-search"] .button-container {
        position: absolute;
        top: 50%;
        right: 12px;
        display: flex;
        gap: 10px;
        align-items: center;
        transform: translateY(-50%);
        padding: 0;
    }

    .field[data-name="category-search"] button {
        border: none;
        background: none;
        padding: 0;
    }

    .search-wrapper {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
    }

    .sort-container {
        margin-top: 5px;
    }

    .sort-container,
    .sort-by-button,
    .sort-dir-button {
        font-size: 12px;
    }

    .sort-by-button,
    .sort-dir-button {
        background-color: transparent;
        padding: 0 3px;
        border-color: transparent;
        border-radius: 3px;
        outline: 0;
        color: var(--primary-font-color);
    }

    .sort-dir-button {
        padding: 0;
        margin-inline-end: 2px;
    }

    .sort-dir-button i {
        font-size: 16px;
    }

    .sort-container .dropdown-menu li a {
        padding: 5px 15px;
        font-size: 12px;
        line-height: 16px;
    }

    .sort-by-button:hover,
    .sort-container .button-group.open .sort-by-button {
        border-color: var(--primary-border-color);
    }

    .no-data-container {
        padding: 0 10px;
    }

    :global(ul.jqtree-tree .jqtree-element:not(.btn)) {
        line-height: 16px;
        white-space: nowrap;
        display: flex;
        align-items: center;
        flex-wrap: nowrap;
    }

    :global(ul.jqtree-tree .jqtree-element:not(.btn) .jqtree-toggler) {
        order: 1;
        flex-shrink: 0;
    }

    :global(ul.jqtree-tree .jqtree-element:not(.btn) .jqtree-title) {
        order: 3;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    :global(ul.jqtree-tree li.jqtree_common) {
        position: relative;
    }

    :global(ul.jqtree-tree .load-items.ph-spin) {
        cursor: default;
    }

    :global(ul.jqtree-tree li.show-more-loading:after) {
        content: none;
    }

    :global(ul.jqtree-tree li.show-more .show-more-loader) {
        display: inline-block;
        line-height: 1;
        font-size: 12px;
        font-style: normal;
        margin-left: 4px;
        vertical-align: middle;
    }

    :global(.tree-_admin ul.jqtree-tree .jqtree_common.disabled > div > span) {
        color: #000;
        font-weight: bold;
    }
</style>
