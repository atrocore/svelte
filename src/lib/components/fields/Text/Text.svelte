<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import TextDetail from './TextDetail/TextDetail.svelte';
    import TextEdit from './TextEdit/TextEdit.svelte';
    import TextList from './TextList/TextList.svelte';
    import TextSearch from './TextSearch/TextSearch.svelte';
    import RecordLink from '$lib/components/containers/RecordLink/RecordLink.svelte';
    import type { FieldMode, FieldFetchResult, FieldSearchResult } from '$lib/types/ui/field';

    type TextParams = {
        rowsMin?: number;
        rowsMax?: number;
        lengthOfCut?: number;
        maxLength?: number | null;
        countBytesInsteadOfCharacters?: boolean;
        autoHeightDisabled?: boolean;
        useDisabledTextareaInViewMode?: boolean;
        seeMoreDisabled?: boolean;
    };

    export let name: string = '';
    export let value: string = '';
    export let mode: FieldMode = 'detail';
    export let params: TextParams = {};
    export let entityName: string = '';
    export let entityId: string|null = '';

    // Individual props — fallback when used directly without a params object
    export let rowsMin: number = 2;
    export let rowsMax: number = 10;
    export let detailMaxLength: number = 400;
    export let detailMaxNewLineCount: number = 10;
    export let maxLength: number | null = null;
    export let countBytesInsteadOfCharacters: boolean = false;
    export let autoHeightDisabled: boolean = false;
    export let useDisabledTextareaInViewMode: boolean = false;
    export let seeMoreDisabled: boolean = false;
    export let searchType: string = 'startsWith';
    export let searchValue: string = '';

    const dispatch = createEventDispatcher();

    // Resolved effective params (params object takes precedence over individual props)
    function resolveParams() {
        return {
            rowsMin: params.rowsMin ?? rowsMin,
            rowsMax: params.rowsMax ?? rowsMax,
            detailMaxLength: params.lengthOfCut ?? detailMaxLength,
            detailMaxNewLineCount,
            maxLength: params.maxLength ?? maxLength,
            countBytesInsteadOfCharacters: params.countBytesInsteadOfCharacters ?? countBytesInsteadOfCharacters,
            autoHeightDisabled: params.autoHeightDisabled ?? autoHeightDisabled,
            useDisabledTextareaInViewMode: params.useDisabledTextareaInViewMode ?? useDisabledTextareaInViewMode,
            seeMoreDisabled: params.seeMoreDisabled ?? seeMoreDisabled,
        };
    }
    $: p = resolveParams();

    $: rows = p.autoHeightDisabled ? p.rowsMax : p.rowsMin;

    $: currentValue = value;

    let editComponent: TextEdit | undefined;
    let searchComponent: TextSearch | undefined;

    function handleChange(event: CustomEvent<{ name: string; value: string }>) {
        currentValue = event.detail.value;
        dispatch('change', event.detail);
    }

    export function fetch(): FieldFetchResult {
        if (editComponent) return editComponent.fetch();
        return { [name]: currentValue === '' ? null : currentValue };
    }

    export function fetchSearch(): FieldSearchResult {
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
    {:else if mode === 'listLink'}
        <RecordLink {entityName} {entityId}>
            <TextList
                value={currentValue}
                detailMaxLength={p.detailMaxLength}
                detailMaxNewLineCount={p.detailMaxNewLineCount}
                seeMoreDisabled={p.seeMoreDisabled}
            />
        </RecordLink>
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