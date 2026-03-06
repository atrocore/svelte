<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { onMount } from 'svelte';
    import { sanitizeHtml } from '../utils/sanitize';
    import { renderMarkdown } from '$lib/components/fields/Markdown/utils/render-markdown';
    import { Language } from '$lib/core/language';
    import { truncate } from '$lib/components/fields/Text/utils/truncate';

    export let value: string | null = null;
    export let isPlain: boolean = false;
    export let detailMaxHeight: number = 400;
    export let seeMoreDisabled: boolean = false;
    export let detailMaxLength: number = 400;
    export let detailMaxNewLineCount: number = 10;

    let htmlContainerEl: HTMLDivElement;
    let showMore = false;
    let expanded = false;

    $: sanitized = sanitizeHtml(value);

    $: ({ text: displayedText } = !seeMoreDisabled && isPlain && value
        ? truncate(value, detailMaxLength, detailMaxNewLineCount)
        : { text: value || '' });

    onMount(() => {
        if (isPlain || seeMoreDisabled) return;
        requestAnimationFrame(() => {
            if (htmlContainerEl && htmlContainerEl.offsetHeight > detailMaxHeight) {
                showMore = true;
            }
        });
    });
</script>

{#if value}
    {#if isPlain}
        <div class="plain complex-text">{@html renderMarkdown(displayedText)}</div>
    {:else}
        <div
            bind:this={htmlContainerEl}
            class="html-container"
            style={showMore && !expanded ? `max-height: ${detailMaxHeight}px; overflow: hidden; margin-bottom: 10px;` : ''}
        >{@html sanitized}</div>
        {#if showMore && !expanded}
            <!-- svelte-ignore a11y-invalid-attribute -->
            <a href="javascript:" on:click={() => (expanded = true)}>{Language.translate('See more') || 'See more'}</a>
        {/if}
    {/if}
{/if}
