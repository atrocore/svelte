<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import { ApiClient } from '$lib/core/api-client';
    import { Language } from "$lib/core/language";
    import { Notifier } from "$lib/dom/notifier";
    import { Metadata } from "$lib/core/metadata";
    import Preloader from "$lib/components/loaders/Preloader/Preloader.svelte";

    const dispatch = createEventDispatcher<{ 'title-change': { text: string; href: string } }>();

    export let clusterId: string = '';
    export let maxVisibleCount: number = 20;
    export let loadClusterDetail: ((element: HTMLElement, attributes: Record<string, any>) => void) | null = null;

    let cluster: any = null;
    let loading = false;

    let masterRecords: any[] = [];
    let masterOffset = 0;
    let masterHasMore = false;
    let masterLoadingMore = false;
    let masterCollapsed = false;
    let masterTotal: number | null = null;

    let stagingRecords: any[] = [];
    let stagingOffset = 0;
    let stagingHasMore = false;
    let stagingLoadingMore = false;
    let stagingCollapsed = false;
    let stagingTotal: number | null = null;

    $: if (clusterId) {
        load();
    }

    function getStagingEntityTypes(masterEntity: string): string[] {
        const scopes: Record<string, any> = Metadata.get(['scopes']) ?? {};
        return Object.keys(scopes).filter(scope =>
            scopes[scope].primaryEntityId === masterEntity && scopes[scope].role !== 'changeRequest'
        );
    }

    function mapItem(item: any): any {
        return {
            id: item.entityId,
            name: item.recordName ?? item.entityId,
            entityName: item.entityName,
            confirmed: item._meta?.cluster?.confirmed ?? false,
            confirmedAutomatically: item.confirmedAutomatically,
            isGoldenRecord: item._meta?.cluster?.golden ?? false,
        };
    }

    async function fetchPage(where: any[], offset: number, fetchTotal = false): Promise<{ records: any[]; hasMore: boolean; total: number | null }> {
        const withMetaHeader = { 'With-Meta': 'true' };
        const result = await ApiClient.get('/entityRelation', {
            entityName: 'Cluster',
            link: 'clusterItems',
            id: clusterId,
            select: 'entityName,entityId,entity,confirmedAutomatically',
            collectionOnly: true,
            sortBy: 'id',
            asc: false,
            offset,
            maxSize: maxVisibleCount + 1,
            where: JSON.stringify(where)
        }, withMetaHeader);
        const list: any[] = result.list ?? [];
        const hasMore = list.length > maxVisibleCount;

        let total: number | null = null;
        if (fetchTotal && hasMore) {
            const totalResult = await ApiClient.get('/entityRelation', {
                entityName: 'Cluster',
                link: 'clusterItems',
                id: clusterId,
                collectionOnly: true,
                totalOnly: true,
                where: JSON.stringify(where)
            });
            total = totalResult.total ?? null;
        }

        return {
            records: list.slice(0, maxVisibleCount).map(mapItem),
            hasMore,
            total,
        };
    }

    async function load() {
        if (!clusterId) {
            cluster = null;
            return;
        }

        loading = true;
        masterRecords = [];
        stagingRecords = [];
        masterOffset = 0;
        stagingOffset = 0;
        masterHasMore = false;
        stagingHasMore = false;
        masterTotal = null;
        stagingTotal = null;

        try {
            cluster = await ApiClient.get(`/Cluster/${clusterId}`, { select: 'id,number,state,createdAt,masterEntity' });
            dispatch('title-change', `<a href="#Cluster/view/${cluster.id}" target="_blank" class="sidebar-title-link">${Language.translate('Cluster', 'scopeNames')} ${cluster.number}</a>`);

            const masterEntity: string = cluster.masterEntity;
            const stagingTypes = getStagingEntityTypes(masterEntity);

            const masterFilter = [{ attribute: 'entityName', type: 'equals', value: masterEntity }];
            const stagingFilter = stagingTypes.length > 0
                ? [{ attribute: 'entityName', type: 'in', value: stagingTypes }]
                : null;

            const promises: Promise<void>[] = [
                fetchPage(masterFilter, 0, true).then(({ records, hasMore, total }) => {
                    masterRecords = records;
                    masterOffset = records.length;
                    masterHasMore = hasMore;
                    masterTotal = total;
                })
            ];

            if (stagingFilter) {
                promises.push(
                    fetchPage(stagingFilter, 0, true).then(({ records, hasMore, total }) => {
                        stagingRecords = records;
                        stagingOffset = records.length;
                        stagingHasMore = hasMore;
                        stagingTotal = total;
                    })
                );
            }

            await Promise.all(promises);
        } catch (e: any) {
            cluster = null;
            if (e?.status !== 404) {
                Notifier.notify('Error occurred', 'error');
            }
        }
        loading = false;
    }

    async function loadMoreMaster() {
        if (masterLoadingMore || !cluster) return;
        masterLoadingMore = true;
        try {
            const masterFilter = [{ attribute: 'entityName', type: 'equals', value: cluster.masterEntity }];
            const { records, hasMore } = await fetchPage(masterFilter, masterOffset);
            masterRecords = [...masterRecords, ...records];
            masterOffset += records.length;
            masterHasMore = hasMore;
        } catch {
            Notifier.notify('Error occurred', 'error');
        }
        masterLoadingMore = false;
    }

    async function loadMoreStaging() {
        if (stagingLoadingMore || !cluster) return;
        stagingLoadingMore = true;
        try {
            const stagingTypes = getStagingEntityTypes(cluster.masterEntity);
            const stagingFilter = [{ attribute: 'entityName', type: 'in', value: stagingTypes }];
            const { records, hasMore } = await fetchPage(stagingFilter, stagingOffset);
            stagingRecords = [...stagingRecords, ...records];
            stagingOffset += records.length;
            stagingHasMore = hasMore;
        } catch {
            Notifier.notify('Error occurred', 'error');
        }
        stagingLoadingMore = false;
    }

    function getStateColor(state: string): string {
        const options: string[] = Metadata.get(['entityDefs', 'Cluster', 'fields', 'state', 'options']) ?? [];
        const colors: string[] = Metadata.get(['entityDefs', 'Cluster', 'fields', 'state', 'optionColors']) ?? [];
        const idx = options.indexOf(state);
        return idx !== -1 && colors[idx] ? `#${colors[idx]}` : '#eeeeee';
    }

    function getBorderColor(record: any): string {
        if (record.isGoldenRecord) return '#FFD700';
        if (record.confirmed) return '#0066cc';
        return 'transparent';
    }

    function mountDetail(element: HTMLElement) {
        element.id = 'cluster-detail-' + clusterId;
        loadClusterDetail?.(element, cluster);
        return {};
    }

    onMount(() => {
        load();
    });
