<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { selectize } from '$lib/dom/selectize';

    export let name: string;
    export let value: string | null = null;
    export let options: Array<{ id: string; label: string }> = [];
    export let wrapperClass: string = '';

    const dispatch = createEventDispatcher<{ change: string | null }>();

    $: selectOptions = options.map(opt => ({ value: opt.id, text: opt.label }));
</script>

<div class="part-select {wrapperClass}">
    <select {name} class="form-control"
            use:selectize={{ options: selectOptions, value, clearable: true, onChange: val => dispatch('change', val || null) }}></select>
</div>
