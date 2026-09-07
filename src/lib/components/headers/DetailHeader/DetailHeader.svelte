<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

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
    let disableNavigationHistory: boolean = params?.disableNavigationHistory ?? false;
    let activeAnchorItemName: string | null = null;

    $: mode = params.mode ?? 'detail';

    window.addEventListener('detail:panels-loaded', ((event: CustomEvent) => {
        anchorNavItems = event.detail;
    }) as EventListener);

    window.addEventListener('anchor-nav:active-changed', ((event: CustomEvent) => {
        activeAnchorItemName = event.detail;
    }) as EventListener);

    window.addEventListener('record-mode:changed', ((event: CustomEvent) => {
        params.mode = event.detail;
    }) as EventListener);

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

<div class="detail-header-container">
    <BaseHeader breadcrumbs={params.breadcrumbs} scope={params.scope} id={params.id} disableNavigationHistory={disableNavigationHistory} minimizeHeaderOnScroll={true}>
        {#if recordButtons}
            <div class="detail-button-container">
                <RecordActionsGroup {mode} scope={params.scope} id={params.id} {recordButtons} {callbacks}/>
            </div>
        {/if}
        {#if anchorNavItems.length > 0}
            <div class="anchor-nav-container">
                <AnchorNavigation items={anchorNavItems} scrollCallback={anchorScrollCallback}
                                  activeItemName={activeAnchorItemName}
                                  hasLayoutEditor={recordButtons?.hasLayoutEditor && params.mode !== 'edit'}/>
            </div>
        {/if}
    </BaseHeader>
</div>

<style>
    .detail-header-container {
        display: contents;
    }

    .detail-header-container :global(.header-wrapper){
        position: sticky;
        top: 0;
        left: 0;
        right: 0;
        z-index: 101;
        background-color: #fff;
        border-bottom: 1px solid var(--primary-border-color);
        padding-top: 15px;
    }

    .detail-button-container {
        position: relative;
        z-index: 101;
        margin: 1em 0 1.25em;
    }
</style>
