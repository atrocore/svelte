<script lang="ts">

    import SortableListPicker from '$lib/components/SortableListPicker/SortableListPicker.svelte';
    import type Button from "$lib/components/SortableListPicker/types/button";
    import type Params from "$lib/components/SortableListPicker/types/params";
    import type KeyValue from "$lib/components/SortableListPicker/types/key-value";
    import type Item from "$lib/components/SortableListPicker/types/item";
    import { Language } from "$lib/core/language"
    import { Metadata } from '$lib/core/metadata';
    import { Acl } from "$lib/core/acl";


    export let params: Params;

    let sortableListPicker: SortableListPicker;
    let enabledItems: Item[] = [];
    let disabledItems: Item[] = [];
    let key: number = 0;

    let fieldsInGroup: KeyValue = {};

    let buttonList: Button[] = [
        {name: 'save', label: Language.translate('Save', 'labels'), style: 'primary'},
        {name: 'cancel', label: Language.translate('Cancel', 'labels')}
    ];

    if (params.canReset) {
        buttonList.push({name: 'resetToDefault', label: Language.translate('Reset to Default', 'labels')});
    }

    function refresh(): void {
        key++;
    }

    function validate(itemsToSave: Array<any>): boolean {
        return true;
    }

    loadData();

    function loadData(): void {
        let navigation = params.list ?? [];
        let sortOrder = 0;
        for (let i = 0; i < navigation.length; i++) {
            let item = navigation[i];
            if (typeof item === 'string') {
                if (Metadata.get(['scopes', item, 'tab']) && Acl.check(item, 'read')) {
                    enabledItems.push({
                        name: item,
                        label: Language.translate(item, 'scopeNamesPlural'),
                        sortOrder
                    });
                }
                sortOrder++;
            }
        }

        Object.entries(Metadata.get(['scopes'])).forEach(([key, value]: [string, any]) => {
            if (value.disabled || !value.tab || !Acl.check(key, 'read')) {
                return;
            }

            if (enabledItems.find(v => v.name === key)) {
                return;
            }

            disabledItems.push({
                name: key,
                label: Language.translate(key, 'scopeNamesPlural')
            });
        });

        disabledItems.sort((a, b) => a.label!.localeCompare(b.label!));
    }

</script>

<div>
    {#key key}
        <SortableListPicker
                bind:this={sortableListPicker}
                {params}
                {enabledItems}
                {disabledItems}
                {buttonList}
                {fieldsInGroup}
                {refresh}
                {validate}
        />
    {/key}
</div>
