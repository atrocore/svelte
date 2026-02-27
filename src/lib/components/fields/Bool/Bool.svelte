<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script>
    import { createEventDispatcher } from 'svelte';
    import { Language } from '$lib/core/language';

    export let name = '';
    export let value = null;
    export let mode = 'detail';
    export let notNull = true;
    export let scope = '';
    export let params = {};

    const dispatch = createEventDispatcher();

    // Internal mutable state — replaces backbone model as source of truth.
    // Syncs with the `value` prop whenever it changes from outside (e.g. parent or proxy $set).
    let currentValue = value;
    $: currentValue = value;

    $: valueIsSet = value !== null && value !== undefined;
    $: isNull = currentValue === null || currentValue === undefined;
    $: selectValue = isNull ? 'null' : String(currentValue);

    function handleCheckboxChange(event) {
        currentValue = event.target.checked;
        dispatch('change', { name, value: currentValue });
    }

    function handleSelectChange(event) {
        const val = event.target.value;
        currentValue = val === 'null' ? null : val === 'true';
        dispatch('change', { name, value: currentValue });
    }

    export function fetch() {
        return { [name]: currentValue };
    }
</script>

{#if mode === 'list' || mode === 'detail'}
    {#if !valueIsSet}
        ...
    {:else if isNull}
        <span class="text-gray">{Language.translate('Null')}</span>
    {:else}
        <input type="checkbox" checked={!!currentValue} disabled />
    {/if}
{:else if mode === 'edit' || mode === 'search'}
    {#if notNull}
        <input
            type="checkbox"
            {name}
            checked={!!currentValue}
            class="main-element"
            on:change={handleCheckboxChange}
        />
    {:else}
        <select
            {name}
            class="form-control main-element"
            on:change={handleSelectChange}
        >
            <option value="null" selected={selectValue === 'null'}>NULL</option>
            <option value="false" selected={selectValue === 'false'}>{Language.translate('No')}</option>
            <option value="true" selected={selectValue === 'true'}>{Language.translate('Yes')}</option>
        </select>
    {/if}
{/if}