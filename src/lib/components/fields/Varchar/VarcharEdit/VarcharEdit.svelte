<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    export let name: string = '';
    export let value: string | null = null;
    export let inputClass: string = 'form-control';

    const dispatch = createEventDispatcher<{ change: string | null }>();

    let displayValue = value ?? '';

    function handleInput(e: Event) {
        displayValue = (e.target as HTMLInputElement).value;
        dispatch('change', displayValue || null);
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
