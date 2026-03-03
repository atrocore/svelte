<script lang="ts">
    import { onDestroy, onMount } from "svelte";

    import type Params from "$lib/components/headers/BaseHeader/types/header-params"
    import type AnchorNavItem from "$lib/components/headers/AnchorNavigation/types/anchor-nav-item";

    import BaseHeader from "$lib/components/headers/BaseHeader/BaseHeader.svelte";
    import AnchorNavigation from "$lib/components/headers/AnchorNavigation/AnchorNavigation.svelte";
    import type RecordActionButtons from "$lib/components/headers/RecordActionsGroup/types/record-actions-buttons";
    import RecordActionsGroup from "$lib/components/headers/RecordActionsGroup/RecordActionsGroup.svelte";
    import type RecordCallbacks from "$lib/components/headers/RecordActionsGroup/types/record-callbacks";

    export let params: Params;
    export let anchorNavItems: AnchorNavItem[] = [];
    export let recordButtons: RecordActionButtons | null = null;
    export let callbacks: RecordCallbacks;
    export let anchorScrollCallback = (panelName: string, event: Event) => {
    }

    let mode: string;
    let currentIsHeading: boolean = params?.currentIsHeading ?? true;

    $: mode = params.mode ?? 'detail';

    window.addEventListener('detail:panels-loaded', ((event: CustomEvent) => {
        anchorNavItems = event.detail;
    }) as EventListener);

    window.addEventListener('record-mode:changed', ((event: CustomEvent) => {
        params.mode = event.detail;
    }) as EventListener);

    if (currentIsHeading === true) {
        window.addEventListener('breadcrumbs:header-updated', ((event: CustomEvent) => {
            currentIsHeading = !!event.detail;
        }) as EventListener);
    }

    window.addEventListener('breadcrumbs:items-updated', ((event: CustomEvent) => {
        params.breadcrumbs = event.detail;
    }) as EventListener);

    onMount(() => {
        if (params.afterOnMount) {
            params.afterOnMount();
        }
    });

    onDestroy(() => {
        if (params.afterOnDestroy) {
            params.afterOnDestroy();
        }
    });
</script>

<BaseHeader breadcrumbs={params.breadcrumbs} {currentIsHeading} scope={params.scope} id={params.id}>
    {#if recordButtons}
        <div class="detail-button-container">
            <RecordActionsGroup {mode} scope={params.scope} id={params.id} permissions={params.scopePermissions}
                                {recordButtons} {callbacks}/>
        </div>
    {/if}
    {#if anchorNavItems.length > 0}
        <div class="anchor-nav-container">
            <AnchorNavigation items={anchorNavItems} scrollCallback={anchorScrollCallback}
                              hasLayoutEditor={recordButtons?.hasLayoutEditor && params.mode !== 'edit'}/>
        </div>
    {/if}
</BaseHeader>

<style>
    .detail-button-container {
        position: relative;
        z-index: 101;
        margin: 15px 0;
    }
</style>
