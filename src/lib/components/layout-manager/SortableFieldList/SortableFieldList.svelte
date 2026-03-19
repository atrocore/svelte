<script lang="ts">
    import LayoutManagerFrame from '$lib/components/layout-manager/LayoutManagerFrame/LayoutManagerFrame.svelte';
    import SortableColumns from '$lib/components/layout-manager/SortableColumns/SortableColumns.svelte';
    import type Field from "./types/field"
    import type Params from "$lib/components/layout-manager/LayoutManagerFrame/types/params"
    import type LayoutItem from "./types/layout-item"
    import type Group from "./types/group";
    import { Language } from "$lib/core/language"
    import { Notifier } from "$lib/core/notifier";
    import { Metadata } from '$lib/core/metadata';
    import { UserData } from "$lib/core/user-data";

    export let params: Params;
    export let selectedFields: Field[] = [];
    export let nonRemovableFields: string[] = [];
    export let availableGroups: Group[] = [];
    export let loadLayout: Function;

    let sortableColumns: SortableColumns;
    let hasAttributes = Metadata.get(['scopes', params.scope, 'hasAttribute']);

    function getTargetGroup(item: Field): Group {
        return availableGroups.find(g => g.prefix && item.name.startsWith(g.prefix))
            ?? availableGroups.find(g => !g.prefix)
            ?? availableGroups[0];
    }

    function editField(field: Field): void {
        params.openEditDialog(field, params.scope, params.dataAttributeList, params.dataAttributesDefs, (attributes) => {
            selectedFields = selectedFields.map(item => {
                if (item.name === field.name) {
                    for (let key in attributes) {
                        item[key] = attributes[key]
                    }
                }
                return item
            })
        });
    }

    function openLabelDialog(field: Field): void {
        params.openEditLabelDialog(params.scope, field.name, (label) => {
            selectedFields = selectedFields.map(item => {
                if (item.name === field.name) {
                    item.label = label
                }
                return item
            })
        });
    }

    function isAdmin(): boolean {
        let data = UserData.get();
        return !!(data && data.user && data.user.isAdmin);
    }

    function canEdit(): boolean {
        return params.dataAttributeList.filter(attr => attr !== 'id' && attr !== 'name').length > 0;
    }

    function removeField(item: Field): void {
        selectedFields.splice(selectedFields.indexOf(item), 1)
        selectedFields = [...selectedFields]

        const itemGroup = getTargetGroup(item);
        itemGroup.fields.unshift(item)
        availableGroups = [...availableGroups]
    }

    export let fetch = () => {
        return selectedFields;
    }

    function validate(layout: LayoutItem[]): boolean {
        if (layout.length === 0) {
            Notifier.notify('Layout cannot be empty', 'error');
            return false;
        }
        return true;
    }

    function addAttribute(): void {
        params.openAddAttributesDialog(params.scope, fields => {
            fields.forEach(field => {
                let attribute = {
                    id: field.name,
                    name: field.name,
                    label: field.detailViewLabel || field.label,
                    attributeId: field.attributeId
                };

                if (field.channelName) {
                    attribute.label += ` / ${field.channelName}`;
                }

                let exists = false;
                selectedFields.forEach(item => {
                    if (item.name === attribute.name) exists = true;
                });
                if (!exists) {
                    availableGroups.forEach(group => {
                        group.fields.forEach(item => {
                            if (item.name === attribute.name) exists = true;
                        })
                    })
                }
                if (!exists) {
                    selectedFields = [...selectedFields, attribute];
                }
            })
        });
    }
</script>

<LayoutManagerFrame
        {params}
        {validate}
        {fetch}
        {loadLayout}
        on:ready={() => sortableColumns.initSortable()}
>
    <SortableColumns
            bind:this={sortableColumns}
            bind:enabledItems={selectedFields}
            bind:disabledGroups={availableGroups}
            dataAttributeList={params.dataAttributeList}
            enabledSortFn={(a, b) => a.sortOrder - b.sortOrder}
            disabledSortFn={(a, b) => a.label.localeCompare(b.label)}
            canMoveToDisabled={(item) => !nonRemovableFields.includes(item.name)}
            {getTargetGroup}
    >
        <svelte:fragment slot="enabled-header">
            <header>
                <h5>{Language.translate('Current Layout', 'labels', 'LayoutManager')}</h5>
                {#if hasAttributes && !['navigation', 'insights', 'relationships'].includes(params.type)}
                    <a href="#"
                       on:click|preventDefault={addAttribute}>{Language.translate('Add Attribute', 'labels', 'LayoutManager')}</a>
                {/if}
            </header>
        </svelte:fragment>

        <svelte:fragment slot="disabled-header">
            <header>{Language.translate(['navigation', 'insights', 'relationships'].includes(params.type) ? 'Available Panels' : 'Available Fields', 'labels', 'Admin')}</header>
        </svelte:fragment>

        <svelte:fragment slot="enabled-item-label" let:item>
            <label style={item.attributeId ? 'font-style: italic' : ''}>{item.label}</label>
        </svelte:fragment>

        <svelte:fragment slot="enabled-item-actions" let:item>
            {#if params.editable}
                {#if isAdmin() && !item.attributeId && params.type !== 'insights'}
                    <a href="javascript:" data-action="change-label" class="change-label"
                       on:click|preventDefault={() => openLabelDialog(item)}>
                        <i class="ph ph-globe-simple"></i>
                    </a>
                {/if}
                {#if canEdit()}
                    <a href="javascript:" data-action="editField" class="edit-field"
                       on:click={() => editField(item)}>
                        <i class="ph ph-pencil-simple"></i>
                    </a>
                {/if}
                {#if !nonRemovableFields.includes(item.name)}
                    <a href="javascript:" class="remove-field"
                       on:click={() => removeField(item)}>
                        <i class="ph ph-x"></i>
                    </a>
                {/if}
            {/if}
        </svelte:fragment>

        <svelte:fragment slot="group-title" let:group>
            <span class="title">{Language.translate(group.name, 'scopeNames')}</span>
        </svelte:fragment>

        <svelte:fragment slot="disabled-item-label" let:field>
            <span style={field.attributeId ? 'font-style: italic' : ''}>{field.label}</span>
        </svelte:fragment>
    </SortableColumns>
</LayoutManagerFrame>

<style>
    :global(#layout .enabled li a.edit-field),
    :global(#layout .enabled li a.remove-field),
    :global(#layout .enabled li a.change-label) {
        display: none;
    }

    :global(#layout .enabled li:hover a.edit-field),
    :global(#layout .enabled li:hover a.remove-field),
    :global(#layout .enabled li:hover a.change-label) {
        display: inline;
    }

    :global(#layout .enabled li:hover .left) {
        margin-inline-end: .25em;
    }

    :global(#layout header) {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    :global(#layout header h5) {
        margin-top: 0;
    }

    :global(#layout header a) {
        font-weight: normal;
    }
</style>
