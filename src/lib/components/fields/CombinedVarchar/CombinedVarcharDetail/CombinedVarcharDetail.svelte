<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    export let value: string | null = null;
    export let prefixLabel: string = '';
    export let unitSymbol: string = '';
    export let isFormat2: boolean = false;

    $: isEmpty = value === null || value === undefined || value === '';
</script>

{#if !isEmpty}
    {#if prefixLabel}{prefixLabel}&nbsp;{/if}{#if isFormat2}{unitSymbol}{/if}{value}{#if !isFormat2 && unitSymbol}&nbsp;{unitSymbol}{/if}
{:else}
    <span class="pre-label"> </span>
{/if}
