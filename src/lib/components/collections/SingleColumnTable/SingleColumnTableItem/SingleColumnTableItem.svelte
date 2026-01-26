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
    import ItemActions from '$lib/components/collections/ItemActions/ItemActions.svelte';
    import type ItemAction from '$lib/components/collections/ItemActions/types/item-action';

    export let itemId: string = '';
    export let actions: ItemAction[] = [];
    export let className: string = '';

    const dispatch = createEventDispatcher();

    function handleAction(e: CustomEvent): void {
        dispatch('action', e.detail);
    }
</script>

<li class="list-item {className}">
    <div class="item-content">
        <slot></slot>
    </div>
    <slot name="actions">
        {#if actions.length > 0}
            <ItemActions {actions} {itemId} on:action={handleAction}/>
        {/if}
    </slot>
</li>

<style>
    .list-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 20px;
        border-top: 1px solid var(--border-color, #ddd);
        border-bottom: 1px solid var(--border-color, #ddd);
        margin-top: -1px;
    }

    .list-item:first-child {
        margin-top: 0;
    }

    .item-content {
        flex: 1;
        min-width: 0;
    }

    .item-content :global(a),
    .item-content :global(span) {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        display: block;
    }
</style>
