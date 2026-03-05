<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script>
    import { createEventDispatcher } from 'svelte';
    import TextDetail from './TextDetail/TextDetail.svelte';
    import TextEdit from './TextEdit/TextEdit.svelte';
    import TextList from './TextList/TextList.svelte';
    import TextSearch from './TextSearch/TextSearch.svelte';

    export let name = '';
    export let value = '';
    export let mode = 'detail';
    export let scope = '';
    export let params = {};

    // Individual props — fallback when used directly without a params object
    export let rowsMin = 2;
    export let rowsMax = 10;
    export let detailMaxLength = 400;
    export let detailMaxNewLineCount = 10;
    export let maxLength = null;
    export let countBytesInsteadOfCharacters = false;
    export let autoHeightDisabled = false;
    export let useDisabledTextareaInViewMode = false;
    export let seeMoreDisabled = false;
    export let searchType = 'startsWith';
    export let searchValue = '';

    const dispatch = createEventDispatcher();

    // Resolved effective params (params object takes precedence over individual props)
    $: p = {
        rowsMin: params.rowsMin || rowsMin,
        rowsMax: params.rowsMax || rowsMax,
        detailMaxLength: params.lengthOfCut || detailMaxLength,
        detailMaxNewLineCount,
        maxLength: params.maxLength || maxLength,
        countBytesInsteadOfCharacters: params.countBytesInsteadOfCharacters || countBytesInsteadOfCharacters,
        autoHeightDisabled: params.autoHeightDisabled || autoHeightDisabled,
        useDisabledTextareaInViewMode: params.useDisabledTextareaInViewMode || useDisabledTextareaInViewMode,
        seeMoreDisabled: params.seeMoreDisabled || seeMoreDisabled,
    };

    $: rows = p.autoHeightDisabled ? p.rowsMax : p.rowsMin;

    let currentValue = value;
    $: currentValue = value;

    let editComponent;
    let searchComponent;

    function handleChange(event) {
        currentValue = event.detail.value;
        dispatch('change', event.detail);
    }

    export function fetch() {
        if (editComponent) return editComponent.fetch();
        return { [name]: currentValue === '' ? null : currentValue };
    }

    export function fetchSearch() {
        if (searchComponent) return searchComponent.fetchSearch();
        return false;
    }
</script>

<slot>
    {#if mode === 'detail'}
        <TextDetail
            {name}
            value={currentValue}
            {rows}
            useDisabledTextareaInViewMode={p.useDisabledTextareaInViewMode}
            seeMoreDisabled={p.seeMoreDisabled}
            detailMaxLength={p.detailMaxLength}
            detailMaxNewLineCount={p.detailMaxNewLineCount}
        />
    {:else if mode === 'list'}
        <TextList
            value={currentValue}
            detailMaxLength={p.detailMaxLength}
            detailMaxNewLineCount={p.detailMaxNewLineCount}
            seeMoreDisabled={p.seeMoreDisabled}
        />
    {:else if mode === 'edit'}
        <TextEdit
            bind:this={editComponent}
            {name}
            value={currentValue}
            {rows}
            rowsMin={p.rowsMin}
            rowsMax={p.rowsMax}
            maxLength={p.maxLength}
            countBytesInsteadOfCharacters={p.countBytesInsteadOfCharacters}
            autoHeightDisabled={p.autoHeightDisabled}
            on:change={handleChange}
        />
    {:else if mode === 'search'}
        <TextSearch
            bind:this={searchComponent}
            {name}
            {searchType}
            {searchValue}
            maxLength={p.maxLength}
        />
    {/if}
</slot>