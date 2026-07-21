<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">

    import SortableEntityList from '$lib/components/layout-manager/SortableEntityList/SortableEntityList.svelte';
    import type Button from "$lib/types/ui/button";
    import type Params from "$lib/components/layout-manager/SortableEntityList/types/params";
    import type Item from "$lib/components/layout-manager/SortableColumns/types/item";
    import { Language } from "$lib/core/language"
    import { Metadata } from '$lib/core/metadata';
    import { Acl } from "$lib/core/acl";


    export let params: Params;

    let sortableEntityList: SortableEntityList;
    let enabledItems: Item[] = [];
    let disabledItems: Item[] = [];
    let key: number = 0;

    let fieldsInGroup: Record<string, any> = {};

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

    function validate(_itemsToSave: any): boolean {
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
        <SortableEntityList
                bind:this={sortableEntityList}
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
