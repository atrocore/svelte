<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { Storage } from "$lib/core/storage";
    import { onDestroy, onMount } from "svelte";
    import { Language } from "$lib/core/language"
    import type Item from './types/sidebar-item'
    import CollapsibleSidebar from "$lib/components/collapsers/ResizableCollapser/ResizableCollapser.svelte";
    import QueryBuilder from "$lib/components/searches/QueryBuilder/QueryBuilder.svelte";
    import DataQualityPanel from "$lib/components/EntityContextPanel/DataQualityPanel/DataQualityPanel.svelte";
    import ClusterPanel from "$lib/components/EntityContextPanel/ClusterPanel/ClusterPanel.svelte";
    import VersionPanel from "$lib/components/EntityContextPanel/VersionPanel/VersionPanel.svelte";

    export let scope: string;
    export let mode: string;
    export let id: string;
    export let minWidth: number = 300;
    export let maxWidth: number = 600;
    export let currentWidth: number = minWidth;
    export let loadInsights: () => void;
    export let loadActivities: (callback: (view: any) => void) => void;
    export let fetchModel: () => void;
    export let isCollapsed: boolean = false;
    export let hasStream: boolean = false;
    export let searchManager: any;
    export let createView: (name: string, view: string, options: Record<string, any>, callback: (view: any) => void) => void;
    export let showFilter: boolean = false;
    export let showInsights: boolean = false;
    export let showDataQualities: boolean = false;
    export let showCluster: boolean = false;
    export let clusterId: string = '';
    export let loadClusterDetail: ((element: HTMLElement, attributes: Record<string, any>) => void) | null = null;
    export let showVersions: boolean = false;
    export let useStorage: boolean = true;
    export let uniqueKey: string | null = 'default';

    $: scopeKey = scope + mode;

    function toggleFilter(e: CustomEvent) {
        if (e.detail.uniqueKey !== uniqueKey) {
            return;
        }

        const oldActiveItem = activeItem;
        setActiveItem(items.find(item => item.name === 'filter'));

        if (oldActiveItem.name === 'filter') {
            isCollapsed = !isCollapsed;
        } else if (isCollapsed) {
            isCollapsed = false;
        } else {
            return;
        }

        storeData('right-side-view-collapse', scope + 'list', isCollapsed ? 'collapsed' : 'expanded');
    }

    window.addEventListener('right-side-view:toggle-filter', toggleFilter as EventListener);
    window.addEventListener('record:save', refreshStream as EventListener);

    let isPin = true;
    let streamView: any;
    let items: Item[] = [];
    let activeItem: Item;
    if (showInsights) {
        items.push({
            name: "insights",
            label: Language.translate('Insights'),
            iconClass: 'ph ph-lightbulb'
        });

        activeItem = items[0];
    }

    function setActiveItem(item: any) {
        if (!item) {
            return;
        }

        if (activeItem && activeItem.name === item.name) {
            return
        }

        activeItem = item;

        if (activeItem.name === 'activities') {
            refreshActivities()
        }

        storeData('right-side-view-active-item', scopeKey, activeItem.name);

    }

    function refreshActivities() {

        if (isCollapsed) {
            return;
        }

        if (streamView == null) {
            loadActivities((view) => {
                streamView = view;
            });
        } else {
            refreshStream();
        }
    }

    function refreshStream() {
        streamView?.refresh();
    }

    function onSidebarResize(e: CustomEvent): void {
        storeData('rightSideView', scopeKey, currentWidth.toString());
    }

    function onSidebarPin(e: CustomEvent): void {
        storeData('right-side-view-pin', scopeKey, isPin ? 'pin' : 'not-pinned');
    }

    function onSidebarCollapse(e: CustomEvent): void {
        storeData('right-side-view-collapse', scopeKey, isCollapsed ? 'collapsed' : 'expanded');
        if (activeItem.name === 'activities') {
            refreshActivities();
        }
    }

    function getStoredData(key: string, name: string): any {
        if (!useStorage) {
            return null;
        }
        return Storage.get(key, name);
    }

    function storeData(key: string, name: string, value: any): void {
        if (!useStorage) {
            return;
        }
        Storage.set(key, name, value);
    }

    onMount(() => {
        const savedWidth = getStoredData('rightSideView', scopeKey);
        if (savedWidth) {
            currentWidth = parseInt(savedWidth) || minWidth;
        }

        let collapseState = getStoredData('right-side-view-collapse', scopeKey);

        if (collapseState) {
            isCollapsed = collapseState === 'collapsed';
        } else if (window.innerWidth <= 768) {
            isCollapsed = true;
        }

        isPin = getStoredData('right-side-view-pin', scopeKey) !== 'not-pinned';

        if (showInsights) {
            loadInsights();
        }

        if (showFilter) {
            items = [
                ...items,
                {
                    name: "filter",
                    label: Language.translate('filter'),
                    iconClass: 'ph ph-funnel'
                }
            ];
        }

        if (hasStream) {
            items = [
                ...items,
                {
                    "name": "activities",
                    "label": Language.translate('Activities'),
                    iconClass: 'ph ph-pulse'
                }
            ];
        }

        if (showDataQualities) {
            items = [
                ...items,
                {
                    "name": "data-qualities",
                    "label": Language.translate('QualityCheck', 'scopeNames'),
                    iconClass: 'ph ph-shield-check'
                }
            ];
        }

        if (showCluster) {
            items = [
                ...items,
                {
                    "name": "cluster",
                    "label": Language.translate('Cluster', 'scopeNames'),
                    iconClass: 'ph ph-tree-structure'
                }
            ];
        }

        if (showVersions) {
            items = [
                ...items,
                {
                    "name": "versions",
                    "label": Language.translate('versions', 'labels'),
                    iconClass: 'ph ph-clock-counter-clockwise'
                }
            ];
        }

        let itemName = getStoredData('right-side-view-active-item', scopeKey);

        if (itemName && items.map(i => i.name).includes(itemName)) {
            setActiveItem(items.find(i => i.name === itemName));
        }

        if (!activeItem) {
            setActiveItem(items[0]);
        }

        return () => {
            window.removeEventListener('right-side-view:toggle-filter', toggleFilter as EventListener)
        }
    });

    function updateItemTitle(name: string, title: string): void {
        items = items.map(i => i.name === name ? { ...i, title } : i);
        if (activeItem?.name === name) {
            activeItem = { ...activeItem, title };
        }
    }

    onDestroy(() => {
        window.removeEventListener('record:save', refreshStream as EventListener)
    });