</script>

{#if loading}
    <div style="text-align:center;margin-top:10px">
        <Preloader />
    </div>
{:else if !cluster}
    <p class="no-cluster">{Language.translate('noClusterFound', 'messages', 'Cluster')}</p>
{:else}
    <div use:mountDetail></div>

    <div class="panel panel-master-records" data-name="master-records">
        <div class="panel-heading">
            <span class="label-badge count-badge">{masterTotal ?? masterRecords.length} item(s)</span>
            <span class="label-badge"
                  on:click={() => masterCollapsed = !masterCollapsed}
                  on:keydown={(e) => e.key === 'Enter' && (masterCollapsed = !masterCollapsed)}
                  role="button"
                  tabindex="0">
                {Language.translate('masterRecordsPanel', 'labels', 'Cluster')}
                <i class="ph" class:ph-caret-down={!masterCollapsed} class:ph-caret-left={masterCollapsed}></i>
            </span>
        </div>
        {#if !masterCollapsed}
            <div class="panel-body">
                <ul class="record-list">
                    {#each masterRecords as record}
                        <li class="record-item">
                            <a href="#{record.entityName}/view/{record.id}" target="_blank"
                               style="border-left: 3px solid {getBorderColor(record)}">
                                {record.name}
                                {#if record.confirmedAutomatically}
                                    <i class="ph ph-sparkle auto-icon"></i>
                                {/if}
                            </a>
                        </li>
                    {/each}
                </ul>
                {#if masterHasMore}
                    <button class="btn btn-sm btn-default show-more-btn" on:click={loadMoreMaster} disabled={masterLoadingMore}>
                        {#if masterLoadingMore}
                            <img style="width:14px;vertical-align:middle" class="preloader" src="client/img/atro-loader.svg" alt="loader">
                        {:else}
                            {Language.translate("Show more")}
                        {/if}
                    </button>
                {/if}
            </div>
        {/if}
    </div>

    <div class="panel panel-staging-records" data-name="staging-records">
        <div class="panel-heading">
            <span class="label-badge count-badge">{stagingTotal ?? stagingRecords.length} item(s)</span>
            <span class="label-badge"
                  on:click={() => stagingCollapsed = !stagingCollapsed}
                  on:keydown={(e) => e.key === 'Enter' && (stagingCollapsed = !stagingCollapsed)}
                  role="button"
                  tabindex="0">
                {Language.translate('stagingRecordsPanel', 'labels', 'Cluster')}
                <i class="ph" class:ph-caret-down={!stagingCollapsed} class:ph-caret-left={stagingCollapsed}></i>
            </span>
        </div>
        {#if !stagingCollapsed}
            <div class="panel-body">
                <ul class="record-list">
                    {#each stagingRecords as record}
                        <li class="record-item">
                            <a href="#{record.entityName}/view/{record.id}" target="_blank"
                               style="border-left: 3px solid {getBorderColor(record)}">
                                {record.name}
                                {#if record.confirmedAutomatically}
                                    <i class="ph ph-sparkle auto-icon"></i>
                                {/if}
                            </a>
                        </li>
                    {/each}
                </ul>
                {#if stagingHasMore}
                    <button class="btn btn-sm btn-default show-more-btn" on:click={loadMoreStaging} disabled={stagingLoadingMore}>
                        {#if stagingLoadingMore}
                            <img style="width:14px;vertical-align:middle" class="preloader" src="client/img/atro-loader.svg" alt="loader">
                        {:else}
                            {Language.translate("Show more")}
                        {/if}
                    </button>
                {/if}
            </div>
        {/if}
    </div>
{/if}

<style>
    .ph-sparkle {
        font-size: 14px;
        position: relative;
        margin-left: 2px;
        top: -0.5em;
        color: var(--label-color)
    }

    .panel > .panel-body {
        padding: 0;
    }

    .panel-body {
        background-color: transparent;
        border-top-width: 0;
        border-left-width: 0;
        border-right-width: 0;
        padding: 10px 0;
    }

    .panel {
        background-color: transparent;
        margin-bottom: 25px;
    }

    .panel-heading {
        display: flex;
        justify-content: space-between;
        border-top: 2px solid #e8eced;
        padding: 5px 0 3px;
    }

    .label-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        background: #e8eced;
        cursor: pointer;
        user-select: none;
        font-size: 11px;
        line-height: 1;
        color: #333;
        white-space: nowrap;
    }

    .label-badge:hover {
        background: #e0e5e7;
    }

    .label-badge:active {
        background: #d8dee1;
        color: #222;
    }

    .label-badge i {
        font-size: 12px;
    }

    .count-badge {
        cursor: default;
        background-color: transparent;
        color: #000;
        padding-left: 0;
    }

    .count-badge:hover {
        background-color: transparent;
    }

    .count-badge:active {
        background-color: transparent;
    }

    .no-cluster {
        color: #999;
        font-style: italic;
        margin-top: 10px;
    }

    .record-list {
        list-style: none;
        padding: 0;
        margin: 10px 0 0;
    }

    .record-item {
        margin: 3px 0;
    }

    .record-item a {
        display: block;
        padding-left: 8px;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
        text-decoration: none;
        line-height: 1.6;
    }

    .record-item a:hover {
        text-decoration: none;
    }

    .auto-icon {
        margin-inline-start: 0.4em;
        color: #888;
    }

    .show-more-btn {
        width: 100%;
        margin-top: 4px;
    }
</style>
