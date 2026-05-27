<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { onMount, createEventDispatcher } from 'svelte';
    import { loadMeasureData } from '$lib/helpers/field-data-cache';
    import type { PrefixOption, MeasureUnit } from '$lib/helpers/field-data-cache';
    import type { FieldFetchResult } from '$lib/types/ui/field';
    import PartSelect from '$lib/components/fields/PartSelect/PartSelect.svelte';
    import VarcharEdit from '$lib/components/fields/Varchar/VarcharEdit/VarcharEdit.svelte';

    export let name: string = '';
    export let value: string | null = null;
    export let prefixValueId: string | null = null;
    export let prefixOptions: PrefixOption[] = [];
    export let unitId: string | null = null;
    export let measureId: string | null = null;

    const dispatch = createEventDispatcher();

    // These are never referenced in the template — updating them never triggers a re-render.
    let currentValue: string | null = value;
    let currentUnitId: string | null = unitId;
    let currentPrefixValueId: string | null = prefixValueId;

    let unitList: MeasureUnit[] = [];

    $: hasGroup = !!(prefixOptions && prefixOptions.length > 0) || !!measureId;

    onMount(async () => {
        if (measureId) {
            loadMeasureData(measureId).then(data => { unitList = data.units || []; });
        }
    });

    function handleValueChange(val: string | null) {
        currentValue = val;
        dispatch('change', { name, value: currentValue });
    }

    function handleUnitChange(val: string | null) {
        currentUnitId = val;
        dispatch('change', { name: name + 'UnitId', value: currentUnitId });
    }

    function handlePrefixChange(val: string | null) {
        currentPrefixValueId = val;
        dispatch('change', { name: name + 'PrefixId', value: currentPrefixValueId });
    }

    export function fetch(): FieldFetchResult {
        const result: FieldFetchResult = { [name]: currentValue };
        if (measureId !== null) result[name + 'UnitId'] = currentUnitId;
        if (prefixOptions.length > 0 || currentPrefixValueId !== null) result[name + 'PrefixId'] = currentPrefixValueId;
        return result;
    }
</script>

{#if hasGroup}
    <div class="input-group combined-group">
        {#if prefixOptions && prefixOptions.length > 0}
            <PartSelect
                name="{name}PrefixId"
                value={prefixValueId}
                options={prefixOptions.map(o => ({ id: o.id, label: o.value }))}
                wrapperClass="prefix-select"
                on:change={e => handlePrefixChange(e.detail)}
            />
        {/if}
        <VarcharEdit
            name={name}
            {value}
            inputClass="unit-input form-control"
            on:change={e => handleValueChange(e.detail)}
        />
        {#if measureId}
            <PartSelect
                name="{name}UnitId"
                value={unitId}
                options={unitList.map(u => ({ id: u.id, label: u.symbol || u.name }))}
                wrapperClass="unit-select"
                on:change={e => handleUnitChange(e.detail)}
            />
        {/if}
    </div>
{:else}
    <VarcharEdit
        name={name}
        {value}
        inputClass="main-element form-control"
        on:change={e => handleValueChange(e.detail)}
    />
{/if}
