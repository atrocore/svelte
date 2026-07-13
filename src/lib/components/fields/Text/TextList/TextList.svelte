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

    export let value: string | null = null;
    export let detailMaxLength: number = 400;
    export let detailMaxNewLineCount: number = 10;
    export let seeMoreDisabled: boolean = false;

    $: isNull = value === null || value === undefined;
    $: isNotEmpty = !isNull && value !== '';
    $: ({ text: displayedText } = seeMoreDisabled
        ? { text: value ?? '' }
        : truncate(value ?? '', detailMaxLength, detailMaxNewLineCount));
</script>

{#if isNotEmpty}
    <span>{@html breaklines(displayedText)}</span>
{:else if isNull}
    <span class="text-gray">{Language.translate('Null')}</span>
{:else}
    <span class="pre-label"></span>
{/if}