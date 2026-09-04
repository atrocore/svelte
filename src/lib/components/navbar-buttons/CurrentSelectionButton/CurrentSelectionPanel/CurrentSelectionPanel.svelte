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
    import { onMount } from 'svelte';
    import { Language } from '$lib/core/language';
    import { Notifier } from '$lib/dom/notifier';
    import PopoverButtonPanel
        from '$lib/components/buttons/PopoverButton/PopoverButtonPanel/PopoverButtonPanel.svelte';
    import ActionButton from '$lib/components/buttons/ActionButton/ActionButton.svelte';
    import SingleColumnTable from '$lib/components/SingleColumnTable/SingleColumnTable.svelte';
    import SingleColumnTableItem
        from '$lib/components/SingleColumnTable/SingleColumnTableItem/SingleColumnTableItem.svelte';
    import type RowAction from '$lib/components/RowActions/types/row-action';
    import type SelectionGroup from './types/selection-group';
    import {
        checkComparable,
        checkMergeable,
        parseSelectionItemsResponse,
        mergeGroups,
        addIconsToGroups,
        removeItemFromGroups,
        calculateTotalItems
    } from './utils/selection-utils';
    import { fetchSelectionItems as fetchSelectionItemsApi, deleteSelectionItem } from './utils/selection-api';

    export let isOpen = false;
    export let close: () => void;
    export let icon: HTMLElement | null = null;
    export let renderLinkField: (container: HTMLElement) => void = () => {
    };
    export let onSelectionChange: () => void = () => {
    };
    export let width: string = '500px';
    export let userModel: any;

    let linkFieldContainer: HTMLElement;
    let loadingGroups = true;
    let groups: SelectionGroup[] = [];
    export let total = 0;
    let currentOffset = 0;
    let currentSelectionId: string | null = null;
    let showMoreLoading = false;
    let previousIsOpen = false;

    onMount(() => {
        loadData();
    });

    $: if (isOpen && linkFieldContainer) {
        renderLinkField(linkFieldContainer);
    }

    $: if (isOpen && !previousIsOpen && userModel) {
        previousIsOpen = true;
        syncAndLoadData();
    } else if (!isOpen && previousIsOpen) {
        previousIsOpen = false;
    }

    async function syncAndLoadData(): Promise<void> {
        loadingGroups = true;
        try {
            await userModel.fetch();
        } catch (error) {
            console.error('Error syncing user model:', error);
        }
        loadData();
    }

    $: canLoadMore = groups.length > 0 && currentOffset < total;
    $: isComparable = checkComparable(currentSelectionId, groups);
    $: isMergeable = checkMergeable(groups, isComparable);

    async function fetchItems(offset = 0): Promise<void> {
        if (!currentSelectionId) {
            loadingGroups = false;
            return;
        }

        try {
            const data = await fetchSelectionItemsApi(currentSelectionId, offset);

            const parsedGroups = parseSelectionItemsResponse(data);

            if (offset > 0 && groups.length > 0) {
                groups = mergeGroups(groups, parsedGroups);
            } else {
                groups = Object.values(parsedGroups);
            }

            groups = addIconsToGroups(groups);

            total = data.total;
            currentOffset = calculateTotalItems(groups);

        } catch (error) {
            console.error('Error fetching selection items:', error);
            if (offset === 0) {
                groups = [];
                total = 0;
                currentOffset = 0;
            }
        } finally {
            loadingGroups = false;
            showMoreLoading = false;
        }
    }

    async function removeItem(selectionItemId: string): Promise<void> {
        try {
            Notifier.notify(Language.translate('removing'));

            await deleteSelectionItem(selectionItemId);

            groups = removeItemFromGroups(groups, selectionItemId);
            currentOffset = calculateTotalItems(groups);
            total--;

            Notifier.notify(Language.translate('Success'), 'success');
        } catch (error) {
            console.error('Error removing item:', error);
            Notifier.notify(Language.translate('Error'), 'error');
        }
    }

    function showMore(e: CustomEvent): void {
        e.detail?.event?.stopPropagation();
        showMoreLoading = true;
        fetchItems(currentOffset);
    }

    function openView(mode: string): void {
        window.location.href = `#Selection/view/${currentSelectionId}/selectionViewMode=${mode}`;
        close();
    }

    function getRowActions(): RowAction[] {
        return [
            {name: 'remove', label: 'Remove'}
        ];
    }

    function handleRowAction(e: CustomEvent): void {
        const {action, itemId} = e.detail;
        if (action === 'remove') {
            removeItem(itemId);
        }
    }

    function loadData(): void {
        if (!userModel) {
            loadingGroups = false;
            return;
        }

        const newSelectionId = userModel.get('currentSelectionId') || null,
            selectionChanged = newSelectionId !== currentSelectionId;

        currentSelectionId = newSelectionId;

        if (currentSelectionId) {
            loadingGroups = true;
            currentOffset = 0;
            if (selectionChanged) {
                groups = [];
            }
            fetchItems();
        } else {
            groups = [];
            currentOffset = 0;
            total = 0;
            loadingGroups = false;
        }
    }


    export function handleSelectionChange(): void {
        loadData();
        onSelectionChange();
    }
