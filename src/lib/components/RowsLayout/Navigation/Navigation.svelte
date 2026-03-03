<script lang="ts">

    import RowsLayout from '$lib/components/RowsLayout/RowsLayout.svelte';
    import Button from "$lib/components/RowsLayout/types/button";
    import Params from "$lib/components/RowsLayout/types/params";
    import KeyValue from "$lib/components/RowsLayout/types/key-value";
    import Item from "$lib/components/RowsLayout/types/item";
    import { Language } from "$lib/core/language"
    import { Metadata } from '$lib/core/metadata';


    export let params: Params;

    let defaultDelimiter = '_delimiter_';
    let rowsLayout: RowsLayout;
    let enabledItems: Item[] = [];
    let disabledItems: Item[] = [];
    let key: number = 0;

    let fieldsInGroup: KeyValue = {};

    let buttonList: Button[] = [
        {name: 'save', label: Language.translate('Save', 'labels'), style: 'primary'},
        {name: 'cancel', label: Language.translate('Cancel', 'labels')},
        {
            name: 'addGroup',
            label: Language.translate('addGroup', 'labels'),
            cssStyle: 'margin-left: 30px',
            action: () => {
                if (!params.onEditItem) {
                    return
                }

                params.onEditItem({
                    id: getGroupId(),
                    groupEnd: false
                }, (newItem: any) => {
                    let sortOrder = 10;
                    if (enabledItems.length) {
                        sortOrder = enabledItems[enabledItems.length - 1].sortOrder + 10;
                    }

                    let item = {
                        isGroup: true,
                        canEdit: true,
                        canRemove: true,
                        canDisabled: false,
                        name: '',
                        label: '',
                        sortOrder: sortOrder,
                        ...newItem
                    };

                    enabledItems.push(item);

                    if (item.name !== '') {
                        enabledItems.push({
                            id: getGroupId(),
                            isGroup: true,
                            canEdit: true,
                            canRemove: true,
                            canDisabled: false,
                            groupEnd: true,
                            name: '',
                            label: '',
                            sortOrder: item.sortOrder + 1
                        });
                    }

                    refresh();
                })
            }
        },
    ];

    function getGroupId(): string {
        return defaultDelimiter + getRandomHash();
    }

    function refresh(): void {
        key++;
    }

    function editItem(item: Item): void {
        if (!params.onEditItem) {
            return
        }

        params.onEditItem(item, (newItem: any) => {
            let index = enabledItems.findIndex(i => i.id === newItem.id);
            enabledItems[index] = newItem;
            refresh();
        })
    }


    function getRandomHash(): string {
        return Math.floor((1 + Math.random()) * 0x100000000)
            .toString(16)
            .substring(1);
    }

    loadData()

    function loadData(): void {
        let navigation: any[] = params.list ?? [];
        let sortOrder = 0;
        for (let i = 0; i < navigation.length; i++) {
            let item: any = navigation[i];
            if (typeof item === 'string') {
                if (Metadata.get(['scopes', item, 'tab'])) {
                    enabledItems.push({
                        name: item,
                        label: Language.translate(item, 'scopeNamesPlural'),
                        sortOrder
                    });
                }
                sortOrder++;
            } else if (typeof item === 'object') {
                enabledItems.push({
                    id: item.id ?? getGroupId(),
                    canEdit: true,
                    canRemove: true,
                    isGroup: true,
                    canDisabled: false,
                    groupEnd: item.name === '',
                    name: item.name,
                    label: item.name,
                    iconClass: item.iconClass || null,
                    sortOrder
                });
                sortOrder++;
                for (const subItem of item.items) {
                    if (Metadata.get(['scopes', subItem, 'tab'])) {
                        enabledItems.push({
                            name: subItem,
                            label: Language.translate(subItem, 'scopeNamesPlural'),
                            sortOrder
                        });
                        sortOrder++;
                    }
                }

                if (i < navigation.length - 1 && navigation[i + 1].name === '') {
                    continue;
                }

                if (item.name !== '' && (i === navigation.length - 1 || (typeof navigation[i + i] === 'string') || item.items.length === 0)) {
                    enabledItems.push({
                        id: getGroupId(),
                        canEdit: true,
                        canRemove: true,
                        canDisabled: false,
                        isGroup: true,
                        groupEnd: true,
                        name: '',
                        label: '',
                        iconClass: item.iconClass || null,
                        sortOrder
                    });
                    sortOrder++;
                }
            }
        }

        Object.entries(Metadata.get(['scopes'])).forEach(([key, value]: [string, any]) => {
            if (value.disabled || !value.tab) {
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

        disabledItems.sort((a, b) => (a.label ?? '').localeCompare(b.label ?? ''));
    }

</script>

<div>
    {#key key}
        <RowsLayout
                bind:this={rowsLayout}
                {params}
                {enabledItems}
                {disabledItems}
                {buttonList}
                {fieldsInGroup}
                {refresh}
                {editItem}
                {getGroupId}
        />
    {/key}
</div>
