<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script>
    import { Language } from '$lib/core/language';

    export let name = '';
    export let searchType = 'startsWith';
    export let searchValue = '';
    export let maxLength = null;

    const searchTypeList = ['contains', 'startsWith', 'equals', 'endsWith', 'like', 'notContains', 'notLike', 'isEmpty', 'isNotEmpty'];

    $: hideInput = searchType === 'isEmpty' || searchType === 'isNotEmpty';

    function handleTypeChange(event) {
        searchType = event.target.value;
    }

    function handleValueInput(event) {
        searchValue = event.target.value;
    }

    export function fetchSearch() {
        if (searchType === 'isEmpty') {
            return {
                type: 'or',
                value: [
                    { type: 'isNull', field: name },
                    { type: 'equals', field: name, value: '' }
                ],
                data: { type: searchType }
            };
        }
        if (searchType === 'isNotEmpty') {
            return {
                type: 'and',
                value: [
                    { type: 'notEquals', field: name, value: '' },
                    { type: 'isNotNull', field: name, value: null }
                ],
                data: { type: searchType }
            };
        }
        const trimmed = (searchValue || '').trim();
        if (trimmed) return { value: trimmed, type: searchType };
        return false;
    }
</script>

<select
    class="form-control search-type input-sm"
    name="{name}-type"
    value={searchType}
    on:change={handleTypeChange}
>
    {#each searchTypeList as type}
        <option value={type} selected={searchType === type}>
            {Language.translateOption(type, 'varcharSearchRanges') || type}
        </option>
    {/each}
</select>

<input
    type="text"
    class="main-element form-control input-sm"
    {name}
    value={searchValue}
    class:hidden={hideInput}
    autocomplete="off"
    placeholder={Language.translate('Value') || 'Value'}
    maxlength={maxLength || undefined}
    on:input={handleValueInput}
/>

<style>
    .hidden {
        display: none;
    }
</style>