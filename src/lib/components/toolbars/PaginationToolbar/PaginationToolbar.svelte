<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { Language } from "$lib/core/language";
    import Pagination from "$lib/components/Pagination/Pagination.svelte";
    import Preloader from "$lib/components/loaders/Preloader/Preloader.svelte";
    import ToolbarControl from "./ToolbarControl/ToolbarControl.svelte";
    import type ToolbarControlDef from "./types/toolbar-control";
    import type MassAction from "$lib/components/toolbars/ListToolbar/types/mass-action";

    export let selectedCount: number | null = null;
    export let shownCount: number | null = null;
    export let totalCount: number | null = null;
    export let loading: boolean = false;

    type Counter = { name: string; label: string; value: number };

    $: counters = [
        selectedCount != null ? {name: 'selected', label: Language.translate('Selected'), value: selectedCount} : null,
        shownCount != null ? {name: 'shown', label: Language.translate('Shown'), value: shownCount} : null,
        totalCount != null ? {name: 'total', label: Language.translate('Total'), value: totalCount} : null,
    ].filter((counter): counter is Counter => counter !== null);

    export let currentPage: number = 1;
    export let totalPages: number = 1;
    export let onPageChange: (page: number) => void = () => {
    };
    export let showPagination: boolean = true;

    export let controls: ToolbarControlDef[] = [];

    export let onShowMore: (() => void) | null = null;
    export let showMoreLabel: string = '';
    export let showMoreLoading: boolean = false;

    export let scope: string = '';
    export let massActions: Array<MassAction | string> = [];
    export let massActionStyle: string = '';
    export let selected: string[] | boolean = false;
    export let hasSelectAllCheckbox: boolean = false;
    export let executeMassAction = (action: string, id?: Record<string, any>): void => {
    };
    export let handleSelectAll = (e: Event): void => {
    };

    function onMassActionClick(e: MouseEvent): void {
        const target = e.currentTarget as HTMLElement;
        const action = target.dataset.action;
        if (!action) {
            return;
        }

        executeMassAction(action, target.dataset);
    }

    function onSelectAllClick(e: Event): void {
        handleSelectAll(e);
    }

    $: canShowAction = massActions.length > 0;
</script>

<div class="pagination-toolbar">
    <div class="left-group">
        {#if hasSelectAllCheckbox || canShowAction}
        <div class="mass-actions">
            {#if hasSelectAllCheckbox}
                <div class="select-all-container">
                    <input type="checkbox" class="select-all" checked={selected === true} on:click={onSelectAllClick}>
                </div>
            {/if}

            {#if canShowAction}
                <div class="actions">
                    <button type="button" class="dropdown-toggle actions-button {massActionStyle}" data-toggle="dropdown"
                            disabled={typeof selected === 'boolean' ? !selected : selected.length === 0}
                            title={Language.translate('Actions')}>
                        <span>{Language.translate('Actions')}</span><i class="ph ph-caret-down"></i>
                    </button>
                    <ul class="dropdown-menu">
                        {#each massActions as action}
                            {#if typeof action === 'string'}
                                <li><a class="mass-action" href="javascript:" data-action={action}
                                       on:click={onMassActionClick}>{Language.translate(action, 'massActions', scope)}</a></li>
                            {:else if action.divider}
                                <li class="divider"></li>
                            {:else}
                                <li><a class="mass-action" href="javascript:" data-action={action.action} data-id={action.id}
                                       on:click={onMassActionClick}>{action.label}</a></li>
                            {/if}
                        {/each}
                    </ul>
                </div>
            {/if}
        </div>
        {/if}
        <div class="controls">
            {#each controls as control (control.key)}
                <ToolbarControl iconClass={control.iconClass} iconTitle={control.iconTitle} iconClickable={!!control.iconClickable}
                                onIconClick={control.onIconClick} value={control.value} options={control.options}
                                onSelect={control.onSelect} />
            {/each}
        </div>
    </div>
    <div class="right-group">
        {#if loading}
            <div class="counters-group"><Preloader heightPx={12}/></div>
        {:else if counters.length > 0}
            <div class="counters-group">
                {#each counters as counter, i}
                    <span class="counter" data-name={counter.name} title="{counter.label}: {counter.value}"><span class="counter-label">{counter.label}:</span><span class="counter-value">{counter.value}</span></span>{#if i < counters.length - 1}<span class="separator">/</span>{/if}
                {/each}
            </div>
        {/if}
        {#if onShowMore}
            <button type="button" disabled={showMoreLoading} on:click={onShowMore}>{#if !showMoreLoading}<i class="ph ph-arrow-down"></i>{:else}<i class="ph ph-circle-notch ph-spin"></i>{/if}<span>{showMoreLabel}</span></button>
        {/if}
        {#if showPagination && totalPages > 1}
            <div class="pagination-container">
                <Pagination {currentPage} {totalPages} {onPageChange} />
            </div>
        {/if}
    </div>
</div>

<style>
    :global(.list-pagination-container) {
        position: sticky;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 11;
        background-color: #fafafa;
        padding: 10px 20px;
        border-top: 1px solid var(--primary-border-color);
        box-shadow: 0 -2px 8px rgba(0,0,0,0.04);
    }

    :global(.list-pagination-container.relationship-pagination-container) {
        position: static;
        z-index: auto;
        box-shadow: none;
        background-color: #fff;
        padding-right: 10px;
        border-top: 1px solid var(--secondary-border-color);
        padding-top: 8px;
        padding-bottom: 5px;
    }

    .pagination-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 10px;
        min-height: 32px;
    }

    .right-group {
        container-type: inline-size;
        container-name: pagination-right-group;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        flex: 1 1 0;
        min-width: 0;
        flex-wrap: wrap;
        column-gap: 30px;
    }

    .counters-group {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        color: #333;
        font-size: 12px;
        line-height: 1;
        white-space: nowrap;
    }

    .counters-group .counter {
        display: inline-flex;
        align-items: center;
        gap: 4px;
    }

    .counters-group .counter-value {
        color: #000;
        font-weight: 600;
    }

    .counters-group .separator {
        margin: 0 7px;
        color: #999;
    }

    @container pagination-right-group (max-width: 640px) {
        .counters-group [data-name="shown"],
        .counters-group [data-name="shown"] + .separator {
            display: none;
        }
    }

    @container pagination-right-group (max-width: 420px) {
        .counters-group .counter-label {
            display: none;
        }
    }

    .left-group {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 15px;
    }

    .controls {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 15px;
    }

    .mass-actions {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    @media screen and (max-width: 768px) {
        .pagination-toolbar {
            justify-content: center;
        }

        .pagination-container {
            display: flex;
        }

        .left-group,
        .right-group {
            flex-basis: 100%;
            justify-content: center;
        }
    }

    @media screen and (max-width: 480px) {
        .counters-group {
            display: none;
        }
    }
</style>
