<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script>
    import { createEventDispatcher, onMount } from 'svelte';
    import { Language } from '$lib/core/language';
    import Base from '$lib/components/fields/Base/Base.svelte';

    export let name = '';
    export let value = '';
    export let mode = 'detail';
    export let scope = '';
    export let params = {};

    // Individual props with fallback to params object (for direct Svelte usage)
    export let rowsMin = 2;
    export let rowsMax = 10;
    export let detailMaxLength = 400;
    export let detailMaxNewLineCount = 10;
    export let maxLength = null;
    export let countBytesInsteadOfCharacters = false;
    export let autoHeightDisabled = false;
    export let useDisabledTextareaInViewMode = false;
    export let seeMoreDisabled = false;

    // Search state
    const searchTypeList = ['contains', 'startsWith', 'equals', 'endsWith', 'like', 'notContains', 'notLike', 'isEmpty', 'isNotEmpty'];
    export let searchType = 'startsWith';
    export let searchValue = '';

    const dispatch = createEventDispatcher();

    // Resolve effective params (from params object or individual props)
    $: effectiveRowsMin = params.rowsMin || rowsMin;
    $: effectiveRowsMax = params.rowsMax || rowsMax;
    $: effectiveMaxLength = params.maxLength || maxLength;
    $: effectiveCountBytes = params.countBytesInsteadOfCharacters || countBytesInsteadOfCharacters;
    $: effectiveAutoHeightDisabled = params.autoHeightDisabled || autoHeightDisabled;
    $: effectiveUseDisabledTextareaInViewMode = params.useDisabledTextareaInViewMode || useDisabledTextareaInViewMode;
    $: effectiveSeeMoreDisabled = params.seeMoreDisabled || seeMoreDisabled;
    $: effectiveDetailMaxLength = params.lengthOfCut || detailMaxLength;

    // Internal mutable state
    let currentValue = value;
    $: currentValue = value;

    let seeMoreText = false;
    let textElement;
    let currentLength = 0;
    let hasError = false;
    let displayedText = '';
    let isCut = false;

    $: rows = effectiveAutoHeightDisabled ? effectiveRowsMax : effectiveRowsMin;
    $: canTruncate = !seeMoreText && !effectiveSeeMoreDisabled;
    $: hideSearchInput = mode === 'search' && (searchType === 'isEmpty' || searchType === 'isNotEmpty');

    $: {
        const raw = currentValue || '';
        if (raw && ((mode === 'detail' && !effectiveUseDisabledTextareaInViewMode) || mode === 'list') && canTruncate) {
            let text = raw.toString();
            let cut = false;

            if (text.length > effectiveDetailMaxLength) {
                text = text.substr(0, effectiveDetailMaxLength);
                cut = true;
            }

            const nlCount = (text.match(/\n/g) || []).length;
            if (nlCount > detailMaxNewLineCount) {
                text = text.split('\n').slice(0, detailMaxNewLineCount).join('\n');
                cut = true;
            }

            if (cut) text += ' ...';

            displayedText = text;
            isCut = cut;
        } else {
            displayedText = raw;
            isCut = false;
        }
    }

    onMount(() => {
        if (mode === 'edit' && !effectiveAutoHeightDisabled && textElement) {
            controlTextareaHeight();
        }
        if (mode === 'edit') {
            updateTextCounter();
        }
    });

    function controlTextareaHeight(lastHeight) {
        if (!textElement) return;

        const scrollHeight = textElement.scrollHeight;
        const clientHeight = textElement.clientHeight;

        if (typeof lastHeight === 'undefined' && clientHeight === 0) {
            setTimeout(() => controlTextareaHeight(), 10);
            return;
        }

        if (clientHeight === lastHeight) return;

        if (scrollHeight > clientHeight + 1) {
            let r = textElement.rows;
            if (effectiveRowsMax && r >= effectiveRowsMax) return;
            textElement.rows = r + 1;
            controlTextareaHeight(clientHeight);
        }

        if (textElement.value.length === 0) {
            textElement.rows = effectiveRowsMin;
        }
    }

    function getRealLength(text) {
        if (!text) return 0;
        if (effectiveCountBytes) {
            return encodeURI(text).split(/%..|./).length - 1;
        }
        return text.toString().length;
    }

    function updateTextCounter() {
        if (!effectiveMaxLength) return;
        currentLength = getRealLength(currentValue);
        hasError = effectiveMaxLength < currentLength;
    }

    function handleInput(event) {
        currentValue = event.target.value;
        dispatch('change', { name, value: currentValue });

        if (mode === 'edit') {
            updateTextCounter();
            if (!effectiveAutoHeightDisabled) {
                controlTextareaHeight();
            }
        }
    }

    function handleSeeMore() {
        seeMoreText = true;
    }

    function breaklines(text) {
        if (!text) return '';
        return text.toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>');
    }

    function handleSearchTypeChange(event) {
        searchType = event.target.value;
    }

    function handleSearchInput(event) {
        searchValue = event.target.value;
    }

    export function fetch() {
        const val = currentValue === '' ? null : currentValue;
        return { [name]: val };
    }

    export function fetchSearch() {
        if (searchType === 'isEmpty') {
            return {
                type: 'or',
                value: [
                    { type: 'isNull', field: name },
                    { type: 'equals', field: name, value: '' }
                ],
                data: { type: searchType }
            };
        }
        if (searchType === 'isNotEmpty') {
            return {
                type: 'and',
                value: [
                    { type: 'notEquals', field: name, value: '' },
                    { type: 'isNotNull', field: name, value: null }
                ],
                data: { type: searchType }
            };
        }
        const trimmed = (searchValue || '').trim();
        if (trimmed) {
            return { value: trimmed, type: searchType };
        }
        return false;
    }
