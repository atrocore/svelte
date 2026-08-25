<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import Pagination from "$lib/components/Pagination/Pagination.svelte";
    import ToolbarControl from "./ToolbarControl/ToolbarControl.svelte";
    import type ToolbarControlDef from "./types/toolbar-control";

    export let currentPage: number = 1;
    export let totalPages: number = 1;
    export let onPageChange: (page: number) => void = () => {
    };

    export let controls: ToolbarControlDef[] = [];
</script>

<div class="pagination-toolbar">
    <div class="pagination-container">
        <Pagination {currentPage} {totalPages} {onPageChange} />
    </div>
    {#if controls.length}
        <div class="controls">
            {#each controls as control (control.key)}
                <ToolbarControl iconClass={control.iconClass} iconTitle={control.iconTitle} iconClickable={!!control.iconClickable}
                                onIconClick={control.onIconClick} value={control.value} options={control.options}
                                onSelect={control.onSelect} />
            {/each}
        </div>
    {/if}
</div>

<style>
    :global(.list-pagination-container) {
        position: sticky;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 10;
        background-color: #fafafa;
        padding: 10px 20px;
        border-top: 1px solid var(--primary-border-color);
        box-shadow: 0 -2px 8px rgba(0,0,0,0.04);
    }

    .pagination-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 10px;
        min-height: 32px;
    }

    .controls {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 15px;
    }

    @media screen and (max-width: 768px) {
        .pagination-toolbar {
            justify-content: center;
        }

        .pagination-container {
            display: flex;
        }

        .pagination-container,
        .controls {
            flex-basis: 100%;
            justify-content: center;
        }
    }
</style>