</script>

<CollapsibleSidebar position="right" className="right-side-view" bind:isCollapsed={isCollapsed} bind:isPinned={isPin}
             bind:width={currentWidth} {minWidth} {maxWidth} on:sidebar-resize={onSidebarResize}
             on:sidebar-collapse={onSidebarCollapse} on:sidebar-pin={onSidebarPin}>
    <div class="content">
        <div class="sidebar-items-container">
            {#each items as item}
                <a href="javascript:" on:click={()=>setActiveItem(item)}
                   class="sidebar-item item"
                   class:active={item.name===activeItem.name}
                >
                    {item.label}
                </a>
            {/each}
        </div>

        <div class="sidebar-header">
            <h5>
                {#if activeItem?.iconClass}<i class={activeItem?.iconClass}
                                              style="margin-inline-end: 10px; font-size: 20px;"></i>{/if}{@html activeItem?.title ?? activeItem?.label ?? ''}</h5>
            <div class="layout-editor-container" class:hidden={activeItem?.name !== 'insights'}></div>
        </div>

        {#if showFilter}
            <div class="filter" class:hidden={activeItem?.name !== 'filter'}>
                <QueryBuilder scope={scope} searchManager={searchManager} createView={createView}
                              uniqueKey={uniqueKey}></QueryBuilder>
            </div>
        {/if}

        <div class="insights" class:hidden={activeItem?.name !== 'insights'}>
            <img class="preloader" src="client/img/atro-loader.svg" alt="loader">
        </div>

        <div class="activities" class:hidden={activeItem?.name !== 'activities'}>
            <img class="preloader" src="client/img/atro-loader.svg" alt="loader">
        </div>

        {#if showDataQualities}
            <div class="data-qualities" class:hidden={activeItem?.name !== 'data-qualities'}>
                <DataQualityPanel {scope} {id} {fetchModel}
                                  on:show={() => setActiveItem(items.find(i => i.name === 'data-qualities'))}
                />
            </div>
        {/if}

        {#if showCluster}
            <div class="cluster" class:hidden={activeItem?.name !== 'cluster'}>
                <ClusterPanel {clusterId} {loadClusterDetail} on:title-change={(e) => updateItemTitle('cluster', e.detail)} />
            </div>
        {/if}

        {#if showVersions}
            <div class="versions" class:hidden={activeItem?.name !== 'versions'}>
                <VersionPanel {scope} entityId="{id}" />
            </div>
        {/if}
    </div>
</CollapsibleSidebar>

<style>
    .sidebar-header :global(a) {
        color: inherit;
        text-decoration: none;
    }

    .sidebar-header :global(a:hover) {
        color: inherit;
        text-decoration: underline;
    }

    .sidebar-items-container {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        margin-left: -5px;
        padding-bottom: 10px;
    }

    .sidebar-item {
        padding: 4px 8px;
        color: #333;
        text-decoration: none;
        line-height: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        border-bottom: 2px solid transparent;
        transition: border-color 0.15s ease, color 0.15s ease;
    }

    .sidebar-item.active {
        color: #06c;
        border-bottom-color: #06c;
    }

    .sidebar-item:hover:not(.active) {
        border-bottom-color: rgba(0, 102, 204, 0.35);
    }

    .preloader {
        height: 12px;
        margin-top: 5px;
    }

    :global(.right-side-view .panel-heading .panel-title .panel-title-text) {
        flex-direction: row-reverse;
    }

    :global(.right-side-view .panel-heading .panel-title .collapser) {
        margin-inline-start: 8px;
        margin-inline-end: -2px;
        transform: scaleX(-1);
        font-size: 11px;
    }

    :global(.dropdown-menu.textcomplete-dropdown) {
        z-index: 1300 !important;
    }

    .activities :global(.panel-stream .panel-title),
    .activities :global(.panel-stream .panel-heading .btn-group) {
        display: none;
    }

    .activities :global(.stream-details-container .panel) {
        background-color: transparent;
    }

    :global(.right-side-view .field .attachment-preview) {
        display: block;
    }

    :global(.right-side-view .field .attachment-preview img) {
        display: block;
        margin: 0 auto;
    }

    :global(.right-side-view .layout-editor-container .dropdown-menu.pull-right) {
        right: auto;
    }

    .activities :global( .dropdown-menu.pull-right) {
        right: 0;
    }

    .activities :global(.panel-default > .panel-heading),
    .cluster :global(.panel-default > .panel-heading),
    .insights :global(.panel-default > .panel-heading) {
        background-color: transparent;
        border-bottom: transparent;
        display: flex;
        flex-direction: row-reverse;
        padding-right: 0;
        height: auto !important;
    }

    .activities :global(.panel-title),
    .cluster :global(.panel-title),
    .insights :global(.panel-title) {
        text-transform: none;
        font-size: 10px !important;
        color: #999;
    }

    :global(.right-side-view .panel-heading > .btn-group) {
        right: 0;
    }

    .activities :global(.panel-default),
    .cluster :global(.panel-default),
    .insights :global(.panel-default) {
        background-color: inherit;
    }

    .cluster :global(.panel-default),
    .insights :global(.panel-default) {
        margin-bottom: 10px;
    }

    .insights :global(.panel-summary .panel-default),
    .insights :global(.panel-accessManagement .panel-default) {
        margin-bottom: 0;
    }

    .insights :global(.panel-summary .panel-default:first-child > .panel-heading),
    .insights :global(.panel-accessManagement .panel-default:first-child > .panel-heading) {
        display: none;
    }

    .activities :global(.panel-body),
    .cluster :global(.panel-body),
    .insights :global(.panel-body) {
        padding-top: 0;
        padding-left: 0;
        padding-right: 0;
    }

    .activities :global(.panel-body > div > .list),
    .insights :global(.panel-body > div > .list) {
        background-color: transparent;
        margin-left: 0;
        margin-right: 0;
        overflow-x: visible;
    }

    .activities :global(.panel-body .list-group-item) {
        background-color: transparent;
        padding-left: 0;
        padding-right: 0;
    }

    .activities :global(.panel-body > div > .list > .list-group),
    .insights :global(.panel-body > div > .list > .list-group) {
        padding-left: 5px;
        padding-right: 5px;
        background: transparent;
    }

    .activities :global(.panel-heading) {
        display: none !important;
    }

    .activities :global(table.table),
    .insights :global(table.table) {
        background-color: transparent;
    }

    :global(.right-side-view .panel-body > div > .list > table td:first-child),
    :global(.right-side-view .panel-body > div > .list > table th:first-child),
    :global(.right-side-view .panel-body > div > .group > .list-container > .list > table td:first-child),
    :global(.right-side-view .panel-body > div > .group > .list-container > .list > table th:first-child) {
        padding-left: 0 !important;
    }

    :global(.right-side-view .panel .list > table.table.full-table td.cell[data-name="buttons"]:not(.fixed-button)) {
        padding-right: 0;
    }

    :global(.right-side-view .list > table td.cell[data-name="buttons"] > .list-row-buttons > .dropdown-toggle) {
        background-color: transparent;
    }

    .filter {
        margin-top: -5px;
    }
</style>
