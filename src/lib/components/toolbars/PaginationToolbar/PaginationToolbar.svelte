<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import Pagination from "$lib/components/Pagination/Pagination.svelte";
    import ShowMoreButton from "$lib/components/ShowMoreButton/ShowMoreButton.svelte";
    import ToolbarControl from "./ToolbarControl/ToolbarControl.svelte";
    import type ToolbarControlDef from "./types/toolbar-control";

    export let currentPage: number = 1;
    export let totalPages: number = 1;
    export let onPageChange: (page: number) => void = () => {
    };

    export let showMoreVisible: boolean = false;
    export let showMoreLabel: string = 'Show more';
    export let showMoreLoading: boolean = false;
    export let onShowMore: () => void = () => {
    };

    export let controls: ToolbarControlDef[] = [];
</script>

<div class="pagination-toolbar">
    <div class="pagination-toolbar__pagination">
        <Pagination {currentPage} {totalPages} {onPageChange} />
    </div>
    <div class="pagination-toolbar__show-more">
<!--        <ShowMoreButton visible={showMoreVisible} label={showMoreLabel} loading={showMoreLoading} onClick={onShowMore} />-->
    </div>
    {#if controls.length}
        <div class="pagination-toolbar__controls">
            {#each controls as control (control.key)}
                <ToolbarControl iconClass={control.iconClass} iconTitle={control.iconTitle} iconClickable={!!control.iconClickable}
                                onIconClick={control.onIconClick} value={control.value} options={control.options}
                                onSelect={control.onSelect} />
            {/each}
        </div>
    {/if}
</div>

<style>
    :global(#main main > .list-pagination-container) {
        position: sticky;
        bottom: 0;
        left: 0;
        right: 0;
        top: auto;
        z-index: 10;
        flex-shrink: 0;
        background-color: #fafafa;
        padding: 10px 20px;
        border-top: 1px solid var(--primary-border-color);
        box-shadow: 0 -2px 8px rgba(0,0,0,0.04);
    }

    .pagination-toolbar {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        min-height: 32px;
    }

    .pagination-toolbar__show-more {
        justify-self: center;
    }

    .pagination-toolbar__controls {
        justify-self: end;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 15px;
    }
</style>
