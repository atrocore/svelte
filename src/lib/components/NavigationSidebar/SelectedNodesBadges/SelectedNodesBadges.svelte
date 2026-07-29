<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import type { SelectedNode } from '../types/selected-node';
    import { Language } from '$lib/core/language';

    export let nodes: SelectedNode[] = [];
    export let onRemove: (id: string, link: string) => void = () => {};
    export let onUnsetAll: () => void = () => {};
</script>

{#if nodes.length > 0}
    <div class="selected-nodes-badges">
        {#each nodes as node (node.id + '|' + node.link)}
            <span class="tree-badge">
                {#if node.icon}
                    <img src={node.icon} alt="" class="badge-icon">
                {/if}
                <span class="badge-name" title={node.name}>{node.name}</span>
                <button class="badge-remove ph ph-x" on:click={() => onRemove(node.id, node.link)}></button>
            </span>
        {/each}
    </div>
    <button class="secondary unset-all" on:click={onUnsetAll}>{Language.translate('Unset All')}</button>
{/if}

<style>
    .selected-nodes-badges {
        position: sticky;
        bottom: 0;
        z-index: 10;
        background: var(--sidebar-color);
        padding: 10px 0 0;
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        border-top: 1px solid #efefef;
    }

    .tree-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        border: 1px solid #efefef;
        border-radius: 12px;
        padding: 3px 6px 3px 8px;
        font-size: 12px;
        max-width: 180px;
    }

    .badge-icon {
        width: 14px;
        height: 14px;
        flex-shrink: 0;
    }

    .badge-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        line-height: 1;
    }

    .badge-remove {
        border: none;
        background: none;
        padding: 0;
        cursor: pointer;
        font-size: 12px;
        color: #666;
        line-height: 1;
        flex-shrink: 0;
    }

    .badge-remove:hover {
        color: #333;
    }

    .unset-all {
        margin-top: 10px;
        width: 100%;
        font-size: 12px;
        padding-top: 2px;
        padding-bottom: 2px;
        border-radius: 12px;
    }
</style>