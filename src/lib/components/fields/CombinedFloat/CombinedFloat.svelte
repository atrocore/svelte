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
    import CombinedFloatEdit from './CombinedFloatEdit/CombinedFloatEdit.svelte';
    import CombinedFloatDetail from './CombinedFloatDetail/CombinedFloatDetail.svelte';
    import CombinedFloatList from './CombinedFloatList/CombinedFloatList.svelte';
    import RecordLink from '$lib/components/RecordLink/RecordLink.svelte';
    import type { FieldMode, FieldFetchResult } from '$lib/types/ui/field';

    export let name: string = '';
    export let value: number | null = null;
    export let mode: FieldMode = 'detail';
    export let prefixValueId: string | null = null;
    export let prefixExtensibleEnumId: string | null = null;
    export let unitId: string | null = null;
    export let measureId: string | null = null;
    export let decimalPlaces: number | null = null;
    export let entityName: string = '';
    export let entityId: string | null = null;

    const dispatch = createEventDispatcher();

    let editComponent: CombinedFloatEdit | undefined;

    let prefixOptions: ExtensibleEnumOption[] = [];
    let unitList: MeasureUnit[] = [];
    let displayFormat: string = '';

    $: prefixLabel = prefixOptions.find(o => o.id === prefixValueId)?.preparedName
        || prefixOptions.find(o => o.id === prefixValueId)?.name
        || '';
    $: unitSymbol = unitList.find(u => u.id === unitId)?.symbol || unitList.find(u => u.id === unitId)?.name || '';
    $: isFormat2 = displayFormat.endsWith('2');

    onMount(async () => {
        const promises: Promise<void>[] = [];
        if (prefixExtensibleEnumId) {
            promises.push(
                loadExtensibleEnumOptions(prefixExtensibleEnumId).then(opts => { prefixOptions = opts; })
            );
        }
        if (measureId) {
            promises.push(
                loadMeasureData(measureId).then(data => {
                    unitList = data.units || [];
                    displayFormat = data.displayFormat || '';
                })
            );
        }
        await Promise.all(promises);
    });

    function handleChange(event: CustomEvent<{ name: string; value: unknown }>) {
        dispatch('change', event.detail);
    }

    export function fetch(): FieldFetchResult {
        if (editComponent) return editComponent.fetch();
        const result: FieldFetchResult = { [name]: value };
        if (measureId !== null) result[name + 'UnitId'] = unitId;
        if (prefixExtensibleEnumId !== null) result[name + 'PrefixId'] = prefixValueId;
        return result;
    }
</script>

{#if mode === 'edit'}
    <CombinedFloatEdit
        bind:this={editComponent}
        {name}
        {value}
        {prefixValueId}
        {prefixExtensibleEnumId}
        {unitId}
        {measureId}
        on:change={handleChange}
    />
{:else if mode === 'detail'}
    <CombinedFloatDetail {value} {prefixLabel} {unitSymbol} {isFormat2} {decimalPlaces} />
{:else if mode === 'list'}
    <CombinedFloatList {value} {prefixLabel} {unitSymbol} {isFormat2} {decimalPlaces} />
{:else if mode === 'listLink'}
    <RecordLink {entityName} {entityId}>
        <CombinedFloatList {value} {prefixLabel} {unitSymbol} {isFormat2} {decimalPlaces} />
    </RecordLink>
{/if}
