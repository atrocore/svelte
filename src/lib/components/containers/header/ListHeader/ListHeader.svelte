<script lang="ts">
    import { onDestroy, onMount } from "svelte";

    import BaseHeader from "$lib/components/containers/header/BaseHeader/BaseHeader.svelte";
    import type Params from "$lib/components/containers/header/types/header-params"
    import EntityActionsGroup from "$lib/components/containers/header/EntityActionsGroup/EntityActionsGroup.svelte";
    import type EntityActionButtons from "$lib/components/containers/header/types/entity-actions-buttons";
    import type EntityCallbacks from "$lib/components/containers/header/types/entity-callbacks";
    import { Language } from "$lib/core/language"

    export let params: Params;
    export let entityActions: EntityActionButtons;
    export let callbacks: EntityCallbacks;
    export let viewMode: string = 'list';
    export let isFavoriteEntity: boolean = false;
    export let onViewModeChange: (mode: string) => void = () => {}

    function onViewChange(e: CustomEvent): void {
        viewMode = e.detail.name;
        onViewModeChange(e.detail.name)
    }

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
    <EntityActionsGroup {viewMode} scope={params.scope} {entityActions} {onViewChange} {callbacks} {isFavoriteEntity}/>
</BaseHeader>

<style>
    h3 {
        font-size: 20px;
        margin-top: 40px;
    }
</style>
