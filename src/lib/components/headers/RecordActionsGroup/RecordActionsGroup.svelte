<script lang="ts">
    import type RecordActionButtons from "$lib/components/headers/RecordActionsGroup/types/record-actions-buttons";
    import type Permissions from "$lib/components/headers/RecordActionsGroup/types/permissions";
    import { Metadata } from '$lib/core/metadata';

    import { onMount } from "svelte";
    import Preloader from "$lib/components/loaders/Preloader/Preloader.svelte";
    import DropdownActionButton from "$lib/components/buttons/DropdownActionButton/DropdownActionButton.svelte";
    import ActionButton from "$lib/components/buttons/ActionButton/ActionButton.svelte";
    import type ActionButtonParams from "$lib/components/buttons/ActionButton/types/action-button-params";
    import type DropdownActionParams from "$lib/components/buttons/DropdownActionButton/types/dropdown-action-params";
    import ActionButtonGroup from "$lib/components/ActionButtonGroup/ActionButtonGroup.svelte";
    import type ActionParams from "$lib/types/ui/action-params";
    import BookmarkButton from "$lib/components/navbar-buttons/BookmarkButton/BookmarkButton.svelte";
    import FollowButton from "$lib/components/entity-actions/FollowButton/FollowButton.svelte";
    import type RecordCallbacks from "$lib/components/headers/RecordActionsGroup/types/record-callbacks";
    import PrevNextNavigation from "$lib/components/entity-actions/PrevNextNavigation/PrevNextNavigation.svelte";
    import FieldStateFilter from "$lib/components/filters/FieldStateFilter/FieldStateFilter.svelte";
    import TourButton from "$lib/components/entity-actions/TourButton/TourButton.svelte";
    import { Language } from "$lib/core/language"
    import { ApiClient } from '$lib/core/api-client';

    export let mode: string = 'detail';
    export let recordButtons: RecordActionButtons;
    export let callbacks: RecordCallbacks;
    export let permissions: Permissions;
    export let scope: string;
    export let id: string | null;

    let recordActions: ActionParams[] = [];
    let dropdownActions: ActionParams[] = [];
    let additionalActions: (ActionButtonParams | DropdownActionParams)[] = [];
    let dynamicActions: (ActionButtonParams | DropdownActionParams)[] = [];
    let dynamicEditActions: ActionParams[] = [];
    let dynamicActionsDropdown: ActionParams[] = [];
    let additionalEditActions: ActionParams[] = [];
    let dynamicActionMeta = new Map<string, Record<string, any>>();
    let headerButtons: ActionParams[] = [];
    let loadingActions: boolean = false;
    let bookmarkId: string | null = null;
    let navigationIconScope: string | null = null;

    $: {
        recordActions = (mode === 'edit' ? recordButtons?.editButtons : recordButtons?.buttons) ?? [];
        additionalActions = [...(recordButtons?.additionalButtons ?? []), ...dynamicActions];
        dropdownActions = (mode === 'edit' ? recordButtons?.dropdownEditButtons : recordButtons?.dropdownButtons) ?? [];
        additionalEditActions = (mode === 'edit' ? [...(recordButtons?.additionalEditButtons ?? []), ...dynamicEditActions] : []);
        headerButtons = (recordButtons?.headerButtons?.buttons ?? []).filter(button => !button.hidden);

        prepareNavigationIconScope();
    }

    function navigateToEntity() {
        if (navigationIconScope) {
            window.location.hash = navigationIconScope + "/view/" + recordButtons.model.id;
        }
    }

    function onFollowersUpdated(event: Event) {
        if (recordButtons) {
            recordButtons.followers = (event as CustomEvent).detail;
        }
    }

    function onOverviewFiltersChanged(e: Event) {
        const data = (e as CustomEvent).detail;

        if (!data || !recordButtons) {
            return;
        }

        recordButtons.isOverviewFilterActive = data.isOverviewFilterActive;
    }

    function onButtonsUpdate(event: Event) {
        let detail = (event as CustomEvent).detail;
        if (recordButtons) {
            recordButtons = Object.assign(recordButtons, detail || {});
        } else {
            recordButtons = detail || {} as RecordActionButtons;
        }
    }

    async function loadDynamicActions(): Promise<Record<string, any>[]> {
        try {
            const url = id ? `${scope}/${id}/dynamicActions?type=record` : `${scope}/dynamicActions?type=record`;
            return await ApiClient.get<Record<string, any>[]>(url);
        } catch (error) {
            console.error(error);
            return [];
        }
    }

    function prepareNavigationIconScope() {
        if (scope === 'Entity' && recordButtons.model && recordButtons.model.id) {
            navigationIconScope = recordButtons.model.get('hasMasterDataEntity') ? 'MasterDataEntity' : null;
        } else if (scope === 'MasterDataEntity') {
            navigationIconScope = 'Entity';
        } else {
            navigationIconScope = null;
        }
    }

    function reloadDynamicActions(event: Event | null = null): void {

        prepareNavigationIconScope();

        if (Metadata.get(['scopes', scope, 'actionDisabled'])) {
            return;
        }

        dynamicActions = [];
        dynamicActionsDropdown = [];
        loadingActions = true;

        loadDynamicActions().then((list: Record<string, any>[]) => {
            const preparedList: ActionParams[] = list.map((item: Record<string, any>) => ({
                ...item,
                id: item.data.action_id ?? null
            } as ActionParams));

            dynamicActionMeta = new Map(
                list
                    .filter(item => item.data?.action_id)
                    .map(item => [item.data.action_id, { inBackground: item.inBackground ?? false, type: item.type ?? null }])
            );

            const bookmarkAction: Record<string, any> | undefined = list.filter(item => ['bookmark', 'unbookmark'].includes(item.action)).pop();
            if (bookmarkAction) {
                bookmarkId = bookmarkAction.data.bookmark_id ?? null;
            }

            dynamicActions = preparedList.filter(item => item.display === 'single' && !Metadata.get(['action', 'typesData', item.type || '', 'forEditModeOnly']));
            dynamicActionsDropdown = preparedList.filter(item => item.display === 'dropdown' && !Metadata.get(['action', 'typesData', item.type || '', 'forEditModeOnly']));
            dynamicEditActions = preparedList.filter(item => item.display === 'single' && Metadata.get(['action', 'typesData', item.type || '', 'forEditModeOnly']));
        }).catch(error => {
            console.error(error);
        }).finally(() => loadingActions = false);
    }

    function executeAction(event: CustomEvent): void {
        const data = event.detail.data;
        const meta = data?.id ? dynamicActionMeta.get(data.id) : null;
        recordButtons?.executeAction(event.detail.action, meta ? { ...data, ...meta } : data, event.detail.event || event);
    }

    onMount(() => {
        window.addEventListener('detail:overview-filters-changed', onOverviewFiltersChanged);
        window.addEventListener('record:actions-reload', reloadDynamicActions);
        window.addEventListener('record:buttons-update', onButtonsUpdate);
        window.addEventListener('record:followers-updated', onFollowersUpdated)

        reloadDynamicActions();

        return () => {
            window.removeEventListener('detail:overview-filters-changed', onOverviewFiltersChanged);
            window.removeEventListener('record:actions-reload', reloadDynamicActions);
            window.removeEventListener('record:buttons-update', onButtonsUpdate);
            window.removeEventListener('record:followers-updated', onFollowersUpdated);
        }
    })
