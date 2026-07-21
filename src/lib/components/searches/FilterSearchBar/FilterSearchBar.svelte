<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import FilterSearch from "$lib/components/searches/FilterSearch/FilterSearch.svelte";
    import SearchBar from "$lib/components/searches/SearchBar/SearchBar.svelte";
    import { Language } from "$lib/core/language"
    import { Notifier } from "$lib/dom/notifier";

    export let showFilter: boolean = false;
    export let showSearchPanel: boolean = false;
    export let searchManager: any;
    export let scope: string;
    export let uniqueKey: string = 'default';

    let refreshDisabled: boolean = false;
    let search: any;
    let filter: any;

    export function reset() {
        filter.unsetAll();
        search.reset();
    }

    function onRefreshClick() {
        refreshDisabled = true;
        Notifier.notify(Language.translate('loading', 'messages'));
        searchManager.fetchCollection();

        window.Backbone.once('after:search', () => {
            Notifier.clearRegular();
            refreshDisabled = false;
        })
    }
</script>

<div class="filter-search-bar">
    {#if showSearchPanel}
        <SearchBar bind:this={search} searchManager={searchManager} scope={scope}/>
    {/if}
    {#if showFilter}
        <div class="filter-search">
            <FilterSearch bind:this={filter} searchManager={searchManager} scope={scope} uniqueKey={uniqueKey}/>
        </div>
    {/if}
    <button class="refresh" disabled={refreshDisabled} title={Language.translate('Refresh')} on:click={onRefreshClick}>
        <i class="ph ph-arrows-clockwise"></i></button>
</div>

<style>
    .filter-search-bar {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
    }
</style>
