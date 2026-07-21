<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import ActionButton from "$lib/components/buttons/ActionButton/ActionButton.svelte";
    import DropdownActionItem from "./DropdownActionItem/DropdownActionItem.svelte";
    import Preloader from "$lib/components/loaders/Preloader/Preloader.svelte";
    import { Language } from "$lib/core/language";
    import type DropdownActionParams from "./types/dropdown-action-params";
    import type ActionButtonParams from "$lib/components/buttons/ActionButton/types/action-button-params";
    import { getToggleClasses } from "./utils/dropdown-button";

    export let params: DropdownActionParams | null = null;
    export let dropdownItems: ActionButtonParams[] = [];
    export let dynamicItems: ActionButtonParams[] = [];
    export let loading: boolean = false;
    export let hasMoreButton: boolean = false;
    export let dropdownPosition: string = 'left';
    export let className: string = '';

    const dispatch = createEventDispatcher();

    $: items = params?.dropdownItems ?? dropdownItems;
    $: hasItems = items.length > 0 || dynamicItems.length > 0;
    $: toggleClasses = params ? getToggleClasses(params, className) : '';
    $: menuClass = params
        ? 'dropdown-menu pull-left filter-list'
        : 'dropdown-menu' + (dropdownPosition === 'right' ? ' dropdown-menu-right' : '');

    function handleExecute(e: CustomEvent) {
        if (params) {
            const el = e.detail.event?.currentTarget as HTMLElement;
            if (el) {
                const dropdown = el.closest('.btn-group');
                if (dropdown) {
                    dropdown.classList.remove('open');
                }
                const menu = el.closest('.dropdown-menu') as HTMLElement;
                if (menu) {
                    menu.style.display = 'none';
                }
            }
        }
        dispatch('execute', e.detail);
    }
</script>

{#if params && !params.hidden}
    <div class="btn-group">
        <ActionButton params={params} {className} on:execute/>

        <button class={toggleClasses} data-toggle="dropdown">
            <i class="ph ph-caret-down"></i>
        </button>

        <ul class={menuClass}>
            {#each items as item}
                <li data-name={item.name}>
                    <DropdownActionItem params={item} on:execute={handleExecute}/>
                </li>
            {/each}
        </ul>
    </div>
{:else if !params && hasItems}
    {#if hasMoreButton}
        <button type="button" class="dropdown-toggle more-button" data-toggle="dropdown" aria-haspopup="true">
            {Language.translate('More')} <i class="ph ph-caret-down"></i>
        </button>
    {:else}
        <button type="button" class="dropdown-toggle" data-toggle="dropdown" aria-haspopup="true">
            <span class="caret"></span>
        </button>
    {/if}

    <ul class={menuClass}>
        {#each items as item}
            <li>
                <DropdownActionItem params={item} on:execute={handleExecute}/>
            </li>
        {/each}

        {#if items.length > 0 && (dynamicItems.length > 0 || loading)}
            <li class="divider"></li>
        {/if}

        {#if loading}
            <li class="preloader"><a href="javascript:">
                <Preloader heightPx={12}/>
            </a></li>
        {/if}

        {#each dynamicItems as item}
            <li class="dynamic-action">
                <DropdownActionItem params={item} on:execute={handleExecute}/>
            </li>
        {/each}
    </ul>
{/if}

<style>
    .more-button i {
        font-size: 14px;
    }
</style>