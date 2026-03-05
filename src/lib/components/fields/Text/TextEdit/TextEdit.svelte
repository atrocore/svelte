<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import type { FieldFetchResult } from '$lib/types/ui/field';

    export let name: string = '';
    export let value: string = '';
    export let rows: number = 2;
    export let rowsMin: number = 2;
    export let rowsMax: number = 10;
    export let maxLength: number | null = null;
    export let countBytesInsteadOfCharacters: boolean = false;
    export let autoHeightDisabled: boolean = false;

    const dispatch = createEventDispatcher();

    let textElement: HTMLTextAreaElement | undefined;
    let currentValue = value;
    let currentLength = 0;
    let hasError = false;

    $: currentValue = value;

    onMount(() => {
        if (!autoHeightDisabled && textElement) controlTextareaHeight();
        updateTextCounter();
    });

    function getRealLength(text: string): number {
        if (!text) return 0;
        if (countBytesInsteadOfCharacters) return encodeURI(text).split(/%..|./).length - 1;
        return text.toString().length;
    }

    function updateTextCounter() {
        if (!maxLength) return;
        currentLength = getRealLength(currentValue);
        hasError = maxLength < currentLength;
    }

    function controlTextareaHeight(lastHeight?: number) {
        if (!textElement) return;

        const scrollHeight = textElement.scrollHeight;
        const clientHeight = textElement.clientHeight;

        if (typeof lastHeight === 'undefined' && clientHeight === 0) {
            setTimeout(() => controlTextareaHeight(), 10);
            return;
        }

        if (clientHeight === lastHeight) return;

        if (scrollHeight > clientHeight + 1) {
            const r = textElement.rows;
            if (rowsMax && r >= rowsMax) return;
            textElement.rows = r + 1;
            controlTextareaHeight(clientHeight);
        }

        if (textElement.value.length === 0) textElement.rows = rowsMin;
    }

    function handleInput(event: Event) {
        currentValue = (event.target as HTMLTextAreaElement).value;
        dispatch('change', { name, value: currentValue });
        updateTextCounter();
        if (!autoHeightDisabled) controlTextareaHeight();
    }

    export function fetch(): FieldFetchResult {
        return { [name]: currentValue === '' ? null : currentValue };
    }
</script>

<textarea
    bind:this={textElement}
    {name}
    bind:value={currentValue}
    {rows}
    on:input={handleInput}
    class="form-control"
    class:with-text-length={maxLength}
    class:error={hasError}
></textarea>

{#if maxLength}
    <div class="text-length-counter">
        <span class="current-length" class:error={hasError}>{currentLength}</span>
        <span class="maximum">/{maxLength}</span>
    </div>
{/if}

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
</style>