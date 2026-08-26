<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    export let currentPage: number = 1;
    export let totalPages: number = 1;
    export let siblingCount: number = 1;
    export let boundaryCount: number = 1;
    export let onPageChange: (page: number) => void = () => {
    };

    function getPageItems(current: number, total: number, siblings: number, boundary: number): (number | 'left-ellipsis' | 'right-ellipsis')[] {
        if (total <= boundary * 2 + siblings * 2 + 3) {
            return Array.from({length: total}, (_, i) => i + 1);
        }

        let leftSiblingIndex = Math.max(current - siblings, boundary + 1);
        let rightSiblingIndex = Math.min(current + siblings, total - boundary);

        // a gap of exactly one hidden page isn't worth an ellipsis — show that page instead
        if (leftSiblingIndex - (boundary + 1) === 1) {
            leftSiblingIndex -= 1;
        }
        if ((total - boundary) - rightSiblingIndex === 1) {
            rightSiblingIndex += 1;
        }

        const items: (number | 'left-ellipsis' | 'right-ellipsis')[] = [];

        for (let i = 1; i <= boundary; i++) {
            items.push(i);
        }

        if (leftSiblingIndex > boundary + 1) {
            items.push('left-ellipsis');
        }

        for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
            items.push(i);
        }

        if (rightSiblingIndex < total - boundary) {
            items.push('right-ellipsis');
        }

        for (let i = total - boundary + 1; i <= total; i++) {
            items.push(i);
        }

        return items;
    }

    function goTo(page: number): void {
        if (page < 1 || page > totalPages || page === currentPage) {
            return;
        }
        onPageChange(page);
    }

    $: items = getPageItems(currentPage, totalPages, siblingCount, boundaryCount);

    let pageInputEl: HTMLInputElement;
    let pageInputValue = String(currentPage);

    $: if (document.activeElement !== pageInputEl) {
        pageInputValue = String(currentPage);
    }

    function handlePageInput(e: Event): void {
        const target = e.target as HTMLInputElement;
        const digits = target.value.replace(/[^0-9]/g, '').replace(/^0+/, '');

        if (digits !== '' && parseInt(digits, 10) > totalPages) {
            target.value = pageInputValue;
            return;
        }

        pageInputValue = digits;
        target.value = digits;
    }

    function handlePageInputKeydown(e: KeyboardEvent): void {
        if (e.key !== 'Enter') {
            return;
        }

        const page = parseInt(pageInputValue, 10);
        if (!Number.isNaN(page) && page >= 1 && page <= totalPages && page !== currentPage) {
            goTo(page);
        } else {
            pageInputValue = String(currentPage);
        }
    }
</script>

{#if totalPages > 1}
    <nav class="pagination-nav" aria-label="Pagination" style="--page-cell-width: calc({String(totalPages).length}ch + 23px)">
        {#each items as item (item)}
            {#if item === 'left-ellipsis' || item === 'right-ellipsis'}
                <span class="page-ellipsis">…</span>
            {:else if item === currentPage}
                <input
                    bind:this={pageInputEl}
                    type="text"
                    inputmode="numeric"
                    class="page-input"
                    aria-label="Current page"
                    aria-current="true"
                    value={pageInputValue}
                    on:input={handlePageInput}
                    on:keydown={handlePageInputKeydown}
                />
            {:else}
                <button type="button" class="page-btn" on:click={() => goTo(item)}>
                    {item}
                </button>
            {/if}
        {/each}
    </nav>
{/if}

<style>
    .pagination-nav {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 4px;
    }

    .page-ellipsis {
        margin-inline: 10px;
    }

    .page-btn, .page-input {
        box-sizing: border-box;
        width: var(--page-cell-width);
        text-align: center;
    }

    .page-input {
        border-radius: 3px;
        border: 1px solid #06c;
        background: var(--primary-color);
        color: #06c;
        outline: none;
        font-size: 14px;
        line-height: 16px;
        padding: 6px;
    }

    .page-input:hover, .page-input:focus {
        background: #f3f8fd;
        border-color: #005bb8;
        color: #005bb8;
    }
</style>