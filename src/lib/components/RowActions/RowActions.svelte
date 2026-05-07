<!--
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 -->

<script lang="ts">
    import { onMount, createEventDispatcher } from 'svelte';
    import { Language } from '$lib/core/language';
    import { Dropdown } from '$lib/dom/dropdown';
    import type RowAction from './types/row-action';

    export let actions: RowAction[] = [];
    export let itemId: string = '';
    export let loadActions: (() => Promise<RowAction[]>) | undefined = undefined;

    const dispatch = createEventDispatcher();

    let toggleEl: HTMLElement;
    let dropdownEl: HTMLElement;

    let dynamicActions: RowAction[] = [];
    let isLoadingDynamic = false;
    let dynamicLoaded = false;

    onMount(() => {
        if (!toggleEl || !dropdownEl) return;

        dropdownEl.style.position = 'fixed';
        const dropdown = Dropdown.create(toggleEl, dropdownEl, {
            placement: 'bottom-end',
            strategy: 'fixed',
            onDropdownShow: () => {
                dropdownEl.parentElement?.classList.add('open');
                dispatch('dropdownShow');
                if (loadActions && !dynamicLoaded && !isLoadingDynamic) {
                    isLoadingDynamic = true;
                    loadActions().then(result => {
                        dynamicActions = result;
                        isLoadingDynamic = false;
                        dynamicLoaded = true;
                    });
                }
            },
            onDropdownHide: () => {
                dropdownEl.parentElement?.classList.remove('open');
                dispatch('dropdownHide');
            },
        });

        return () => {
            dropdown?.destroy();
        }
    });

    function handleAction(e: MouseEvent, action: RowAction): void {
        e.preventDefault();

        const target = e.target as HTMLElement;
        const dropdownParent = target.closest('.dropdown');
        if (dropdownParent) {
            dropdownParent.classList.remove('open');
        }

        dispatch('action', {
            action: action.name,
            itemId,
            event: e
        });
    }

    function dataAttrs(data?: Record<string, string>): Record<string, string> {
        if (!data) return {};
        return Object.fromEntries(Object.entries(data).map(([k, v]) => [`data-${k}`, v]));
    }

    $: visibleActions = actions.filter(a => !a.hidden);
    $: quickActions = visibleActions.filter(a => a.quick && a.icon).slice(0, 2);
    $: hasAnyAction = visibleActions.length > 0;
    $: hasDynamicSection = !!loadActions;
</script>

{#if hasAnyAction}
    <div class="list-row-buttons">
        {#each quickActions as action}
            <a
                href={action.link ?? '/'}
                class="action quick-action"
                data-action={action.name}
                title={Language.translate(action.label ?? '')}
                class:disabled={action.disabled}
                {...dataAttrs(action.data)}
                on:click={(e) => handleAction(e, action)}
            >
                <i class={action.icon}></i>
            </a>
        {/each}
        <div class="dropdown">
            <button class="dropdown-toggle" bind:this={toggleEl} data-toggle="dropdown">
                <i class="ph ph-dots-three-vertical"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-right" bind:this={dropdownEl}>
                {#each visibleActions as action}
                    <li class:disabled={action.disabled}>
                        <a
                            href={action.link ?? '/'}
                            class="action"
                            data-action={action.name}
                            class:disabled={action.disabled}
                            {...dataAttrs(action.data)}
                            on:click={(e) => handleAction(e, action)}
                        >
                            {#if action.html}
                                {@html action.html}
                            {:else}
                                {#if action.icon}
                                    <i class={action.icon}></i>
                                {/if}
                                {Language.translate(action.label ?? '')}
                            {/if}
                        </a>
                    </li>
                {/each}
                {#if hasDynamicSection}
                    {#if isLoadingDynamic}
                        <li class="divider"></li>
                        <li class="preloader">
                            <a href="javascript:">
                                <img style="height:12px;margin-top:5px" src="client/img/atro-loader.svg" alt="">
                            </a>
                        </li>
                    {:else if dynamicLoaded && dynamicActions.length > 0}
                        <li class="divider"></li>
                        {#each dynamicActions as action}
                            <li>
                                <a
                                    href={action.link ?? '/'}
                                    class="action"
                                    data-action={action.name}
                                    {...dataAttrs(action.data)}
                                    on:click={(e) => handleAction(e, action)}
                                >
                                    {Language.translate(action.label ?? '')}
                                </a>
                            </li>
                        {/each}
                    {/if}
                {/if}
            </ul>
        </div>
    </div>
{/if}

<style>
    .list-row-buttons {
        display: flex;
        align-items: center;
        gap: 2px;
    }

    .list-row-buttons .dropdown {
        position: relative;
    }

    .list-row-buttons :global(.dropdown-menu) {
        position: absolute;
        right: 0;
        top: 100%;
        z-index: 1000;
        min-width: 160px;
    }

    .dropdown-toggle {
        background: none;
        border: none;
        cursor: pointer;
        padding: 2px 5px;
    }

    .quick-action {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: none;
        border: none;
        cursor: pointer;
        padding: 2px 5px;
        color: inherit;
        opacity: 0.6;
    }

    .quick-action:hover {
        opacity: 1;
    }

    .quick-action.disabled {
        opacity: 0.3;
        pointer-events: none;
    }

    li.disabled a {
        opacity: 0.5;
        pointer-events: none;
    }

    a i {
        margin-inline-end: 5px;
        font-size: 16px;
    }

    .quick-action i {
        margin-right: 0;
    }
</style>
