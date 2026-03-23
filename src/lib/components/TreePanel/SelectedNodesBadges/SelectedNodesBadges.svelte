<script lang="ts">
    export let nodes: Array<{ id: string; name: string; scope: string; link: string; icon?: string | null }> = [];
    export let onRemove: (id: string, link: string) => void = () => {};
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
{/if}

<style>
    .selected-nodes-badges {
        position: sticky;
        z-index: 10;
        bottom: 0;
        background: var(--sidebar-color);
        padding: 6px 8px;
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        border-top: 1px solid #efefef;
    }

    .tree-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        border: 1px solid #efefef;
        border-radius: 12px;
        padding: 2px 6px 2px 8px;
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
    }

    .badge-remove {
        border: none;
        background: none;
        padding: 0;
        cursor: pointer;
        font-size: 11px;
        color: #666;
        line-height: 1;
        flex-shrink: 0;
    }

    .badge-remove:hover {
        color: #333;
    }
</style>