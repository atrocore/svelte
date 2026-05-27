<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { getLocaleSettings } from '$lib/helpers/locale';
    import { formatFloatForEdit, parseFloatValue } from '../utils/float-utils';

    export let name: string = '';
    export let value: number | null = null;
    export let inputClass: string = 'form-control';

    const dispatch = createEventDispatcher<{ change: number | null }>();
    const { thousandSeparator, decimalMark } = getLocaleSettings();

    let displayValue = formatFloatForEdit(value, decimalMark);

    function handleInput(e: Event) {
        displayValue = (e.target as HTMLInputElement).value;
        dispatch('change', parseFloatValue(displayValue, thousandSeparator, decimalMark));
    }
</script>

<input
    type="text"
    {name}
    class={inputClass}
    value={displayValue}
    on:input={handleInput}
    autocomplete="off"
/>
