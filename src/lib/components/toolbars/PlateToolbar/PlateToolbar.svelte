<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import ListToolbar from "$lib/components/toolbars/ListToolbar/ListToolbar.svelte";
    import type Counter from "$lib/components/toolbars/ListToolbar/types/counter";
    import type MassAction from "$lib/components/toolbars/ListToolbar/types/mass-action";
    import { Language } from "$lib/core/language"
    import { onMount } from "svelte";
    import Floating from "$lib/dom/floating";

    export let loading: boolean = false;
    export let counters: Array<Counter[]> = [];
    export let massActions: Array<MassAction | string> = [];
    export let showFilter: boolean = false;
    export let showSearch: boolean = false;
    export let searchManager: any;
    export let scope: string;
    export let uniqueKey: string = 'default';
    export let selected: string[] | boolean = false;
    export let hasSelectAllCheckbox: boolean = false;
    export let itemsInRow: number = 3;
    export let itemsInRowOptions: Array<number> = [1, 2, 3, 4, 5, 6];
    export let sortBy: string = 'id';
    export let sortDirection: string = 'asc';
    export let sortByOptions: string[] = [];
    export let executeMassAction = (action: string, id?: Record<string, any>): void => {
    };
    export let handleSelectAll = (e: Event): void => {
    };

    export let changeItemsInRow = (itemsInRow: number): void => {
    };
    export let changeSortField = (sortBy: string): void => {
    };
    export let changeSortDirection = (asc: boolean): void => {
    };

    let sortButton: HTMLButtonElement;
    let sortDropdown: HTMLUListElement;

    let itemsInRowButton: HTMLButtonElement;
    let itemsInRowDropdown: HTMLUListElement;

    function onClickItemsInRow(e: MouseEvent): void {
        const target = e.currentTarget as HTMLElement;
        const value = target.dataset.value;

        if (!value) {
            return;
        }

        itemsInRow = parseInt(value);
        changeItemsInRow(itemsInRow);
    }

    function onClickSortBy(e: MouseEvent): void {
        const target = e.currentTarget as HTMLElement;
        const value = target.dataset.value;
        if (!value) {
            return;
        }

        sortBy = value;
        changeSortField(sortBy);
    }

    function onClickSortDirection(e: MouseEvent): void {
        const target = e.currentTarget as HTMLElement;
        const value = target.dataset.value;
        if (!value) {
            return;
        }

        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        changeSortDirection(sortDirection === 'asc');
    }

    onMount(() => {
        const sortDropdownHandle = new Floating(sortButton, sortDropdown);
        const itemsInRowDropdownHandle = new Floating(itemsInRowButton, itemsInRowDropdown);

        return () => {
            sortDropdownHandle.destroy();
            itemsInRowDropdownHandle.destroy();
        }
    });

</script>

<ListToolbar {scope} {searchManager} {showFilter} {showSearch} {loading} {counters} {massActions} {uniqueKey}
                      {selected} {hasSelectAllCheckbox} {executeMassAction} {handleSelectAll}>
    <div class="list-controls">
        <div class="control items-row">
            <div class="name">{Language.translate('itemsInRow', 'labels')}:</div>
            <div class="button-group">
                <button bind:this={itemsInRowButton}>{itemsInRow}</button>
                <ul class="dropdown-menu" bind:this={itemsInRowDropdown}>
                    {#each itemsInRowOptions as item}
                        <li><a href="javascript:" data-value={item} on:click={onClickItemsInRow}>{item}</a></li>
                    {/each}
                </ul>
            </div>
        </div>

        <div class="control sort">
            <div class="name">{Language.translate('sort', 'labels')}:</div>
            <div class="button-group">
                <button bind:this={sortButton}>{Language.translate(sortBy, 'fields', scope)}</button>
                <button data-value={sortDirection} on:click={onClickSortDirection}>
                    {#if sortDirection === 'asc'}<i class="ph ph-arrow-up"></i>{:else}<i
                            class="ph ph-arrow-down"></i>{/if}
                </button>
                <ul class="dropdown-menu" bind:this={sortDropdown}>
                    {#each sortByOptions.filter(f => f !== sortBy) as field}
                        <li><a href="javascript:" data-value={field}
                               on:click={onClickSortBy}>{Language.translate(field, 'fields', scope)}</a></li>
                    {/each}
                </ul>
            </div>
        </div>
    </div>
</ListToolbar>

<style>
    .list-controls {
        margin: 0 0 0 auto;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 15px;
    }

    .control {
        display: flex;
        align-items: center;
    }

    .control button {
        border: 0;
        padding: 0;
        background-color: transparent;
        margin-inline-start: .25em;
        line-height: inherit;
    }

    .dropdown-menu {
        max-height: 350px;
        overflow-y: auto;
    }
</style>