</script>

<Base {name} value={currentValue} {mode} {params}>
    <slot>
        {#if mode === 'detail'}
            {#if effectiveUseDisabledTextareaInViewMode}
                <textarea
                    bind:this={textElement}
                    {name}
                    value={displayedText}
                    rows={rows}
                    disabled={true}
                    class="form-control"
                ></textarea>
            {:else}
                {#if displayedText}
                    <span>{@html breaklines(displayedText)}</span>
                    {#if isCut}
                        <!-- svelte-ignore a11y-invalid-attribute -->
                        <a href="javascript:" on:click={handleSeeMore}>
                            {Language.translate('See more') || 'See more'}
                        </a>
                    {/if}
                {/if}
            {/if}
        {:else if mode === 'list'}
            <span>{@html breaklines(displayedText)}</span>
        {:else if mode === 'edit'}
            <textarea
                bind:this={textElement}
                {name}
                value={currentValue || ''}
                rows={rows}
                on:input={handleInput}
                class="form-control"
                class:with-text-length={effectiveMaxLength}
                class:error={hasError}
            ></textarea>
            {#if effectiveMaxLength}
                <div class="text-length-counter">
                    <span class="current-length" class:error={hasError}>{currentLength}</span>
                    <span class="maximum">/{effectiveMaxLength}</span>
                </div>
            {/if}
        {:else if mode === 'search'}
            <select
                class="form-control search-type input-sm"
                name="{name}-type"
                value={searchType}
                on:change={handleSearchTypeChange}
            >
                {#each searchTypeList as type}
                    <option value={type} selected={searchType === type}>
                        {Language.translateOption(type, 'varcharSearchRanges') || type}
                    </option>
                {/each}
            </select>
            <input
                type="text"
                class="main-element form-control input-sm"
                {name}
                value={searchValue}
                class:hidden={hideSearchInput}
                autocomplete="off"
                placeholder={Language.translate('Value') || 'Value'}
                maxlength={effectiveMaxLength || undefined}
                on:input={handleSearchInput}
            />
        {/if}
    </slot>
</Base>

<style>
    textarea {
        width: 100%;
        resize: vertical;
    }

    textarea.error {
        border-color: red;
    }

    .text-length-counter {
        text-align: right;
        font-size: 0.85em;
        color: #666;
        margin-top: 2px;
    }

    .text-length-counter .error {
        color: red;
    }

    .hidden {
        display: none;
    }
</style>