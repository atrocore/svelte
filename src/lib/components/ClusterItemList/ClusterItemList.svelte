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
    import type GroupedItems from "./types/grouped-items";
    import { Language } from "$lib/core/language";

    export let records: ClusterItem[] = [];
    export let selectedIds: string[] = [];
    export let selectionViewMode: string = 'standard';

    export let onItemClicked: (e: MouseEvent, id: string) => void = () => {};
    export let onSelectAll: (entityType: string) => void = () => {};
    export let onUnSelectAll: (entityType: string) => void = () => {};
    export let onMountRowActions: (element: HTMLElement, itemId: string, relationName: string) => void = () => {};
    export let onLoadMore: () => void = () => {};
    export let hasMore: boolean = false;
    export let loadingMore: boolean = false;

    let data: GroupedItems = {};
    let collapsed: Record<string, boolean> = {};

    $: selectedIdSet = new Set(selectedIds);
    $: hasSelectedByType = calculateSelectedStatus(records, selectedIdSet);

    function calculateSelectedStatus(recs: ClusterItem[], ids: Set<string>): Record<string, boolean> {
        const status: Record<string, boolean> = {};
        recs.forEach(r => {
            if (!status[r.entityType] && ids.has(r.id)) {
                status[r.entityType] = true;
            }
        });
        return status;
    }

    export function setRecords(value: ClusterItem[]): void {
        records = value;
        data = {};
        records.forEach((record: ClusterItem) => {
            if (!data[record.entityType]) {
                data[record.entityType] = [];
            }
            data[record.entityType].push(record);
        });
    }

    export function setSelectedIds(ids: string[]): void {
        selectedIds = ids;
    }

    export function setSelectionViewMode(value: string): void {
        selectionViewMode = value;
    }

    export function setHasMore(value: boolean): void {
        hasMore = value;
    }

    export function setLoadingMore(value: boolean): void {
        loadingMore = value;
    }

    function getSubGroups(items: ClusterItem[]) {
        return {
            notConfirmed: items.filter(i => !i.confirm && !i.rejected),
            confirmed: items.filter(i => i.confirm === true),
            rejected: items.filter(i => i.rejected === true)
        };
    }

    function toggleCollapsed(key: string): void {
        collapsed[key] = !collapsed[key];
        collapsed = { ...collapsed };
    }

    function handleSelectAll(entityType: string): void {
        if (hasSelectedByType[entityType]) {
            onUnSelectAll(entityType);
        } else {
            onSelectAll(entityType);
        }
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
    {#each Object.keys(data).sort((a, b) => a.localeCompare(b)) as entityType}
        {@const subGroups = getSubGroups(data[entityType])}
        <div>
            <div class="title">
                <span>{Language.translate(entityType, 'scopeNamesPlural')}</span>
                {#if selectionViewMode !== 'standard'}
                    <button class="small filter-button" on:click={() => handleSelectAll(entityType)}>
                        {hasSelectedByType[entityType] ? Language.translate('hideAll') : Language.translate('selectAll')}
                    </button>
                {/if}
            </div>

            {#if subGroups.notConfirmed.length > 0}
                <ul>
                    {#each subGroups.notConfirmed as record}
                        <li title="{record.name}">
                            <div class="item-row">
                                <a href="#{record.entityType}/view/{record.id}" target="_blank"
                                   on:click={(e) => onItemClicked(e, record.id)}
                                   class:active="{selectionViewMode !== 'standard' && selectedIdSet.has(record.id)}">
                                    <i class="ph" class:ph-eye={selectedIdSet.has(record.id)} class:ph-eye-slash={!selectedIdSet.has(record.id)}></i>
                                    {record.name}
                                    {#if record.confirmedAutomatically}
                                        <i class="ph ph-spark auto-icon"></i>
                                    {/if}
                                </a>
                                <span use:mountRowActions={{ itemId: record.id, relationName: 'clusterItems' }}></span>
                            </div>
                        </li>
                    {/each}
                </ul>
            {/if}

            {#if subGroups.confirmed.length > 0}
                <div class="sub-group-header"
                     on:click={() => toggleCollapsed(`${entityType}_confirmed`)}
                     on:keydown={(e) => e.key === 'Enter' && toggleCollapsed(`${entityType}_confirmed`)}
                     role="button"
                     tabindex="0">
                    <i class="ph" class:ph-caret-up={!collapsed[`${entityType}_confirmed`]} class:ph-caret-down={collapsed[`${entityType}_confirmed`]}></i>
                    <span class="label-badge">{Language.translate('confirmed', 'labels', 'Cluster')}</span>
                </div>
                {#if !collapsed[`${entityType}_confirmed`]}
                    <ul>
                        {#each subGroups.confirmed as record}
                            <li title="{record.name}">
                                <div class="item-row">
                                    <a href="#{record.entityType}/view/{record.id}" target="_blank"
                                       on:click={(e) => onItemClicked(e, record.id)}
                                       class:active="{selectionViewMode !== 'standard' && selectedIdSet.has(record.id)}">
                                        <i class="ph" class:ph-eye={selectedIdSet.has(record.id)} class:ph-eye-slash={!selectedIdSet.has(record.id)}></i>
                                        {record.name}
                                        {#if record.confirmedAutomatically}
                                            <i class="ph ph-spark auto-icon"></i>
                                        {/if}
                                    </a>
                                    <span use:mountRowActions={{ itemId: record.id, relationName: 'clusterItems' }}></span>
                                </div>
                            </li>
                        {/each}
                    </ul>
                {/if}
            {/if}

            {#if subGroups.rejected.length > 0}
                <div class="sub-group-header rejected-header"
                     on:click={() => toggleCollapsed(`${entityType}_rejected`)}
                     on:keydown={(e) => e.key === 'Enter' && toggleCollapsed(`${entityType}_rejected`)}
                     role="button"
                     tabindex="0">
                    <i class="ph" class:ph-caret-up={!collapsed[`${entityType}_rejected`]} class:ph-caret-down={collapsed[`${entityType}_rejected`]}></i>
                    <span class="label-badge">{Language.translate('rejected', 'labels', 'Cluster')}</span>
                </div>
                {#if !collapsed[`${entityType}_rejected`]}
                    <ul>
                        {#each subGroups.rejected as record}
                            <li title="{record.name}">
                                <div class="item-row">
                                    <a href="#{record.entityType}/view/{record.id}" target="_blank" class="rejected-item"
                                       on:click|preventDefault>
                                        <i class="ph ph-eye-slash"></i>
                                        {record.name}
                                    </a>
                                    <span use:mountRowActions={{ itemId: record.id, relationName: 'rejectedClusterItems' }}></span>
                                </div>
                            </li>
                        {/each}
                    </ul>
                {/if}
            {/if}
        </div>
    {/each}

    {#if hasMore}
        <div class="load-more-container">
            <button class="btn btn-sm btn-default load-more-btn" on:click={onLoadMore} disabled={loadingMore}>
                {#if loadingMore}
                    <img style="width:14px;vertical-align:middle" class="preloader" src="client/img/atro-loader.svg" alt="loader">
                {:else}
                    {Language.translate("Show more")}
                {/if}
            </button>
        </div>
    {/if}
</div>

<style>
    .records {
        margin-top: 20px;
    }

    .title {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 16px;
        font-weight: 500;
    }

    .filter-button {
        align-self: flex-start;
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
    }

    .item-row a {
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
        flex: 1;
        min-width: 0;
        text-decoration: none;
        color: #777;
        line-height: normal;
    }

    .item-row a > i {
        margin-inline-end: .5em;
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
    }

    .sub-group-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-top: 2px solid #e8eced;
        margin-top: 4px;
        padding: 4px 0 2px;
        cursor: pointer;
        user-select: none;
        color: #777;
    }

    .sub-group-header:hover {
        color: var(--primary-font-color);
    }

    .sub-group-header .label-badge {
        background: #e8eced;
        border-radius: 3px;
        padding: 3px 10px;
        font-size: 12px;
        color: #333;
        white-space: nowrap;
        width: 80px;
        text-align: center;
    }

    .label-badge {
        display: inline-block;
        padding: 5px 10px;
        background: #e8eced;
        text-transform: none;
        letter-spacing: 0.03em;
        color: #333;
    }

    .load-more-container {
        margin-top: 8px;
        text-align: center;
    }

    .load-more-btn {
        width: 100%;
    }
</style>
