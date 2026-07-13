<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { Language } from '$lib/core/language';
    import { breaklines } from '../utils/breaklines';
    import { truncate } from '../utils/truncate';

    export let name: string = '';
    export let value: string | null = null;
    export let rows: number = 2;
    export let useDisabledTextareaInViewMode: boolean = false;
    export let seeMoreDisabled: boolean = false;
    export let detailMaxLength: number = 400;
    export let detailMaxNewLineCount: number = 10;

    let seeMoreText = false;

    $: isNull = value === null || value === undefined;
    $: isNotEmpty = !isNull && value !== '';
    $: canTruncate = !seeMoreText && !seeMoreDisabled;
    $: ({ text: displayedText, isCut } = canTruncate
        ? truncate(value ?? '', detailMaxLength, detailMaxNewLineCount)
        : { text: value ?? '', isCut: false });

    function handleSeeMore() {
        seeMoreText = true;
    }
</script>

{#if useDisabledTextareaInViewMode}
    <textarea {name} value={displayedText} {rows} disabled class="form-control"></textarea>
{:else if isNotEmpty}
    <!-- svelte-ignore a11y-invalid-attribute -->
    <span>{@html breaklines(displayedText)}</span>
    {#if isCut}
        <a href="javascript:" on:click={handleSeeMore}>
            {Language.translate('See more') || 'See more'}
        </a>
    {/if}
{:else if isNull}
    <span class="text-gray">{Language.translate('Null')}</span>
{:else}
    <span class="pre-label"></span>
{/if}

<style>
    textarea {
        width: 100%;
        resize: vertical;
    }
</style>