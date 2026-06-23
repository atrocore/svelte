<!--
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 -->

<script lang="ts">
    import { onMount } from "svelte";
    import type ClusterItem from "./types/cluster-item";
    import { Language } from "$lib/core/language";

    export let records: ClusterItem[] = [];
    export let selectedIds: string[] = [];
    export let selectionViewMode: string = 'standard';

    export let onItemClicked: (e: MouseEvent, id: string) => void = () => {};
    export let onSelectAll: (entityType: string) => void = () => {};
    export let onUnSelectAll: (entityType: string) => void = () => {};
    export let onMountRowActions: (element: HTMLElement, itemId: string, relationName: string) => void = () => {};
    export let onLoadMoreForType: (entityType: string) => void = () => {};
    export let hasMoreByType: Record<string, boolean> = {};
    export let loadingMoreByType: Record<string, boolean> = {};

    let collapsed: Record<string, boolean> = {};
    let hoveredCircleId: string | null = null;

    $: selectedIdSet = new Set(selectedIds);
    $: subGroups = {
        unconfirmed: records.filter(i => !i.confirm && !i.rejected),
        confirmed: records.filter(i => i.confirm === true),
        rejected: records.filter(i => i.rejected === true)
    };
    $: hasMoreEntries = Object.entries(hasMoreByType).filter(([, v]) => v);

    export function setRecords(value: ClusterItem[]): void {
        records = value;
    }

    export function setSelectedIds(ids: string[]): void {
        selectedIds = ids;
    }

    export function setSelectionViewMode(value: string): void {
        selectionViewMode = value;
    }

    export function setHasMoreByType(value: Record<string, boolean>): void {
        hasMoreByType = value;
    }

    export function setLoadingMoreByType(value: Record<string, boolean>): void {
        loadingMoreByType = value;
    }

    function toggleCollapsed(key: string): void {
        collapsed[key] = !collapsed[key];
        collapsed = { ...collapsed };
    }

    function mountRowActions(element: HTMLElement, params: { itemId: string; relationName: string }) {
        onMountRowActions(element, params.itemId, params.relationName);
        return {};
    }

    onMount(() => {
        setRecords(records);
    });
</script>

