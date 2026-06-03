<script lang="ts">
    import { onMount } from "svelte";
    import { ApiClient } from '$lib/core/api-client';
    import { Language } from "$lib/core/language";
    import { Notifier } from "$lib/dom/notifier";
    import { Metadata } from "$lib/core/metadata";

    export let clusterId: string = '';
    export let maxVisibleCount: number = 20;

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

    onMount(() => {
        load();
    });
</script>

{#if loading}
    <div style="text-align:center;margin-top:10px">
        <img style="width:40px" class="preloader" src="client/img/atro-loader.svg" alt="loader">
    </div>
{:else if !cluster}
    <p class="no-cluster">{Language.translate('noClusterFound', 'messages', 'Cluster')}</p>
{:else}
    <div class="panel panel-cluster" data-name="cluster">
        <div class="panel-heading">
            <h4 class="panel-title">
                <a href="#{`Cluster/view/${cluster.id}`}" target="_blank" class="cluster-name">
                    <span>{cluster.number}</span>
                </a>
                <span class="panel-title-text">{Language.translate('Cluster', 'scopeNames')}</span>
            </h4>
        </div>
        <div class="panel-body panel-collapse collapse in" data-name="cluster">
            <div class="list list-expanded">
                <ul class="list-group">
                    <li class="list-group-item list-row">
                        <table style="margin-bottom:9px;width:100%">
                            <tbody>
                            <tr>
                                <th class="cell-label">{Language.translate('state', 'fields', 'Cluster')}</th>
                                <td class="cell-value">
                                    <span class="label colored-enum">
                                        <i style="background-color:{getStateColor(cluster.state)}"></i>
                                        <span>{Language.translateOption(cluster.state, 'state', 'Cluster')}</span>
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <th class="cell-label">{Language.translate('createdAt', 'fields', 'Global')}</th>
                                <td class="cell-value">{cluster.createdAt ?? ''}</td>
                            </tr>
                            </tbody>
                        </table>
                    </li>
                </ul>
            </div>
        </div>
    </div>

    <div class="panel panel-master-records" data-name="master-records">
        <div class="panel-heading"
             on:click={() => masterCollapsed = !masterCollapsed}
             on:keydown={(e) => e.key === 'Enter' && (masterCollapsed = !masterCollapsed)}
             role="button"
             tabindex="0">
            <h4 class="panel-title">
                <i class="ph" class:ph-caret-up={!masterCollapsed} class:ph-caret-down={masterCollapsed}></i>
                <span class="panel-title-text">
                    {Language.translate('masterRecordsPanel', 'labels', 'Cluster')} ({masterTotal ?? masterRecords.length})
                </span>
            </h4>
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
        <div class="panel-heading"
             on:click={() => stagingCollapsed = !stagingCollapsed}
             on:keydown={(e) => e.key === 'Enter' && (stagingCollapsed = !stagingCollapsed)}
             role="button"
             tabindex="0">
            <h4 class="panel-title">
                <i class="ph" class:ph-caret-up={!stagingCollapsed} class:ph-caret-down={stagingCollapsed}></i>
                <span class="panel-title-text">
                    {Language.translate('stagingRecordsPanel', 'labels', 'Cluster')} ({stagingTotal ?? stagingRecords.length})
                </span>
            </h4>
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

    .panel-title {
        display: flex;
        justify-content: space-between
    }

    .panel {
        background-color: transparent;
        margin-bottom: 15px;
    }

    .panel-heading {
        border-top: 1px solid var(--primary-border-color);
    }

    .no-cluster {
        color: #999;
        font-style: italic;
        margin-top: 10px;
    }

    .list-group-item {
        padding: 0;
        background-color: transparent;
        border: none;
    }

    .cluster-name {
        font-size: 16px;
        font-weight: bold;
        color: var(--link-color);
        text-decoration: none;
    }

    .cell-label {
        color: var(--label-color);
        font-weight: normal;
        padding: 3px 5px;
        border: 1px solid #ccc;
        white-space: nowrap;
    }

    .cell-value {
        padding: 3px 5px;
        border: 1px solid #ccc;
    }

    .panel-heading {
        cursor: pointer;
        user-select: none;
    }

    .record-list {
        list-style: none;
        padding: 0;
        margin: 0;
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