</script>

<PopoverButtonPanel
        {isOpen}
        {close}
        {icon}
        title={Language.translate('currentSelection')}
        panelClass="current-selection-panel-container"
        {width}
>
    <div class="current-selection cell">
        <div class="field" bind:this={linkFieldContainer}></div>
        <div class="action-buttons">
            {#if currentSelectionId}
                <ActionButton
                        params={{
                        name: 'standard',
                        html: '<i class="ph ph-list"></i>',
                        hidden: false,
                        className:"action"
                    }}

                        on:execute={() => openView('standard')}
                />
            {/if}
            {#if isComparable}
                <ActionButton
                        params={{
                        name: 'compare',
                        html: '<i class="ph ph-arrows-left-right"></i>',
                        hidden: false,
                        className:"action"
                    }}
                        on:execute={() => openView('compare')}
                />
            {/if}
            {#if isMergeable}
                <ActionButton
                        params={{
                        name: 'merge',
                        html: '<i class="ph ph-arrows-merge"></i>',
                        hidden: false
                    }}
                        className="action"
                        on:execute={() => openView('merge')}
                />
            {/if}
        </div>
    </div>

    {#if loadingGroups}
        <div class="loading-message">{Language.translate('Loading...')}</div>
    {:else if groups.length > 0}
        <div class="group-container">
            {#each groups as group}
                <div class="group" data-name={group.key}>
                    <div class="entity">
                        <div class="group-name">
                            {#if group.icon}
                                <img class="icon" src={group.icon} alt="">
                            {/if}
                            <span>{Language.translate(group.key, 'scopeNamesPlural', 'Global')}</span>
                        </div>
                        <div class="action"></div>
                    </div>
                    <div class="list-container">
                        <SingleColumnTable extendBorders={true} horizontalPadding={20}>
                            {#each group.collection as item}
                                <SingleColumnTableItem
                                        itemId={item.id}
                                        actions={getRowActions()}
                                        on:action={handleRowAction}
                                >
                                    <a href="#{item.entityName}/view/{item.recordId}">{item.recordName}</a>
                                </SingleColumnTableItem>
                            {/each}
                        </SingleColumnTable>
                    </div>
                </div>
            {/each}
        </div>
    {:else}
        <div class="list-container">
            <div class="no-data-container">{Language.translate('No Data')}</div>
        </div>
    {/if}

    <div slot="footer" class="show-more" class:hide={!canLoadMore}>
        <ActionButton
                params={{
                name: 'showMore',
                html: showMoreLoading
                    ? '<img class="preloader" src="client/img/atro-loader.svg" alt="Loading">'
                    : `<span class="more-label">${Language.translate('Show more')}</span>`,
                disabled: showMoreLoading,
                 style: showMoreLoading ? 'default' : 'primary',
                hidden: false
            }}
                on:execute={showMore}
        />
    </div>
</PopoverButtonPanel>

<style>
    .current-selection {
        padding: 10px 15px 10px 10px;
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .current-selection .field {
        flex: 1;
        min-width: 0;
    }

    .action-buttons {
        display: flex;
        flex-shrink: 0;
        margin-left: auto;
    }

    .action-buttons :global(button) {
        margin-right: 5px;
    }

    .action-buttons :global(button:last-child) {
        margin-right: 0;
    }

    .loading-message {
        padding: 10px 20px;
    }

    .group {
        padding: 0 20px;
    }

    .group-name {
        display: flex;
        align-items: center;
        font-weight: 600;
        padding: 10px 0;
    }

    .group-name .icon {
        width: 16px;
        height: 16px;
        margin-right: 8px;
    }

    .no-data-container {
        padding: 10px 20px;
    }

    .show-more {
        padding: 10px;
    }

    .show-more.hide {
        display: none;
    }

    .show-more :global(button) {
        min-height: 34px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .show-more :global(img.preloader) {
        height: 14px;
    }
</style>
