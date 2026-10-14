<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { Language } from '$lib/core/language';
    import { selectize } from '$lib/dom/selectize';
    import type { FieldFetchResult } from '$lib/types/ui/field';

    export let name: string = '';
    export let value: boolean | null = null;
    export let notNull: boolean = true;

    const dispatch = createEventDispatcher();

    $: currentValue = value;
    $: isNull = currentValue === null || currentValue === undefined;
    $: selectValue = isNull ? 'null' : String(currentValue);

    const selectOptions = [
        { value: 'null', text: 'NULL' },
        { value: 'false', text: Language.translate('No') },
        { value: 'true', text: Language.translate('Yes') }
    ];

    function handleCheckboxChange(event: Event) {
        currentValue = (event.target as HTMLInputElement).checked;
        dispatch('change', { name, value: currentValue });
    }

    function handleSelectChange(val: string): void {
        currentValue = val === 'null' ? null : val === 'true';
        dispatch('change', { name, value: currentValue });
    }

    export function fetch(): FieldFetchResult {
        if (notNull && isNull) return {[name]: false};
        return { [name]: currentValue };
    }
</script>

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
        use:selectize={{ options: selectOptions, value: selectValue, onChange: handleSelectChange }}
    ></select>
{/if}
