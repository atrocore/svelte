<script lang="ts">
    import { onDestroy, createEventDispatcher } from 'svelte';
    import type Sortable from 'sortablejs';
    import LayoutWell from '$lib/components/layout-manager/LayoutWell/LayoutWell.svelte';
    import { SortableList } from '$lib/dom/sortable';
    import type Item from './types/item';
    import type Group from './types/group';

    export let enabledItems: Item[] = [];
    export let disabledGroups: Group[] = [];
    export let dataAttributeList: string[] = ['name', 'id'];
    export let enabledSortFn: (a: Item, b: Item) => number = (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    export let disabledSortFn: (a: Item, b: Item) => number = (a, b) => (a.label ?? '').localeCompare(b.label ?? '');
    export let canMoveToDisabled: (item: Item) => boolean = () => true;
    export let getTargetGroup: (item: Item) => Group = (item) =>
        disabledGroups.find(g => g.prefix && item.name?.startsWith(g.prefix))
        ?? disabledGroups.find(g => !g.prefix)
        ?? disabledGroups[0];
    export let getEnabledItemClass: (item: Item) => string = () => '';

    const dispatch = createEventDispatcher();

    let layoutElement: HTMLElement;
    let sortableEnabled: Sortable;
    let sortableDisabled: Sortable[] = [];

    onDestroy(() => {
        sortableEnabled?.destroy();
        sortableDisabled.forEach(s => s.destroy());
    });

    function cancelDrop(evt: Sortable.SortableEvent): void {
        if (evt.oldIndex >= evt.from.children.length) {
            evt.from.appendChild(evt.item);
        } else {
            evt.from.insertBefore(evt.item, evt.from.children[evt.oldIndex]);
        }
    }

    export function initSortable(): void {
        sortableEnabled?.destroy();
        sortableDisabled.forEach(s => s.destroy());
        sortableDisabled = [];

        sortableEnabled = SortableList.create(layoutElement.querySelector('ul.enabled')!, {
            onEnd(evt) {
                const toEl = evt.to.closest('.connected') as HTMLElement;
                if (toEl.classList.contains('enabled')) {
                    const [moved] = enabledItems.splice(evt.oldIndex!, 1);
                    enabledItems.splice(evt.newIndex!, 0, moved);
                    enabledItems = [...enabledItems];
                } else {
                    const moved = enabledItems[evt.oldIndex!];
                    if (!canMoveToDisabled(moved)) {
                        cancelDrop(evt);
                        return;
                    }
                    enabledItems.splice(evt.oldIndex!, 1);

                    const targetGroup = getTargetGroup(moved);
                    const droppedInGroupName = toEl.getAttribute('data-name');

                    if (targetGroup.name !== droppedInGroupName) {
                        const correctUl = layoutElement.querySelector(`ul.disabled[data-name="${targetGroup.name}"]`);
                        if (correctUl) {
                            correctUl.children.length
                                ? correctUl.insertBefore(evt.item, correctUl.children[0])
                                : correctUl.appendChild(evt.item);
                        }
                        targetGroup.fields.unshift(moved);
                    } else {
                        targetGroup.fields.splice(evt.newIndex!, 0, moved);
                    }

                    enabledItems = [...enabledItems];
                    disabledGroups = [...disabledGroups];
                }
                dispatch('change');
            }
        });

        for (const ul of layoutElement.querySelectorAll('ul.disabled')) {
            const htmlUl = ul as HTMLElement;
            const sortable = SortableList.create(htmlUl, {
                onEnd(evt) {
                    const toEl = evt.to.closest('.connected') as HTMLElement;
                    if (toEl.classList.contains('disabled')) {
                        if (toEl !== htmlUl) {
                            cancelDrop(evt);
                            return;
                        }
                        const groupName = htmlUl.getAttribute('data-name');
                        const group = disabledGroups.find(g => g.name === groupName);
                        if (group) {
                            const [moved] = group.fields.splice(evt.oldIndex!, 1);
                            if (moved) group.fields.splice(evt.newIndex!, 0, moved);
                        }
                    } else {
                        const groupName = htmlUl.getAttribute('data-name');
                        let moved: Item | undefined;
                        disabledGroups = disabledGroups.map(g => {
                            if (g.name === groupName) {
                                [moved] = g.fields.splice(evt.oldIndex!, 1);
                            }
                            return g;
                        });
                        if (moved) {
                            enabledItems.splice(evt.newIndex!, 0, moved);
                            enabledItems = [...enabledItems];
                        }
                        dispatch('change');
                    }
                }
            });
            sortableDisabled.push(sortable);
        }
    }
</script>

<div id="layout" class="row" bind:this={layoutElement}>
    <div class="col-sm-5">
        <LayoutWell>
            <svelte:fragment slot="header">
                <slot name="enabled-header" />
            </svelte:fragment>
            <ul class="enabled connected">
                {#each enabledItems.sort(enabledSortFn) as item (item.name)}
                    <li {...SortableList.getDataAttributeProps(item, dataAttributeList)}
                        title={item.label}
                        class={getEnabledItemClass(item)}>
                        <div class="left">
                            <slot name="enabled-item-label" {item}>
                                <label>{item.label}</label>
                            </slot>
                        </div>
                        <div class="right">
                            <slot name="enabled-item-actions" {item} />
                        </div>
                    </li>
                {/each}
            </ul>
        </LayoutWell>
    </div>
    <div class="col-sm-1" style="width: 35px"></div>
    <div class="col-sm-5">
        <LayoutWell>
            <svelte:fragment slot="header">
                <slot name="disabled-header" />
            </svelte:fragment>
            {#each disabledGroups as group (group.name)}
                <div class:group={disabledGroups.length > 1}>
                    {#if disabledGroups.length > 1}
                        <slot name="group-title" {group}>
                            <span class="title">{group.name}</span>
                        </slot>
                    {/if}
                    <ul class="disabled connected" data-name="{group.name}">
                        {#each group.fields.sort(disabledSortFn) as field (field.name)}
                            <li {...SortableList.getDataAttributeProps(field, dataAttributeList)} title={field.label}>
                                <div class="left">
                                    <slot name="disabled-item-label" {field}>
                                        <label>{field.label}</label>
                                    </slot>
                                </div>
                            </li>
                        {/each}
                    </ul>
                </div>
            {/each}
        </LayoutWell>
    </div>
</div>

<style>
    #layout {
        height: 100%;
    }

    #layout > * {
        height: 100%;
    }

    .group {
        border: 1px solid #ededed;
        border-radius: 2px;
        padding: 15px;
        margin-bottom: 15px;
    }

    .group :global(.title) {
        font-weight: bold;
    }
</style>
