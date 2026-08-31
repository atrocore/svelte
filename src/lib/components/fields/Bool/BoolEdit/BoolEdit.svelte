<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { onMount, onDestroy, tick } from 'svelte';
    import { createEventDispatcher } from 'svelte';
    import { Language } from '$lib/core/language';
    import type { FieldFetchResult } from '$lib/types/ui/field';

    export let name: string = '';
    export let value: boolean | null = null;
    export let notNull: boolean = true;

    const dispatch = createEventDispatcher();

    let selectEl: HTMLSelectElement;
    let selectizeInstance: any = null;
    let syncing = false;

    $: currentValue = value;
    $: isNull = currentValue === null || currentValue === undefined;
    $: selectValue = isNull ? 'null' : String(currentValue);

    function handleCheckboxChange(event: Event) {
        currentValue = (event.target as HTMLInputElement).checked;
        dispatch('change', { name, value: currentValue });
    }

    function initSelectize(): void {
        const $ = (window as any).$;
        if (!$ || typeof $.fn?.selectize !== 'function' || !selectEl) return;

        $(selectEl).selectize({
            valueField: 'value',
            labelField: 'text',
            searchField: ['text'],
            onChange: (val: string) => {
                if (syncing || !val) return;
                currentValue = val === 'null' ? null : val === 'true';
                dispatch('change', { name, value: currentValue });
            },
        });

        selectizeInstance = (selectEl as any).selectize;
    }

    onMount(() => {
        if (!notNull) {
            tick().then(initSelectize);
        }
    });

    onDestroy(() => {
        if (selectizeInstance) {
            selectizeInstance.destroy();
            selectizeInstance = null;
        }
    });

    $: if (selectizeInstance && selectizeInstance.getValue() !== selectValue) {
        syncing = true;
        selectizeInstance.setValue(selectValue, true);
        syncing = false;
    }

    export function fetch(): FieldFetchResult {
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
        bind:this={selectEl}
        {name}
        class="form-control main-element"
    >
        <option value="null" selected={selectValue === 'null'}>NULL</option>
        <option value="false" selected={selectValue === 'false'}>{Language.translate('No')}</option>
        <option value="true" selected={selectValue === 'true'}>{Language.translate('Yes')}</option>
    </select>
{/if}
