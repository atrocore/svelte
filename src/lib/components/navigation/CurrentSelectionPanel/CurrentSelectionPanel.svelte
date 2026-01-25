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
    import {Language} from '$lib/core/language';
    import {Config} from '$lib/core/config';
    import {Utils} from '$lib/core/utils';
    import {Notifier} from '$lib/core/notifier';
    import BadgePanel from '$lib/components/navigation/BadgePanel/BadgePanel.svelte';
    import ActionButton from '$lib/components/buttons/ActionButton/ActionButton.svelte';
    import ExtendedList from '$lib/components/list/ExtendedList/ExtendedList.svelte';
    import ExtendedListItem from '$lib/components/list/ExtendedListItem/ExtendedListItem.svelte';
    import type ItemAction from '$lib/components/list/ItemActions/types/item-action';
    import type SelectionGroup from './types/selection-group';

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
    let total = 0;
    let currentOffset = 0;
    let currentSelectionId: string | null = null;
    let showMoreLoading = false;
    let previousIsOpen = false;

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
    $: isComparable = currentSelectionId && groups.length > 0 && (groups.length > 1 || groups[0]?.collection.length > 1);
    $: isMergeable = checkMergeable(groups);

    function checkMergeable(grps: SelectionGroup[]): boolean {
        if (!isComparable) return false;
        let scope: string | null = null;
        for (const group of grps) {
            if (!scope) {
                scope = group.key;
                continue;
            }
            if (scope !== group.key) {
                return false;
            }
        }
        return true;
    }

    async function fetchSelectionItems(offset = 0): Promise<void> {
        if (!currentSelectionId) {
            loadingGroups = false;
            return;
        }

        try {
            const response = await Utils.getRequest('SelectionItem', {
                maxSize: 20,
                offset: String(offset),
                where: JSON.stringify([
                    {
                        attribute: 'selectionId',
                        type: 'equals',
                        value: currentSelectionId
                    }
                ])
            });

            if (!response.ok) {
                throw new Error('Failed to fetch selection items');
            }

            const data = await response.json();
            const result: Record<string, SelectionGroup> = {};

            data.list.forEach((item: any) => {
                if (!result[item.entityType]) {
                    result[item.entityType] = {
                        key: item.entityType,
                        collection: [],
                        rowList: []
                    };
                }

                result[item.entityType].collection.push({
                    id: item.id,
                    entityId: item.entityId,
                    entityName: item.name,
                    entityType: item.entityType
                });

                result[item.entityType].rowList.push(item.entityId);
            });

            if (offset > 0 && groups.length > 0) {
                const keys = groups.map(g => g.key);
                Object.values(result).forEach(el => {
                    if (!keys.includes(el.key)) {
                        groups.push(el);
                    } else {
                        groups = groups.map(group => {
                            if (el.key === group.key) {
                                return {
                                    ...group,
                                    collection: [...group.collection, ...el.collection],
                                    rowList: [...group.rowList, ...el.rowList]
                                };
                            }
                            return group;
                        });
                    }
                });
            } else {
                groups = Object.values(result);
            }

            if (!Config.get('tabIconsDisabled')) {
                groups = groups.map(group => ({
                    ...group,
                    icon: Utils.getTabIcon(group.key)
                }));
            }

            total = data.total;
            let length = 0;
            groups.forEach(g => length += g.collection.length);
            currentOffset = length;

        } catch (error) {
            console.error('Error fetching selection items:', error);
        } finally {
            loadingGroups = false;
            showMoreLoading = false;
        }
    }

    async function removeItem(selectionItemId: string): Promise<void> {
        try {
            Notifier.notify(Language.translate('removing'));

            const response = await Utils.request('DELETE', `SelectionItem/${selectionItemId}`, null);

            if (!response.ok) {
                throw new Error('Failed to remove item');
            }

            groups = groups.map(group => ({
                ...group,
                collection: group.collection.filter(s => s.id !== selectionItemId),
                rowList: group.rowList.filter(id => {
                    const item = group.collection.find(s => s.id === selectionItemId);
                    return item ? id !== item.entityId : true;
                })
            })).filter(g => g.collection.length > 0);

            currentOffset = groups.reduce((acc, g) => acc + g.collection.length, 0);
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
        fetchSelectionItems(currentOffset);
    }

    function openView(mode: string): void {
        window.location.href = `#Selection/view/${currentSelectionId}/selectionViewMode=${mode}`;
        close();
    }

    function getItemActions(): ItemAction[] {
        return [
            {name: 'remove', label: 'Remove'}
        ];
    }

    function handleItemAction(e: CustomEvent): void {
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

        currentSelectionId = userModel.get('currentSelectionId') || null;

        if (currentSelectionId) {
            loadingGroups = true;
            groups = [];
            currentOffset = 0;
            fetchSelectionItems();
        } else {
            groups = [];
            currentOffset = 0;
            loadingGroups = false;
        }
    }


    export function handleSelectionChange(): void {
        loadData();
        onSelectionChange();
    }
</script>

<BadgePanel
        {isOpen}
        {close}
        {icon}
        title={Language.translate('currentSelection')}
        panelClass="current-selection-panel-container"
        {width}
>
    <div slot="actions" class="action-buttons">
        {#if currentSelectionId}
            <ActionButton
                    params={{
                    name: 'standard',
                    html: `<i class="ph ph-list"></i> ${Language.translate('Standard')}`,
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
                    html: `<i class="ph ph-arrows-left-right"></i> ${Language.translate('Compare')}`,
                    hidden: false,
                    className:"action primary"
                }}
                    on:execute={() => openView('compare')}
            />
        {/if}
        {#if isMergeable}
            <ActionButton
                    params={{
                    name: 'merge',
                    html: `<i class="ph ph-arrows-merge"></i> ${Language.translate('Merge')}`,
                    hidden: false
                }}
                    className="action"
                    on:execute={() => openView('merge')}
            />
        {/if}
    </div>

    <div class="current-selection cell">
        <div class="field" bind:this={linkFieldContainer}></div>
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
                        <ExtendedList extendBorders={true} horizontalPadding={20}>
                            {#each group.collection as item}
                                <ExtendedListItem
                                    itemId={item.id}
                                    actions={getItemActions()}
                                    on:action={handleItemAction}
                                >
                                    <a href="#{item.entityType}/view/{item.entityId}">{item.entityName}</a>
                                </ExtendedListItem>
                            {/each}
                        </ExtendedList>
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
</BadgePanel>

<style>
    .action-buttons {
        padding: 10px 20px;
    }

    .action-buttons button {
        margin-right: 5px;
    }

    .current-selection {
        padding: 10px 20px 20px 20px;
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
        /*padding: 20px;*/
        /*text-align: center;*/
        /*color: #999;*/
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

    .show-more :global(.preloader) {
        height: 14px;
    }
</style>
