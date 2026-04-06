<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import BoolDetail from './BoolDetail/BoolDetail.svelte';
    import BoolEdit from './BoolEdit/BoolEdit.svelte';
    import type { FieldMode, FieldFetchResult } from '$lib/types/ui/field';

    export let name: string = '';
    export let value: boolean | null = null;
    export let valueIsSet: boolean = true;
    export let mode: FieldMode = 'detail';
    export let notNull: boolean = true;

    const dispatch = createEventDispatcher();

    let editComponent: BoolEdit | undefined;

    function handleChange(event: CustomEvent<{ name: string; value: boolean | null }>) {
        dispatch('change', event.detail);
    }

    export function fetch(): FieldFetchResult {
        if (editComponent) return editComponent.fetch();
        return { [name]: value };
    }
</script>

{#if mode === 'detail' || mode === 'list'}
    <BoolDetail {value} {valueIsSet}/>
{:else if mode === 'edit' || mode === 'search'}
    <BoolEdit
        bind:this={editComponent}
        {name}
        {value}
        {notNull}
        on:change={handleChange}
    />
{/if}
