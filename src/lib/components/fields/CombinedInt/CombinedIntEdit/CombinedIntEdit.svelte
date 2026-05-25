<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { onMount, createEventDispatcher } from 'svelte';
    import { loadExtensibleEnumOptions, loadMeasureData } from '$lib/helpers/field-data-cache';
    import type { ExtensibleEnumOption, MeasureUnit } from '$lib/helpers/field-data-cache';
    import type { FieldFetchResult } from '$lib/types/ui/field';
    import PartSelect from '$lib/components/fields/PartSelect/PartSelect.svelte';
    import IntEdit from '$lib/components/fields/Int/IntEdit/IntEdit.svelte';

    export let name: string = '';
    export let value: number | null = null;
    export let prefixValueId: string | null = null;
    export let prefixExtensibleEnumId: string | null = null;
    export let unitId: string | null = null;
    export let measureId: string | null = null;

    const dispatch = createEventDispatcher();

    // These are never referenced in the template — updating them never triggers a re-render.
    let currentValue: number | null = value;
    let currentUnitId: string | null = unitId;
    let currentPrefixValueId: string | null = prefixValueId;

    let prefixOptions: ExtensibleEnumOption[] = [];
    let unitList: MeasureUnit[] = [];

    $: hasGroup = !!prefixExtensibleEnumId || !!measureId;

    onMount(async () => {
        const promises: Promise<void>[] = [];
        if (prefixExtensibleEnumId) {
            promises.push(
                loadExtensibleEnumOptions(prefixExtensibleEnumId).then(opts => { prefixOptions = opts; })
            );
        }
        if (measureId) {
            promises.push(
                loadMeasureData(measureId).then(data => { unitList = data.units || []; })
            );
        }
        await Promise.all(promises);
    });

    function handleValueChange(val: number | null) {
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
        if (prefixExtensibleEnumId !== null) result[name + 'PrefixId'] = currentPrefixValueId;
        return result;
    }
</script>

{#if hasGroup}
    <div class="input-group combined-group">
        {#if prefixExtensibleEnumId}
            <PartSelect
                name="{name}PrefixId"
                value={prefixValueId}
                options={prefixOptions.map(o => ({ id: o.id, label: o.preparedName || o.name }))}
                wrapperClass="prefix-select"
                on:change={e => handlePrefixChange(e.detail)}
            />
        {/if}
        <IntEdit
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
    <IntEdit
        name={name}
        {value}
        inputClass="main-element form-control"
        on:change={e => handleValueChange(e.detail)}
    />
{/if}
