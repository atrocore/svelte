<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { onDestroy, onMount } from "svelte";

    import BaseHeader from "$lib/components/headers/BaseHeader/BaseHeader.svelte";
    import type Params from "$lib/components/headers/BaseHeader/types/header-params"
    import EntityActionsGroup from "$lib/components/headers/EntityActionsGroup/EntityActionsGroup.svelte";
    import type EntityActionButtons from "$lib/components/headers/EntityActionsGroup/types/entity-actions-buttons";
    import type EntityCallbacks from "$lib/components/headers/EntityActionsGroup/types/entity-callbacks";
    import type EntityStat from "$lib/components/headers/EntityActionsGroup/types/entity-stat";
    import { Language } from "$lib/core/language"

    export let params: Params;
    export let entityActions: EntityActionButtons;
    export let callbacks: EntityCallbacks;
    export let isFavoriteEntity: boolean = false;
    export let entityStats: EntityStat[][] = [];
    export let entityStatsLoading: boolean = false;

    onMount(() => {
        if (params.afterOnMount) {
            params.afterOnMount();
        }
    });

    onDestroy(() => {
        if (params.afterOnDestroy) {
            params.afterOnDestroy();
        }
    })
</script>

<BaseHeader scope={params.scope}>
    <h3 class="header-title">{Language.translate(params.scope, 'scopeNamesPlural')}</h3>
    <EntityActionsGroup scope={params.scope} {entityActions} {callbacks} {isFavoriteEntity} {entityStats} {entityStatsLoading}/>
</BaseHeader>

<style>
    h3 {
        font-size: 20px;
        margin-top: 40px;
    }
</style>
