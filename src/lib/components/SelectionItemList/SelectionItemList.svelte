<script lang="ts">

    import { onMount } from "svelte";
    import type SelectionItem from "./types/selection-item";
    import type GroupedItems from "./types/grouped-items";
    import { Language } from "$lib/core/language"

    export let scope: string;
    export let records: SelectionItem[];
    export let selectedIds: string[];
    export let selectionViewMode: string = 'standard'

    export let onItemClicked: (e: MouseEvent, id: string) => void = () => {
    };

    export let onSelectAll: (entityType: string) => void = () => {
    };

    export let onUnSelectAll: (entityType: string) => void = () => {
    };

    export let onMountRowActions: (element: HTMLElement, itemId: string, relationName: string) => void = () => {};

    export let relationName: string = 'selectionItems';

    $: selectedIdSet = new Set(selectedIds);

    $: hasSelectedByType = calculateSelectedStatus(records, selectedIdSet);

    function calculateSelectedStatus(recs: SelectionItem[], ids: Set<string>): Record<string, boolean> {
        const status: Record<string, boolean> = {};
        recs.forEach(r => {
            if (!status[r.entityType] && ids.has(r.id)) {
                status[r.entityType] = true;
            }
        });
        return status;
    }

    let isPinned: boolean = true;
    let data: GroupedItems = {};

    export function setSelectedIds(ids: string[]) {
        selectedIds = ids;
    }

    export function setSelectionViewMode(value: string) {
        selectionViewMode = value;
    }

    export function setRecords(value: SelectionItem[]) {
        records = value;
        data = {};
        records.forEach((record: SelectionItem) => {
            if (!data[record.entityType]) {
                data[record.entityType] = [];
            }
            data[record.entityType].push(record);
        });
    }


    function mountRowActions(element: HTMLElement, params: { itemId: string; relationName: string }) {
        onMountRowActions(element, params.itemId, params.relationName);
        return {};
    }

    function handledSelectAllButton(entityType: string): void {
        if (hasSelectedByType[entityType]) {
            onUnSelectAll(entityType);
        } else {
            onSelectAll(entityType);
        }
    }

    onMount(() => {

        setRecords(records);
    });

</script>


<div class="records">
    {#each Object.keys(data).sort((a, b) => a.localeCompare(b)) as entityType}
        <div>
            <div class="title">
                <span class="title">{Language.translate(entityType, 'scopeNamesPlural')}</span>
            </div>

            <ul>
                {#each data[entityType] as record }
                    <li title="{record.name}">
                        <div class="item-row">
                            <a href="#{record.entityType}/view/{record.id}" target="_blank"
                               on:click={(e) => { onItemClicked(e, record.id) }}
                               class:active="{selectionViewMode !== 'standard' && selectedIds.includes(record.id)}">
                                <span>{record.name}</span>
                                <i class="ph ph-circle"></i>
                            </a>
                            <span class="row-actions-container" use:mountRowActions={{ itemId: record.id, relationName }}></span>
                        </div>
                    </li>
                {/each}
            </ul>
        </div>
    {/each}
</div>

<style>
    .records > div {
        margin-bottom: 25px;
    }

    .title {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .records {
        margin-top: 20px;
    }

    div .title {
        font-size: 16px;
        font-weight: 500;
    }

    div ul {
        list-style: none;
        padding: 0 0 0 10px;
        margin: 10px 0;
    }

    div ul li {
        padding: 0;
    }

    div ul li:not(:first-child) {
        margin-top: 10px;
    }

    .item-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-left: 6px;
    }

    .item-row a {
        flex: 1;
        min-width: 0;
        color: #777;
        display: inline-flex;
        align-items: center;
    }

    .item-row a > span {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-inline-end: 1em;
    }

    .item-row a > i {
        margin-inline-start: auto;
        margin-inline-end: .5em;
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

    .item-row .row-actions-container {
        display: flex;
        align-items: center;
    }

    .item-row .row-actions-container :global(.dropdown-toggle) {
        padding: 2px 0;
    }

    .item-row .row-actions-container :global(.dropdown-toggle i) {
        font-size: 16px;
    }
</style>
