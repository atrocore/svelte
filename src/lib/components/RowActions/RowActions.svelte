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
    import { createEventDispatcher } from 'svelte';
    import { Language } from '$lib/core/language';
    import type RowAction from './types/row-action';

    export let actions: RowAction[] = [];
    export let itemId: string = '';

    const dispatch = createEventDispatcher();

    function handleAction(e: MouseEvent, action: RowAction): void {
        e.preventDefault();
        e.stopPropagation();

        // Close the dropdown
        const target = e.target as HTMLElement;
        const dropdown = target.closest('.dropdown');
        if (dropdown) {
            dropdown.classList.remove('open');
        }

        dispatch('action', {
            action: action.name,
            itemId,
            event: e
        });
    }

    $: visibleActions = actions.filter(a => !a.hidden);
</script>

{#if visibleActions.length > 0}
    <div class="row-actions">
        <div class="dropdown">
            <button class="dropdown-toggle" data-toggle="dropdown">
                <i class="ph ph-dots-three-vertical"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-right">
                {#each visibleActions as action}
                    <li class:disabled={action.disabled}>
                        <a
                                href="/"
                                on:click={(e) => handleAction(e, action)}
                                class:disabled={action.disabled}
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
            </ul>
        </div>
    </div>
{/if}

<style>
    .row-actions {
        margin-left: 10px;
    }

    .row-actions .dropdown {
        position: relative;
    }

    .row-actions :global(.dropdown-menu) {
        position: absolute;
        right: 0;
        top: 100%;
        z-index: 1000;
        min-width: 100px;
    }

    .dropdown-toggle {
        background: none;
        border: none;
        cursor: pointer;
        padding: 2px 5px;
    }

    li.disabled a {
        opacity: 0.5;
        pointer-events: none;
    }

    a i {
        margin-right: 5px;
    }
</style>