<div class="records">
    {#if subGroups.unconfirmed.length > 0 || hasMoreEntries.length > 0}
        <div class="sub-group-header">
            <span class="label-badge"
                  on:click={() => toggleCollapsed('unconfirmed')}
                  on:keydown={(e) => e.key === 'Enter' && toggleCollapsed('unconfirmed')}
                  role="button"
                  tabindex="0">
                <i class="ph" class:ph-caret-down={!collapsed['unconfirmed']} class:ph-caret-right={collapsed['unconfirmed']}></i>
                {Language.translate('unconfirmed', 'labels', 'Cluster')}
            </span>
        </div>
        {#if !collapsed['unconfirmed']}
            <ul>
                {#each subGroups.unconfirmed as record (record.id)}
                    <li title="{record.name}">
                        <div class="item-row">
                            <a href="#{record.entityType}/view/{record.id}" target="_blank"
                               on:click={(e) => onItemClicked(e, record.id)}
                               on:mouseenter={() => hoveredCircleId = record.id}
                               on:mouseleave={() => hoveredCircleId = null}
                               class:active="{selectionViewMode !== 'standard' && selectedIdSet.has(record.id)}">
                                <i class="ph type-icon" class:ph-crown={record.isMaster} class:ph-signpost={!record.isMaster}></i>
                                <span>{record.name}{#if record.confirmedAutomatically}<i class="ph ph-spark auto-icon"></i>{/if}</span>
                                <i class="ph-circle" class:ph={hoveredCircleId !== record.id} class:ph-fill={hoveredCircleId === record.id}></i>
                            </a>
                            <span use:mountRowActions={{ itemId: record.id, relationName: 'clusterItems' }}></span>
                        </div>
                    </li>
                {/each}
            </ul>
            {#each hasMoreEntries as [entityType]}
                <div class="load-more-container">
                    <button class="btn btn-sm btn-default load-more-btn" on:click={() => onLoadMoreForType(entityType)} disabled={loadingMoreByType[entityType]}>
                        {#if loadingMoreByType[entityType]}
                            <img style="width:14px;vertical-align:middle" class="preloader" src="client/img/atro-loader.svg" alt="loader">
                        {:else}
                            {Language.translate("Show more")}
                        {/if}
                    </button>
                </div>
            {/each}
        {/if}
    {/if}

    {#if subGroups.confirmed.length > 0}
        <div class="sub-group-header">
            <span class="label-badge"
                  on:click={() => toggleCollapsed('confirmed')}
                  on:keydown={(e) => e.key === 'Enter' && toggleCollapsed('confirmed')}
                  role="button"
                  tabindex="0">
                <i class="ph" class:ph-caret-down={!collapsed['confirmed']} class:ph-caret-right={collapsed['confirmed']}></i>
                {Language.translate('confirmed', 'labels', 'Cluster')}
            </span>
        </div>
        {#if !collapsed['confirmed']}
            <ul>
                {#each subGroups.confirmed as record (record.id)}
                    <li title="{record.name}">
                        <div class="item-row">
                            <a href="#{record.entityType}/view/{record.id}" target="_blank"
                               on:click={(e) => onItemClicked(e, record.id)}
                               on:mouseenter={() => hoveredCircleId = record.id}
                               on:mouseleave={() => hoveredCircleId = null}
                               class:active="{selectionViewMode !== 'standard' && selectedIdSet.has(record.id)}">
                                <i class="ph type-icon" class:ph-crown={record.isMaster} class:ph-signpost={!record.isMaster}></i>
                                <span>{record.name}{#if record.confirmedAutomatically}<i class="ph ph-spark auto-icon"></i>{/if}</span>
                                <i class="ph-circle" class:ph={hoveredCircleId !== record.id} class:ph-fill={hoveredCircleId === record.id}></i>
                            </a>
                            <span use:mountRowActions={{ itemId: record.id, relationName: 'clusterItems' }}></span>
                        </div>
                    </li>
                {/each}
            </ul>
        {/if}
    {/if}

    {#if subGroups.rejected.length > 0}
        <div class="sub-group-header">
            <span class="label-badge"
                  on:click={() => toggleCollapsed('rejected')}
                  on:keydown={(e) => e.key === 'Enter' && toggleCollapsed('rejected')}
                  role="button"
                  tabindex="0">
                <i class="ph" class:ph-caret-down={!collapsed['rejected']} class:ph-caret-right={collapsed['rejected']} style="font-size: 12px;margin-left: -2px;"></i>
                {Language.translate('rejected', 'labels', 'Cluster')}
            </span>
        </div>
        {#if !collapsed['rejected']}
            <ul>
                {#each subGroups.rejected as record (record.id)}
                    <li title="{record.name}">
                        <div class="item-row">
                            <a href="#{record.entityType}/view/{record.id}" target="_blank" class="rejected-item"
                               on:click|preventDefault
                               on:mouseenter={() => hoveredCircleId = record.id}
                               on:mouseleave={() => hoveredCircleId = null}>
                                <i class="ph type-icon" class:ph-crown={record.isMaster} class:ph-signpost={!record.isMaster}></i>
                                <span>{record.name}</span>
                                <i class="ph-circle" class:ph={hoveredCircleId !== record.id} class:ph-fill={hoveredCircleId === record.id}></i>
                            </a>
                            <span use:mountRowActions={{ itemId: record.id, relationName: 'rejectedClusterItems' }}></span>
                        </div>
                    </li>
                {/each}
            </ul>
        {/if}
    {/if}
</div>

<style>
    .records {
        margin-top: 10px;
    }

    div ul {
        list-style: none;
        padding: 0;
        margin: 8px 0;
    }

    div ul li {
        padding: 0;
    }

    .item-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-left: 6px;
        margin-top: 10px;
    }

    .item-row a {
        flex: 1;
        min-width: 0;
        display: inline-flex;
        align-items: center;
        text-decoration: none;
        color: #777;
        line-height: normal;
    }

    .item-row a > span {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-inline-end: 1em;
    }

    .item-row a > .type-icon {
        margin-inline-end: .5em;
        font-size: 16px;
        flex-shrink: 0;
    }

    .item-row a > i:not(.type-icon) {
        margin-inline-start: auto;
        margin-inline-end: .25em;
        font-size: .95em;
        flex-shrink: 0;
    }

    .item-row a:hover,
    .item-row a:focus {
        text-decoration: none;
    }

    .item-row a.active {
        color: var(--primary-font-color);
    }

    .item-row a.rejected-item {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .auto-icon {
        margin-inline-start: .4em;
        flex-shrink: 0;
    }

    .sub-group-header {
        display: flex;
        align-items: center;
        border-top: 2px solid #e8eced;
        padding: 5px 0 3px;
    }

    .sub-group-header:not(:first-of-type) {
        margin-top: 25px;
    }

    .label-badge:hover {
        background: #e0e5e7;
    }

    .label-badge:active {
        background: #d8dee1;
        color: #222;
    }

    .label-badge {
        display: inline-block;
        padding: 4px 10px;
        background: #e8eced;
        cursor: pointer;
        user-select: none;
        font-size: 11px;
        line-height: 1;
        color: #333;
        white-space: nowrap;
        text-align: center;
        text-transform: none;
        letter-spacing: 0.02em;
    }

    .label-badge i {
        margin-inline-end: 4px;
        font-size: 12px;
        margin-inline-start: -2px;
    }

    .load-more-container {
        margin-top: 8px;
        text-align: center;
    }

    .load-more-btn {
        width: 100%;
    }
</style>
