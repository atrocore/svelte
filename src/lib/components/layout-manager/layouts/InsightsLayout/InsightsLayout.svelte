<script lang="ts">
    import SortableFieldList from '$lib/components/layout-manager/SortableFieldList/SortableFieldList.svelte';
    import type Field from "$lib/components/layout-manager/SortableFieldList/types/field"
    import type Params from "$lib/components/layout-manager/LayoutManagerFrame/types/params"
    import type LayoutItem from "$lib/components/layout-manager/SortableFieldList/types/layout-item"
    import { Language } from "$lib/core/language"
    import { Metadata } from '$lib/core/metadata';
    import { LayoutManager } from "$lib/core/layout-manager";
    import type Group from "$lib/components/layout-manager/SortableFieldList/types/group";

    export let params: Params;

    if (!params.dataAttributeList) {
        params.dataAttributeList = ['id', 'name'];
    }
    if (!params.dataAttributesDefs) {
        params.dataAttributesDefs = {
            name: {
                type: 'varchar',
                readOnly: true
            }
        };
    }

    let sortableFieldList: SortableFieldList;
    let selectedFields: Field[] = [];
    let availableGroups: Group[] = []
    let editable: boolean = true;

    function loadLayout(callback: (data: any) => void): void {
        LayoutManager.get(params.scope, params.type, params.relatedScope, params.layoutProfileId, (layout) => {
            if (callback) {
                readDataFromLayout(layout.layout);
                callback(layout);
            }
        }, false, true);
    }

    function getTranslation(item: string) {
        return Language.translate(item, 'insightsPanels', params.scope)
    }

    function readDataFromLayout(layout: LayoutItem[]): void {
        let availablePanels = ['summary', 'accessManagement'];

        (Metadata.get(['clientDefs', params.scope, 'rightSidePanels']) || []).forEach(item => {
            availablePanels.push(item.name)
        })

        const groups = [{
            name: params.scope,
            scope: params.scope,
            fields: availablePanels.map(item => ({name: item, label: getTranslation(item)}))
        }]

        selectedFields = layout
        selectedFields.forEach(item => {
            item.label = getTranslation(item.name)
        })

        for (const group of groups) {
            group.fields = group.fields.filter(item => !selectedFields.find(sf => sf.name === item.name))
        }

        availableGroups = groups.reverse()
    }
</script>

<SortableFieldList
        bind:this={sortableFieldList}
        {params}
        {selectedFields}
        {availableGroups}
        {editable}
        {loadLayout}
/>