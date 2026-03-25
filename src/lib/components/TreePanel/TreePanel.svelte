<script lang="ts">
    import { onMount, tick } from 'svelte';
    import { Storage } from "$lib/core/storage";
    import { LayoutManager } from "$lib/core/layout-manager";
    import { Language } from "$lib/core/language"
    import { Metadata } from '$lib/core/metadata';
    import { Config } from '$lib/core/config';
    import { Notifier } from "$lib/core/notifier";
    import { UserData } from "$lib/core/user-data";
    import Preloader from "$lib/components/loaders/Preloader/Preloader.svelte";
    import CollapsibleSidebar from "$lib/components/collapsers/ResizableCollapser/ResizableCollapser.svelte";
    import { ApiClient } from '$lib/core/api-client';
    import { getTabIcon, getSystemIconUrl } from '$lib/helpers/icon';
    import { Acl } from "$lib/core/acl";
    import SelectedNodesBadges from './SelectedNodesBadges/SelectedNodesBadges.svelte';
    import type { SelectedNode } from './types/selected-node';
    import { getGeneralFilterStore } from '$lib/stores/general-filter.store';
    import { buildRuleForNode, saveNodes, loadNodes, filterStaleNodes } from './utils/tree-node-rule';

    export let scope: string;
    export let uniqueKey: string = 'default';
    export let model: any = null;
    export let collection: any = null;
    export let callbacks: object = {};
    export let minWidth: number = 300;
    export let maxWidth: number = 600;
    export let currentWidth: number = minWidth;
    export let isCollapsed: boolean = false;
    export let mode: string;
    export let maxSize: number = Config.get('recordsPerPageSmall') || 20;

    export let showItems: boolean = true;
    export let hasItems: boolean = false;

    export let renderLayoutEditor: (element: HTMLElement) => void = () => {
    };

    export let isAdminPage: boolean = false;

    export let showApplySortOrder: boolean = true

    export function setShowItems(value: string[]) {
        showItems = value;
        if (value) {
            setActiveItem(treeItems.filter(v => v.name === '_items')[0])
        } else if (!value && activeItem.name === '_items') {
            setActiveItem(treeItems[0]);
        }
    }

    let isPinned: boolean = true;
    let treeElement: HTMLElement;
    let selectionItemElement: HTMLElement;
    let layoutEditorElement: HTMLElement;
    let searchInputElement: HTMLInputElement;
    let treeItems: any[] = [];
    let activeItem: object;
    let layoutLoading: boolean = false;
    let treeLoading: boolean = false;
    let searchValue: string = '';
    let treeScope: string | null;
    let treeIcon: string | null;
    let layoutData: any;

    let isHidden: boolean = false;
    let sortAsc: boolean = true;
    let sortBy: string | null = null;
    let showEmptyPlaceholder: boolean = false;
    const generalFilterStore = getGeneralFilterStore(uniqueKey);
    const treeNodeRules = generalFilterStore.treeNodeRules;
    let mounted = false;
    let selectedNodes: SelectedNode[] = [];
    let updatingFromTree = false;

    treeNodeRules.subscribe(rules => {
        if (!mounted || updatingFromTree) return;
        const filtered = filterStaleNodes(selectedNodes, rules);
        if (filtered.length !== selectedNodes.length) {
            selectedNodes = filtered;
            saveNodes(scope, filtered);
        }
    });

    $: if (mounted) { selectedNodes; refreshTreeSelection(); }

    $: {
        treeScope = activeItem ? getLinkScope(activeItem.name) : null;
        if (treeScope) {
            treeIcon = getTabIcon(treeScope);
        } else if (activeItem?.name === '_admin') {
            treeIcon = getSystemIconUrl('gear');
        } else {
            treeIcon = null;
        }
    }
    $: isSelectionEnabled = activeItem && (((!['_self', '_bookmark'].includes(activeItem.name)) && mode === 'list') || (activeItem.name === '_admin'))

    export function handleCollectionSearch(searchedCollection) {
        if (collection && searchedCollection.name === scope) {
            Storage.set('treeWhereData', scope, searchedCollection.where)
            Storage.set('useDataRequest', scope, searchedCollection.length < 50 ? 'yes' : 'no')
        }
        if (!isCollapsed) {
            rebuildTree()
        }
    }

    //region Tree methods
    export function rebuildTree() {
        destroyTree();
        buildTree();
    }

    function destroyTree() {
        let tree = window.$(treeElement);
        if (tree) {
            tree.tree('destroy');
        }
    }

    function getSortFields() {
        if (!treeScope) {
            return []
        }

        const sortScope = treeScope === 'Bookmark' ? scope : treeScope
        const fieldDefs = Metadata.get(['entityDefs', sortScope, 'fields']) ?? {};
        return Object.keys(fieldDefs).filter(function (item) {
            return ['varchar', 'text', 'int', 'float', 'date', 'datetime'].includes(fieldDefs[item].type) && !fieldDefs[item].notStorable;
        }).sort(function (v1, v2) {
            return Language.translate(v1, 'fields', sortScope).localeCompare(Language.translate(v2, 'fields', sortScope));
        }).map(item => {
            return {name: item, label: Language.translate(item, 'fields', sortScope)}
        })

    }

    function getWhereData(): [] {
        let whereData = Storage.get('treeWhereData', scope) || [];
        if (!['_self', '_bookmark'].includes(activeItem.name)) {
            whereData = [];
        }

        return JSON.parse(JSON.stringify(whereData))
    }

    function getForeignWhereData() {
        let whereData = Storage.get('treeWhereData', scope) || [];
        if (['_self', '_bookmark'].includes(activeItem.name)) {
            whereData = [];
        }

        // When a node is selected in the current linked tab — exclude its rule from tree filtering
        // (the node is highlighted but the tree shows all items unfiltered)
        const activeNode = selectedNodes.find(n => n.link === activeItem.name);
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

        return JSON.parse(JSON.stringify(whereData))
    }

    function canUseDataRequest() {
        if (!['_self', '_bookmark'].includes(activeItem.name) || getWhereData().length > 0) {
            return true
        }
        return false
    }

    function getHashScope() {
        let locationHash = window.location.hash;
        return locationHash.split('/').shift().replace('#', '');
    }

    async function toggleSubTree($tree, node) {
        if (node.disabled) {
            return;
        }

        if (!node.subTreeData) {
            Notifier.notify('Loading...')
            const respData = await ApiClient.get<any[]>(generateSubTreeUrl(node))
            node.subTreeData = filterResponse(respData).map(item => ({...item, scope: scope}))
        }

        if (!node.subTreeLoaded) {
            if (node.has_children) {
                $tree.tree('loadData', [...node.subTreeData, ...node.getData()], node);
            } else if (node.getData().length === 0) {
                $tree.tree('loadData', node.subTreeData, node);
            }
            node.subTreeLoaded = true;
            if (!node.is_open) {
                $tree.tree('openNode', node, true, () => {
                    window.$(node.element).find('> .jqtree-element .load-items').removeClass('ph-plus-square').addClass('ph-minus-square');
                });
            } else {
                window.$(node.element).find('> .jqtree-element .load-items').removeClass('ph-plus-square').addClass('ph-minus-square');
            }
        } else {
            node.subTreeLoaded = false;
            if (!node.has_children) {
                $tree.tree('closeNode', node, true)
            } else {
                window.$(node.element).find('> .jqtree-element .load-items').removeClass('ph-minus-square').addClass('ph-plus-square');
                $tree.tree('loadData', getDataWithoutSubTree(node), node);
            }
        }
    }

    function buildTree(data = null): void {
        if (!activeItem) {
            return;
        }

        if (activeItem.name === '_admin') {
            data = getAdminTreeData();
        }
        let $tree = window.$(treeElement);
        let whereData = getWhereData();
        let foreignWhereData = getForeignWhereData();
        let hasTextFilter = !!searchValue;

        if (
            data === null
            && Metadata.get(['scopes', treeScope, 'type']) === 'Hierarchy'
            && (canUseDataRequest() || hasTextFilter)
            && activeItem.name !== '_bookmark'
        ) {
            treeLoading = true;
            if (searchValue) {
                whereData.push({"type": "textFilter", "value": searchValue});
            }
            ApiClient.get(`${treeScope}/action/TreeData`, {
                "where": whereData,
                "foreignWhere": foreignWhereData,
                "scope": scope,
                "link": activeItem.name,
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
            dragAndDrop: Metadata.get(['scopes', treeScope, 'multiParents']) !== true && Metadata.get(['scopes', treeScope, 'dragAndDrop']) && sortBy === 'sortOrder',
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

                /**
                 * Mark search str
                 */
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

                if (model && model.get('id') === node.id && (['_self', '_bookmark', '_lastViewed'].includes(activeItem.name) || node.scope === model.name)) {
                    $tree.tree('addToSelection', node);
                    $li.addClass('jqtree-selected');
                }

                if (!['_self', '_bookmark', '_lastViewed', '_admin'].includes(activeItem.name) && selectedNodes.some(n => n.id === node.id && n.link === activeItem.name)) {
                    $li.addClass('jqtree-selected');
                }

                if (callbacks?.shouldBeSelected && callbacks.shouldBeSelected(activeItem.name, node.id)) {
                    $tree.tree('addToSelection', node);
                    $li.addClass('jqtree-selected');
                }

                if (activeItem.name === '_admin'
                    && ((Metadata.get(['scopes', getHashScope()])
                        && (node.id.includes('#' + getHashScope() + '/'))
                        && isLinkExistsOnce(getHashScope())) || node.id === window.location.hash)) {
                    $tree.tree('addToSelection', node);
                    $li.addClass('jqtree-selected');
                }

                $title.attr('data-id', node.id);

                if (node.showMoreDirection) {
                    $li.addClass('show-more');
                    $li.addClass('show-more-' + node.showMoreDirection);
                    $li.find('.jqtree-title').addClass('more-label');
                } else {
                    $title.attr('title', node.name);

                    if (activeItem.name !== '_admin' && scope !== treeScope && !isNodeInSubTree(node)) {
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
        }

        let dataLoaded = false;

        $tree.on('tree.load_data', e => {
            Notifier.notify(false)
            if (dataLoaded) {
                return
            }

            if (callbacks?.treeLoad) {
                callbacks.treeLoad(treeScope, treeData);
            }
            dataLoaded = true;
        })
        $tree.on('tree.refresh', e => {
            showEmptyPlaceholder = $tree.tree('getTree')?.children?.length === 0

            if (activeItem.name === '_admin') {
                let hashScope = getHashScope();
                if (Metadata.get(['scopes', hashScope])) {
                    selectTreeNode('#' + hashScope, [])
                }
                return;
            }

            if (mode === 'detail' && model && ['_self', '_bookmark', '_lastViewed'].includes(activeItem.name)) {
                selectTreeNode(model.get('id'), (model.get('routesNames')?.[0]?.map(item => item.id) || []).reverse())
            }
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

            ApiClient.patch(`${treeScope}/${moveInfo.moved_node.id}`, data).then(() => {
                moveInfo.do_move();
            });
        })
        $tree.on('tree.click', e => {
            e.preventDefault();

            if (activeItem.name === '_admin' && !e.node.disabled) {
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

                // For linked relationship tabs — add to selectedNodes + notify backbone
                if (!['_self', '_bookmark', '_lastViewed', '_admin'].includes(activeItem.name) && !isNodeInSubTree(node)) {
                    toggleSelectedNode({
                        id: node.id,
                        name: node.name,
                        scope: node.scope || treeScope,
                        link: activeItem.name
                    });

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
                    if (callbacks?.selectNode) {
                        callbacks.selectNode(data);
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

                if (callbacks?.selectNode) {
                    callbacks.selectNode(data);
                }
            }
        });

        $tree.on('tree.open', e => {
            if (!e.node?.element) {
                return;
            }

            const $element = window.$(e.node.element);
            const $el = $element.find('> .jqtree-element .load-items');
            if ($el.length > 0) {
                if (!e.node.has_children) {
                    $el.removeClass('ph-plus-square').addClass('ph-minus-square');
                }
            }
        });

        $tree.on('tree.close', e => {
            if (!e.node?.element) {
                return;
            }
            const node = e.node
            const $element = window.$(node.element);
            const $el = $element.find('> .jqtree-element .load-items');
            if ($el.length > 0) {
                $el.removeClass('ph-minus-square').addClass('ph-plus-square');
                if (node.subTreeData && node.subTreeLoaded && node.has_children) {
                    node.subTreeLoaded = false;
                    $tree.tree('loadData', getDataWithoutSubTree(node), node);
                }
            }
        });

        $tree.tree(treeData);
    }

    function getDataWithoutSubTree(node) {
        return node.getData().filter(item => !node.subTreeData.find(i => i.id === item.id))
    }

    function parseRoute(routeStr) {
        let route = [];
        (routeStr || '').split('|').forEach(item => {
            if (item) {
                route.push(item);
            }
        });

        return route;
    }

    function loadMore(node) {
        Notifier.notify('Loading...')
        ApiClient.get<Record<string, any>>(generateUrl(node)).then(response => {
            if (response['list']) {
                const $tree = window.$(treeElement);
                const parentNode = node.getParent();
                if (node.showMoreDirection === 'up') {
                    // prepend
                    filterResponse(JSON.parse(JSON.stringify(response)), 'up').reverse().forEach(item => {
                        prependNode($tree, item, parentNode);
                    });
                } else if (node.showMoreDirection === 'down') {
                    // append
                    filterResponse(JSON.parse(JSON.stringify(response)), 'down').forEach(item => {
                        appendNode($tree, item, parentNode);
                    });
                }
                $tree.tree('removeNode', node);
                if (parentNode) {
                    // Fix caret loader
                    const $el = window.$(parentNode.element).find('.load-items');
                    if ($el.length > 0) {
                        $el.removeClass('ph-plus-square').addClass('ph-minus-square');
                    }
                }
            }
        });
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

    function generateUrl(node) {
        if (isNodeInSubTree(node) && !['_bookmark', '_lastViewed'].includes(activeItem.name)) {
            return generateSubTreeUrl(node)
        }

        let treeScope = activeItem ? getLinkScope(activeItem.name) : null
        let url = treeScope + `/action/Tree?isTreePanel=1&scope=${scope}&link=${activeItem.name}`;
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

        if (['_self', '_bookmark'].includes(activeItem.name)) {
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
        let url = scope + `/action/Tree?isTreePanel=1&scope=${scope}&link=_self`;
        if (Metadata.get(['scopes', scope, 'type']) === 'Hierarchy') {
            url = `${scope}/action/TreeData?scope=${scope}&link=_self`
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
            id: activeItem.name,
            field: activeItem.name,
            value: [getSubTreeRootId(node)]
        })
        url += "&";
        url += window.$.param({"where": foreignWhere});

        return url;
    }

    export function selectTreeNode(id, ids) {
        const $tree = window.$(treeElement);
        const onFinished = () => {
            let node = $tree.tree('getNodeById', id);
            if (node) {
                $tree.tree('addToSelection', node);
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

    function refreshTreeSelection(): void {
        if (!treeElement || !activeItem || ['_self', '_bookmark', '_lastViewed', '_admin'].includes(activeItem.name)) return;

        const $tree = window.$(treeElement);
        $tree.find('li.jqtree_common').each((_, el) => {
            const $li = window.$(el);
            const nodeId = $li.find('> .jqtree-element .jqtree-title').data('id') + '';
            const isSelected = selectedNodes.some(n => n.id === nodeId && n.link === activeItem.name);
            $li.toggleClass('jqtree-selected', isSelected);
        });
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

    function getDisabledNodesFromFilter() {
        const res = []

        let field = activeItem.name
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

    export function unSelectTreeNode(id) {
        const $tree = getTreeEl();
        const node = $tree.tree('getNodeById', id);

        if (node) {
            $tree.tree('removeFromSelection', node);
        }
    }

    export function getTreeEl() {
        return window.$(treeElement)
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

    function isNodeInSubTree(node) {
        if (!node || !node.id) {
            return false;
        }
        return node.scope && node.scope !== treeScope
    }

    function getSubTreeRootId(node) {
        if (!node || !node.id) {
            return null;
        }
        if (!node.scope || node.scope === treeScope) {
            return node.id
        }

        while (node.parent) {
            node = node.parent;
            if (!node.scope || node.scope === treeScope) {
                return node.id
            }
        }

        return null
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

    //endregion Tree methods

    function getLinkScope(link: string): string | null {
        if (link === '_self') {
            return scope
        }
        if (link === '_bookmark') {
            return 'Bookmark'
        }

        if (link === '_lastViewed') {
            return 'LastViewed';
        }

        return Metadata.get(['entityDefs', scope, 'links', link, 'entity']) ||
            Metadata.get(['entityDefs', scope, 'fields', link, 'entity'])
    }

    function setActiveItem(treeItem) {
        if (activeItem && activeItem.name === treeItem.name) {
            return
        }

        activeItem = treeItem
        Storage.set('treeItem', scope, treeItem.name)


        tick().then(() => {
            if (treeItem.name === '_items') {
                if (callbacks?.onActiveItems) {
                    callbacks?.onActiveItems(selectionItemElement);
                }
                return;
            }
            Notifier.notify('Loading...')
            searchValue = ''
            searchInputElement.value = ''
            Storage.clear('treeSearchValue', treeScope)
            Storage.clear('treeSearchValue', '_admin')

            initSorting(false)
            rebuildTree()
        })
    }

    function treeReset() {
        searchInputElement.value = ''
        if (mode === 'detail') {
            Storage.clear('treeWhereData', scope)
        }
        applySearch()
    }

    function applySearch() {
        searchValue = searchInputElement.value
        if (searchValue && activeItem.name === '_admin') {
            Storage.set('treeSearchValue', '_admin', searchValue)
        } else if (searchValue) {
            Storage.set('treeSearchValue', scope, searchValue)
        } else {
            Storage.clear('treeSearchValue', scope)
            Storage.clear('treeSearchValue', '_admin')
        }
        Notifier.notify('Loading...')
        rebuildTree()
    }

    export function reloadBookmarks() {
        if (treeScope === 'Bookmark') {
            rebuildTree()
        }
    }

    export function getLayoutData() {
        return layoutData;
    }

    function setSortBy(field: string): void {
        sortBy = field;
        Storage.set('treeItemSorting', scope, {sortBy, sortAsc});
        rebuildTree();
    }

    function onSortAscChange(event) {
        event.preventDefault();
        sortAsc = !sortAsc;
        Storage.set('treeItemSorting', scope, {sortBy, sortAsc})
        rebuildTree()
    }

    function isLinkExistsOnce(scope: string) {
        let count = 0;
        for (const treeItem of getAdminTreeData()) {
            for (const child of treeItem.children) {
                if (child.id.includes('#' + scope)) {
                    count += 1;
                }
            }
        }

        return count == 1;
    }

    function getAdminTreeData() {
        let data = Metadata.get(['app', 'adminPanel']);
        let total = Object.keys(data).length;
        let result: any[] = [];
        let i = 0;
        Object.entries(data).forEach(([k, v]) => {
            let treeItem = {
                id: k,
                name: Language.get('Admin', 'labels', v['label']) ?? v['label'],
                offset: i,
                total: total,
                disabled: true,
                load_on_demand: false,
                children: []
            }
            let j = 0;
            let totalItem = v['itemList'].length;
            for (const item of v['itemList']) {
                if (item.listDisabled) {
                    continue;
                }
                const label = Language.translate(item['label'], 'labels', 'Admin');
                if ((searchValue ?? '').length < 3 || (label.toLowerCase().includes(searchValue.toLowerCase()))) {
                    treeItem.children.push({
                        id: item['url'],
                        name: label,
                        offset: j,
                        total: totalItem,
                        disabled: false,
                        load_on_demand: false,
                    });
                    j++;
                }

            }
            if (treeItem.children.length === 0) {
                return;
            }
            result.push(treeItem);
            i++;
        });

        return result;
    }

    function loadLayout(callback) {
        if (isAdminPage) {
            activeItem = {
                name: '_admin',
                label: Language.get('Global', 'labels', 'Administration')
            }
            treeItems = [activeItem];
            callback()
        } else {
            LayoutManager.get(scope, 'navigation', null, null, (data: any) => {
                layoutData = data
                treeItems = data.layout.map((item: any) => {
                    let label: string = ''
                    if (item.name === '_self') {
                        label = Language.get('Global', 'scopeNamesPlural', scope) as string
                    } else if (item.name === '_bookmark') {
                        label = Language.get('Global', 'scopeNamesPlural', 'Bookmark') as string
                    } else if (item.name === '_lastViewed') {
                        label = Language.get('Global', 'scopeNamesPlural', 'LastViewed') as string
                    } else if (item.name === '_admin') {
                        label = Language.get('Global', 'labels', 'Administration') as string
                    } else if (item.name === '_items') {
                        label = Language.get('Global', 'labels', 'Items') as string
                    } else {
                        const itemScope = getLinkScope(item.name)

                        if (itemScope) {
                            if (!Acl.check(itemScope, 'read')) {
                                return null;
                            }

                            if (Metadata.get(['entityDefs', scope, 'fields', item.name, 'type']) == 'link') {
                                label = Language.get('Global', 'scopeNamesPlural', itemScope) as string
                            }
                        }

                        if (!label) {
                            label = (Language.get(scope, 'links', item.name) || Language.get(scope, 'fields', item.name) || Language.get('Global', 'fields', item.name)) as string
                        }
                    }

                    return {
                        name: item.name,
                        label: label
                    };
                }).filter((item: any) => item !== null);

                const clonedItems = JSON.parse(JSON.stringify(treeItems));
                // change labels for duplicates
                clonedItems.forEach((item, index) => {
                    if (clonedItems.filter(value => value.label === item.label).length > 1) {
                        treeItems[index].label = item.label + ' (' + item.name + ')';
                    }
                })

                if (!hasItems) {
                    treeItems = treeItems.filter(item => item.name !== '_items');
                }
                let treeItem = Storage.get('treeItem', scope);

                // admin should always be the selected one
                if (isAdminPage) {
                    treeItem = '_admin';
                }
                if (treeItems.length > 0) {
                    if (!treeItem || !treeItems.find(ti => ti.name === treeItem)) {
                        Storage.set('treeItem', scope, treeItems[0].name);
                        activeItem = treeItems[0];
                    } else {
                        activeItem = treeItems.find(ti => ti.name === treeItem);
                    }
                    initSorting(true);
                }

                callback();
            })
        }
    }

    function initSorting(useCache) {
        treeScope = getLinkScope(activeItem.name)
        if (treeScope === 'Bookmark') {
            treeScope = scope
        }

        if (useCache) {
            if (activeItem.name === Storage.get('treeItem', scope)) {
                const data = Storage.get('treeItemSorting', scope)
                // check if data is valid and field still exist
                if (data && typeof data === 'object' && !!Metadata.get(['entityDefs', treeScope, 'fields', data.sortBy])) {
                    sortAsc = data.sortAsc
                    sortBy = data.sortBy
                    return
                }
            }
        }

        if (Metadata.get(['scopes', treeScope, 'type']) === 'Hierarchy' && activeItem.name !== '_bookmark') {
            sortBy = 'sortOrder'
        } else {
            sortBy = Metadata.get(['entityDefs', treeScope, 'collection', 'sortBy']);
            for (let field in ['name', 'code']) {
                if (!!Metadata.get(['entityDefs', treeScope, 'fields', field])) {
                    sortBy = field
                    break
                }
            }
        }

        if (!sortBy || !Metadata.get(['entityDefs', treeScope, 'fields', sortBy])) {
            sortBy = getSortFields()[0]?.name
        }

        sortAsc = !!Metadata.get(['entityDefs', treeScope, 'collection', 'asc'])
        Storage.set('treeItemSorting', scope, {sortBy, sortAsc})
    }

    export function refreshLayout() {
        loadLayout(() => {
            tick().then(() => {
                rebuildTree()
            })
        })
    }

    onMount(() => {
        mounted = true;

        const storedNodes = loadNodes(scope, getLinkScope);
        if (storedNodes.length > 0) {
            setSelectedNodes(storedNodes);
        }

        const savedWidth = Storage.get('panelWidth', scope);
        if (savedWidth) {
            currentWidth = parseInt(savedWidth) || minWidth;
        }

        if (window.innerWidth <= 767 || Storage.get('catalog-tree-panel', scope)) {
            isCollapsed = true;
        }

        isPinned = Storage.get('catalog-tree-panel-pin', scope) !== 'not-pinned';

        if (collection) {
            Storage.set('treeWhereData', scope, collection.where)
        }

        loadLayout(() => {
            if (treeItems.length === 0) {
                isCollapsed = true
                if (!UserData.get()?.user?.isAdmin) {
                    // hide panel if user cannot configure
                    isHidden = true
                }
            }
            tick().then(() => {

                if (activeItem?.name === '_admin') {
                    searchValue = Storage.get('treeSearchValue', '_admin') || null;
                } else {
                    searchValue = Storage.get('treeSearchValue', scope) || null;
                }
                if (searchValue) {
                    searchInputElement.value = searchValue;
                }

                if (activeItem.name === '_items' && callbacks?.onActiveItems) {
                    callbacks?.onActiveItems(selectionItemElement);
                } else if (!isCollapsed) {
                    buildTree();
                }

                if (renderLayoutEditor) {
                    renderLayoutEditor(layoutEditorElement);
                }
            })
        });

        if (callbacks?.afterMounted) {
            callbacks.afterMounted();
        }

        return () => {};
    });

    function onSidebarResize(e: CustomEvent): void {
        Storage.set('panelWidth', scope, currentWidth.toString());

        if (callbacks?.treeWidthChanged) {
            callbacks.treeWidthChanged(currentWidth);
        }
    }

    function onSidebarCollapse(e: CustomEvent): void {
        Storage.set('catalog-tree-panel', scope, isCollapsed ? 'collapsed' : '');

        if (!isCollapsed) {
            rebuildTree();
        }
    }

    function onSidebarPin(e: CustomEvent): void {
        Storage.set('catalog-tree-panel-pin', scope, isPinned ? 'pin' : 'not-pinned');
    }


</script>

<CollapsibleSidebar className="catalog-tree-panel" position="left" bind:width={currentWidth} bind:isCollapsed={isCollapsed}
             bind:isPinned={isPinned} {minWidth} {maxWidth} on:sidebar-resize={onSidebarResize}
             on:sidebar-collapse={onSidebarCollapse} on:sidebar-pin={onSidebarPin}>
    <div class="category-panel" class:hidden={isCollapsed}>
        {#if layoutLoading}
            <div class="text-center">
                <Preloader heightPx={12}/>
            </div>
        {:else if treeItems.length > 0 }
            <div class="panel-group" style="padding-bottom: 10px;min-height: 26px;margin-bottom: 0;margin-left: -8px;">
                <div class="tree-items-container">
                    {#each treeItems as treeItem}
                        <a href="javascript:" on:click={()=>setActiveItem(treeItem)}
                           class="tree-item" class:hidden={treeItem.name === '_items' && !showItems}
                           data-name="{treeItem.name}" class:active={treeItem.name===activeItem.name}>
                            {treeItem.label}
                        </a>
                    {/each}
                    <span bind:this={layoutEditorElement} class="layout-editor-container"></span>
                </div>
            </div>
            {#if activeItem}
                <div class="sidebar-header">
                    <h5>
                        {#if treeIcon}<img src={treeIcon} alt="" class="tree-scope-icon">{/if}{activeItem.label}</h5>
                </div>

                {#if activeItem.name === '_items'}
                    <div class="selection-items" bind:this={selectionItemElement}></div>
                {:else}
                    <div class="panel-group category-search" style="margin-bottom: 20px"
                         class:hidden={['_lastViewed'].includes(activeItem.name)}>
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
                            {#if showApplySortOrder && activeItem.name !== '_admin' }
                                <div class="sort-container">
                                    <div class="button-group">
                                        <button type="button" class="sort-dir-button"
                                                title={Language.translateOption(sortAsc?'asc':'desc','sortDirection','Entity')}
                                                on:click={onSortAscChange}>
                                            <i class={'ph '+(sortAsc ? 'ph-sort-descending':'ph-sort-ascending')}></i>
                                        </button>
                                        <button type="button" class="sort-by-button"
                                                data-toggle="dropdown">{Language.translate(sortBy, 'fields', treeScope)}</button>
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

                    <div class={"panel-group category-tree tree-"+ activeItem?.name} style="margin-left: -6px;"
                         bind:this={treeElement}>
                    </div>

                    {#if showEmptyPlaceholder}
                        <div class="no-data-container"><p>{Language.translate('No Data')}</p></div>
                    {/if}

                {/if}
            {/if}
        {/if}
    </div>
    {#if mode === 'list'}
        <SelectedNodesBadges nodes={selectedNodes} onRemove={removeSelectedNode} onUnsetAll={() => setSelectedNodes([])} />
    {/if}
</CollapsibleSidebar>

<style>
    :global(.catalog-tree-panel .sidebar-inner) {
        display: flex;
        flex-direction: column;
    }

    .category-panel {
        flex: 1;
    }

    .field[data-name="category-search"] {
        position: relative;
    }

    .field[data-name="category-search"] > input.category-search {
        background-color: #fff;
        padding: 8px 36px 8px 12px;
        border-radius: 5px;
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

    .field[data-name="category-search"] > input.category-search {
        border-bottom: 1px solid #e8eced;
    }

    .tree-items-container {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
    }

    .tree-item {
        padding: 4px 8px;
        color: #333;
        border-radius: 16px;
        text-decoration: none;
        line-height: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        border: 1px solid transparent;
    }

    .tree-item.active {
        color: #06c;
    }

    .tree-item.active,
    .tree-item:hover:not(.active) {
        border-color: #06c;
    }

    .layout-editor-container:empty {
        display: none;
    }

    .layout-editor-container:not(:empty) {
        padding: 4px 0;
        line-height: 0;
    }

    .tree-scope-icon {
        width: 22px;
        height: 22px;
        margin-inline-end: .5em;
        filter: brightness(0);
        user-select: none;
    }

    .layout-editor-container:not(:empty):active {
        box-shadow: none;
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

    :global(.tree-_admin ul.jqtree-tree .jqtree_common.disabled > div > span) {
        color: #000;
        font-weight: bold;
    }

    .category-panel .icons-wrapper .toggle {
        cursor: pointer;
        margin-right: 3px;
        vertical-align: middle;
    }

    .category-panel .icons-wrapper .toggle.active {
        color: #06c;
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
</style>