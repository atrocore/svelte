<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { getLocaleSettings } from '$lib/helpers/locale';
    import { formatFloatForDisplay } from '$lib/components/fields/Float/utils/float-utils';

    export let value: number | null = null;
    export let prefixLabel: string = '';
    export let unitSymbol: string = '';
    export let isFormat2: boolean = false;
    export let decimalPlaces: number | null = null;

    const { thousandSeparator, decimalMark } = getLocaleSettings();

    $: isEmpty = value === null || value === undefined;
    $: displayValue = formatFloatForDisplay(value, thousandSeparator, decimalMark, decimalPlaces);
    $: displayText = (prefixLabel ? prefixLabel + ' ' : '') + (isFormat2 ? unitSymbol : '') + displayValue + (!isFormat2 && unitSymbol ? ' ' + unitSymbol : '');
</script>

{#if !isEmpty}
    <div><span title="{displayText}">{displayText}</span></div>
{:else}
    <span class="pre-label"> </span>
{/if}
