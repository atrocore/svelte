<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import ListLayout from '$lib/components/layout-manager/layouts/ListLayout/ListLayout.svelte';
    import RelationshipsLayout from '$lib/components/layout-manager/layouts/RelationshipsLayout/RelationshipsLayout.svelte';
    import type Params from "$lib/components/layout-manager/LayoutManagerFrame/types/params"
    import GridLayout from '$lib/components/layout-manager/layouts/GridLayout/GridLayout.svelte';
    import { Metadata } from '$lib/core/metadata';
    import InsightsLayout from '$lib/components/layout-manager/layouts/InsightsLayout/InsightsLayout.svelte';

    export let params: Params;

    let LayoutComponent: ListLayout | RelationshipsLayout | GridLayout | InsightsLayout | undefined;
    let viewType

    const reelType = Metadata.get(['clientDefs', params.scope, 'additionalLayouts', params.type]) || params.type
    if (reelType) {
        params.reelType = reelType
    }


    $: {
        switch (reelType) {
            case 'list':
            case 'selection':
                LayoutComponent = ListLayout;
                break
            case 'insights':
                LayoutComponent = InsightsLayout;
                break
            case 'navigation':
                LayoutComponent = ListLayout;
                params.fieldTypes = ['link', 'linkMultiple']
                break
            case 'kanban':
                LayoutComponent = ListLayout;
                params.dataAttributeList = ['id', 'name', 'link', 'align', 'view', 'isLarge', 'cssStyle']
                params.dataAttributesDefs = {
                    link: {type: 'bool'},
                    isLarge: {type: 'bool'},
                    width: {type: 'float'},
                    cssStyle: {type: 'varchar'},
                    align: {
                        type: 'enum',
                        options: ["left", "right"]
                    },
                    view: {
                        type: 'varchar',
                        readOnly: true
                    },
                    name: {
                        type: 'varchar',
                        readOnly: true
                    }
                }
                break;
            case 'relationships':
                LayoutComponent = RelationshipsLayout;
                break;
            case 'selectionRelations':
                params.onlyManyToMany = true;
                LayoutComponent = RelationshipsLayout;
                break;
            case 'summary':
                params.disabledParameters = ['layoutDetailDisabled']
                LayoutComponent = GridLayout;
                break;
            case 'detail':
                LayoutComponent = GridLayout;
                break;
        }
    }
</script>
<LayoutComponent {params} {viewType}/>
