<script lang="ts">
    import { onMount } from "svelte";
    import { ApiClient } from '$lib/core/api-client';
    import { Language } from "$lib/core/language";
    import { Notifier } from "$lib/dom/notifier";
    import { Metadata } from "$lib/core/metadata";

    export let scope: string;
    export let id: string;

    let data: any = null;
    let loading = false;
    let masterCollapsed = false;
    let stagingCollapsed = false;
    let masterVisibleCount = 20;
    let stagingVisibleCount = 20;

    async function load() {
        loading = true;
        try {
            data = await ApiClient.get('/Cluster/entityData', {entityName: scope, entityId: id});
        } catch (e: any) {
            data = null;
            if (e?.status !== 404) {
                Notifier.notify('Error occurred', 'error');
            }
        }
        loading = false;
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
{:else if !data}
    <p class="no-cluster">{Language.translate('noClusterFound', 'messages', 'Cluster')}</p>
{:else}
    <div class="panel panel-cluster" data-name="cluster">
        <div class="panel-heading">
            <h4 class="panel-title">
                <a href="#{`Cluster/view/${data.id}`}" target="_blank" class="cluster-name">
                    <span>{data.number}</span>
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
                                        <i style="background-color:{getStateColor(data.state)}"></i>
                                        <span>{Language.translateOption(data.state, 'state', 'Cluster')}</span>
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <th class="cell-label">{Language.translate('createdAt', 'fields', 'Global')}</th>
                                <td class="cell-value">{data.createdAt ?? ''}</td>
                            </tr>
                            </tbody>
                        </table>
                    </li>
                </ul>
            </div>
        </div>
    </div>

    <div class="panel  panel-master-records" data-name="master-records">
        <div class="panel-heading"
             on:click={() => masterCollapsed = !masterCollapsed}
             on:keydown={(e) => e.key === 'Enter' && (masterCollapsed = !masterCollapsed)}
             role="button"
             tabindex="0">
            <h4 class="panel-title">
                <i class="ph" class:ph-caret-up={!masterCollapsed} class:ph-caret-down={masterCollapsed}></i>
                <span class="panel-title-text">
                    {Language.translate('masterRecordsPanel', 'labels', 'Cluster')} ({data.masterRecords.length})
                </span>
            </h4>
        </div>
        {#if !masterCollapsed}
            <div class="panel-body">
                <ul class="record-list">
                    {#each data.masterRecords.slice(0, masterVisibleCount) as record}
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
                {#if data.masterRecords.length > masterVisibleCount}
                    <button class="btn btn-sm btn-default show-more-btn" on:click={() => masterVisibleCount += 20}>
                        {Language.translate("Show more")}
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
                        {Language.translate('stagingRecordsPanel', 'labels', 'Cluster')} ({data.stagingRecords.length})
                    </span>
            </h4>
        </div>
        {#if !stagingCollapsed}
            <div class="panel-body">
                <ul class="record-list">
                    {#each data.stagingRecords.slice(0, stagingVisibleCount) as record}
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
                {#if data.stagingRecords.length > stagingVisibleCount}
                    <button class="btn btn-sm btn-default show-more-btn" on:click={() => stagingVisibleCount += 20}>
                        {Language.translate("Show more")}
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
