<script lang="ts">
    import { onMount } from 'svelte';
    import SortableColumns from '$lib/components/layout-manager/SortableColumns/SortableColumns.svelte';
    import ButtonBar from '$lib/components/buttons/ButtonBar/ButtonBar.svelte';
    import type Button from "$lib/types/ui/button";
    import type Params from "$lib/components/layout-manager/SortableEntityList/types/params";

    import type Item from "$lib/components/layout-manager/SortableColumns/types/item";
    import { Language } from "$lib/core/language"
    import { Notifier } from "$lib/core/notifier";

    export let params: Params;
    export let enabledItems: Item[] = [];
    export let disabledItems: Item[] = [];

    export let buttonList: Button[]
    export let refresh: Function = () => {};
    export let editItem: Function = () => {};
    export let getGroupId: Function = () => 'id';
    export let fieldsInGroup: Record<string, any>;

    let sortableColumns: SortableColumns;
    let disabled = false;

    // SortableColumns works with groups; wrap the flat disabledItems in a single group
    let _disabledGroups = [{ name: '', fields: disabledItems }];

    function save(): void {
        disabled = true;
        const itemsToSave = fetch();
        if (validate(itemsToSave) && params.onSaved) {
            params.onSaved(itemsToSave);
        }
        disabled = false;
    }

    function cancel(): void {}

    $: resolvedButtonList = buttonList.map(b => ({
        ...b,
        onClick: b.onClick ?? (b.name === 'save' ? save : b.name === 'cancel' ? cancel : undefined)
    }));

    onMount(() => {
        sortableColumns.initSortable();
    });

    $: calculateFieldsInGroup(enabledItems);

    function calculateFieldsInGroup(enabledItems: Item[]) {
        let inGroup = false;
        let inGroupValues: Record<string, any> = {}
        enabledItems.forEach((item) => {
            if (item.isGroup) {
                inGroup = item.name !== ''
                return;
            }
            if (inGroup && item.name) {
                inGroupValues[item.name] = true;
            }
        });
        fieldsInGroup = inGroupValues
    }

    $: getEnabledItemClass = (item: Item): string => {
        const classes: string[] = [];
        if (item.isGroup) classes.push('group');
        if (item.groupEnd) classes.push('end');
        if (item.name && fieldsInGroup[item.name] && !item.isGroup) classes.push('in-group');
        return classes.join(' ');
    };

    function handleChange(): void {
        disabledItems = _disabledGroups[0]?.fields ?? [];
        refresh();
    }

    function removeItem(item: Item): void {
        enabledItems.splice(enabledItems.findIndex(f => f.id === item.id), 1);
        enabledItems = [...enabledItems];
        refresh();
    }

    export let fetch = () => {
        let data: Array<any> = [];
        let inGroup = false;
        let adjusted = false;
        for (let i = 0; i < enabledItems.length; i++) {
            const item = enabledItems[i];
            if (item.isGroup) {
                inGroup = !item.groupEnd;
                data.push({
                    id: item.id,
                    name: item.name,
                    color: item.color,
                    iconClass: item.iconClass,
                    items: []
                });
                continue;
            }

            if (inGroup) {
                data[data.length - 1].items.push(item.name);
            } else {
                data.push(item.name);
            }
        }
        let groupBegan = false;
        let filteredData = data.filter(item => {
            if (typeof item === 'object') {
                if (item.name !== '' && !item.items.length) {
                    return false;
                }

                if (item.name !== '' && item.items.length) {
                    groupBegan = true;
                    return true;
                }

                if (item.name === '' && groupBegan) {
                    groupBegan = false
                    return true;
                }

                if (item.name === '' && !groupBegan) {
                    return false
                }
            }

            return true;
        });

        adjusted = filteredData.length !== data.length;

        data = filteredData;

        let dataWithNormalizeGroupEnd = [];

        for (let i = 0; i < data.length; i++) {
            let item = data[i];
            dataWithNormalizeGroupEnd.push(item);
            if (typeof item === 'object' && item.name !== '') {
                if (i === data.length - 1 || !(typeof data[i + 1] === 'object' && data[i + 1].name === '')) {
                    adjusted = true;
                    dataWithNormalizeGroupEnd.push({
                        id: getGroupId(),
                        name: '',
                        items: []
                    });
                }
            }
        }

        return {
            adjusted,
            navigation: dataWithNormalizeGroupEnd
        };
    }

    export let validate = (itemsToSave: Array<any>): boolean => {
        if (itemsToSave.length === 0) {
            Notifier.notify('Menu cannot be empty', 'error');
            return false;
        }
        return true;
    }
</script>

<ButtonBar buttonList={resolvedButtonList} {disabled} />

<SortableColumns
            bind:this={sortableColumns}
            bind:enabledItems
            bind:disabledGroups={_disabledGroups}
            {getEnabledItemClass}
            on:change={handleChange}
    >
        <svelte:fragment slot="enabled-header">
            <header>{Language.translate('Current Layout', 'LayoutManager')}</header>
        </svelte:fragment>

        <svelte:fragment slot="disabled-header">
            <header>{Language.translate('Available Fields', 'Admin')}</header>
        </svelte:fragment>

        <svelte:fragment slot="enabled-item-actions" let:item>
            {#if item.canEdit}
                <a href="javascript:" data-action="editField" class="edit-field"
                   on:click={() => editItem(item)}>
                    <i class="ph ph-pencil-simple"></i>
                </a>
            {/if}
            {#if item.canRemove}
                <a href="javascript:" data-action="removeField" class="remove-field"
                   on:click={() => removeItem(item)}>
                    <i class="ph ph-x"></i>
                </a>
            {/if}
        </svelte:fragment>
    </SortableColumns>

<style>
    :global(#layout .enabled .in-group),
    :global(#layout .enabled .group.end) {
        margin-left: 20px;
    }

    :global(#layout .enabled .group) {
        position: relative;
        color: black;
    }

    :global(#layout .enabled .group label) {
        font-weight: bold;
    }

    :global(#layout .enabled .group.end .left) {
        border-top: 1px solid #ccc;
        margin: 10px 5px;
    }
</style>
