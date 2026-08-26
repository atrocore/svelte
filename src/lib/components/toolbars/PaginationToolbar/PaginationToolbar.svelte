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
    import ToolbarControl from "./ToolbarControl/ToolbarControl.svelte";
    import type ToolbarControlDef from "./types/toolbar-control";
    import type MassAction from "$lib/components/toolbars/ListToolbar/types/mass-action";

    export let currentPage: number = 1;
    export let totalPages: number = 1;
    export let onPageChange: (page: number) => void = () => {
    };

    export let controls: ToolbarControlDef[] = [];

    export let onShowMore: (() => void) | null = null;
    export let showMoreCount: number = 0;
    export let showMoreLoading: boolean = false;

    export let scope: string = '';
    export let massActions: Array<MassAction | string> = [];
    export let massActionStyle: string = '';
    export let selected: string[] | boolean = false;
    export let hasSelectAllCheckbox: boolean = false;
    export let isRelationship: boolean = false;
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

    $: canShowAction = massActions.length > 0 && (isRelationship ? (typeof selected === 'boolean' ? selected : selected.length > 0) : true);
</script>

<div class="pagination-toolbar">
    <div class="left-group">
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
        <div class="controls">
            {#each controls as control (control.key)}
                <ToolbarControl iconClass={control.iconClass} iconTitle={control.iconTitle} iconClickable={!!control.iconClickable}
                                onIconClick={control.onIconClick} value={control.value} options={control.options}
                                onSelect={control.onSelect} />
            {/each}
        </div>
    </div>
    {#if onShowMore}
        <button type="button" class="primary outline" on:click={onShowMore}>{#if !showMoreLoading}<i class="ph ph-arrow-down"></i>{:else}<i class="ph ph-circle-notch ph-spin"></i>{/if}<span>{showMoreCount}</span></button>
    {/if}
    <div class="pagination-container">
        <Pagination {currentPage} {totalPages} {onPageChange} />
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

    .pagination-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 10px;
        min-height: 32px;
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

        .pagination-container,
        .left-group {
            flex-basis: 100%;
            justify-content: center;
        }
    }
</style>