</script>

<div class="button-row">
    <ActionButtonGroup actions={recordActions} {dropdownActions}
                 dynamicActionsDropdown={mode !== 'edit' ? dynamicActionsDropdown : []}
                 {executeAction} {loadingActions} hasMoreButton={true} className="record-actions">
        {#if mode === 'detail'}
            {#each additionalActions as action}
                {#if 'dropdownItems' in action && action.dropdownItems?.length }
                    <DropdownActionButton params={action} on:execute={executeAction}
                                          className="additional-button dynamic-action"/>
                {:else}
                    <ActionButton params={action} on:execute={executeAction}
                                  className="additional-button dynamic-action"/>
                {/if}
            {/each}

            {#if loadingActions}
                <button class="preloader additional-button">
                    <Preloader heightPx={12}/>
                </button>
            {/if}
            {#if navigationIconScope}
                <div class="icon-navigation">
                    <button title="{Language.translate(navigationIconScope, 'scopeName', 'Global')}"
                            on:click={navigateToEntity}><i
                            class="ph-{Metadata.get(['clientDefs', navigationIconScope, 'iconClass'])} ph"></i></button>
                </div>
            {/if}
            {#if recordButtons?.headerButtons && headerButtons.find(item => item.name === 'filtering') }
                <FieldStateFilter scope="{scope}" onExecute={executeAction}
                               style="padding-bottom: 0;margin-left: 20px !important;"/>
            {/if}
        {:else if mode === 'edit'}
            {#each additionalEditActions as action}
                {#if 'dropdownItems' in action && action.dropdownItems?.length}
                    <DropdownActionButton params={action} on:execute={executeAction} className="additional-button"/>
                {:else}
                    <ActionButton params={action} on:execute={executeAction} className="additional-button"/>
                {/if}
            {/each}
        {/if}
    </ActionButtonGroup>

    {#if mode === 'detail' && recordButtons?.headerButtons}
        <div class="header-buttons-container">
            <div class="header-buttons">
                <div class="header-items">
                    <TourButton {scope} {mode}/>
                    {#each headerButtons as button}
                        {#if button.name === 'filtering'}
                            <!--Skip-->
                        {:else if ['bookmark', 'unbookmark'].includes(button.action)}
                            {#if id}
                                <BookmarkButton entity={scope} {id} bookmarkId={bookmarkId} loading={loadingActions}/>
                            {/if}
                        {:else if ['follow', 'unfollow'].includes(button.action)}
                            {#if id && recordButtons.followers}
                                <FollowButton entity={scope} {id} followers={recordButtons.followers}
                                              onFollow={callbacks.onFollow} onUnfollow={callbacks.onUnfollow}/>
                            {/if}
                        {:else if button.action === 'navigation'}
                            <PrevNextNavigation hasNext={recordButtons.hasNext} hasPrevious={recordButtons.hasPrevious}
                                               onExecute={executeAction}/>
                        {:else}
                            {#if 'dropdownItems' in button && button.dropdownItems?.length}
                                <DropdownActionButton params={button} on:execute={executeAction}/>
                            {:else}
                                <ActionButton params={button} on:execute={executeAction}/>
                            {/if}
                        {/if}
                    {/each}
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .icon-navigation {
        padding-bottom: 0;
        margin-left: 10px !important;
    }

    .button-row {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
    }

    .button-row :global(.record-actions) {
        gap: 10px;
    }

    .button-row :global(.record-actions > button) {
        -webkit-border-radius: 3px;
        -moz-border-radius: 3px;
        border-radius: 3px;
    }

    .button-row :global(.button-group > .additional-button:first-of-type) {
        margin-left: 10px;
    }

    .button-row .header-buttons .header-items {
        display: flex;
        flex-direction: row;
        white-space: nowrap;
        gap: 10px;
    }

    .preloader {
        background-color: transparent;
        pointer-events: none;
        border: 0;
    }
</style>
