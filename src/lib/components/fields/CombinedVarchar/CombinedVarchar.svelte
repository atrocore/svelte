<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { onMount, createEventDispatcher } from 'svelte';
    import { loadMeasureData, loadPrefixOptions } from '$lib/helpers/field-data-cache';
    import type { PrefixOption, MeasureUnit } from '$lib/helpers/field-data-cache';
    import CombinedVarcharEdit from './CombinedVarcharEdit/CombinedVarcharEdit.svelte';
    import CombinedVarcharDetail from './CombinedVarcharDetail/CombinedVarcharDetail.svelte';
    import CombinedVarcharList from './CombinedVarcharList/CombinedVarcharList.svelte';
    import RecordLink from '$lib/components/RecordLink/RecordLink.svelte';
    import type { FieldMode, FieldFetchResult } from '$lib/types/ui/field';

    export let name: string = '';
    export let value: string | null = null;
    export let mode: FieldMode = 'detail';
    export let prefixValueId: string | null = null;
    export let prefixWhere: any[] | undefined = undefined;
    export let unitId: string | null = null;
    export let measureId: string | null = null;
    export let entityName: string = '';
    export let entityId: string | null = null;

    const dispatch = createEventDispatcher();

    let editComponent: CombinedVarcharEdit | undefined;

    let unitList: MeasureUnit[] = [];
    let displayFormat: string = '';
    let prefixOptions: PrefixOption[] = [];

    $: prefixLabel = prefixOptions.find(o => o.id === prefixValueId)?.value || '';
    $: unitSymbol = unitList.find(u => u.id === unitId)?.symbol || unitList.find(u => u.id === unitId)?.name || '';
    $: isFormat2 = displayFormat.endsWith('2');

    onMount(async () => {
        if (measureId) {
            loadMeasureData(measureId).then(data => {
                unitList = data.units || [];
                displayFormat = data.displayFormat || '';
            });
        }
        if (prefixWhere !== undefined) {
            loadPrefixOptions(prefixWhere ?? []).then(opts => {
                prefixOptions = opts;
            });
        }
    });

    function handleChange(event: CustomEvent<{ name: string; value: unknown }>) {
        dispatch('change', event.detail);
    }

    export function fetch(): FieldFetchResult {
        if (editComponent) return editComponent.fetch();
        const result: FieldFetchResult = { [name]: value };
        if (measureId !== null) result[name + 'UnitId'] = unitId;
        if (prefixWhere !== undefined) result[name + 'PrefixId'] = prefixValueId;
        return result;
    }
</script>

{#if mode === 'edit'}
    <CombinedVarcharEdit
        bind:this={editComponent}
        {name}
        {value}
        {prefixValueId}
        {prefixOptions}
        {unitId}
        {measureId}
        on:change={handleChange}
    />
{:else if mode === 'detail'}
    <CombinedVarcharDetail {value} {prefixLabel} {unitSymbol} {isFormat2} />
{:else if mode === 'list'}
    <CombinedVarcharList {value} {prefixLabel} {unitSymbol} {isFormat2} />
{:else if mode === 'listLink'}
    <RecordLink {entityName} {entityId}>
        <CombinedVarcharList {value} {prefixLabel} {unitSymbol} {isFormat2} />
    </RecordLink>
{/if}
