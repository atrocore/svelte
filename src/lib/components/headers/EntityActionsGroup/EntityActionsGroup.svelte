<script lang="ts">
    import { onMount } from "svelte";
    import { Metadata } from '$lib/core/metadata';
    import { Language } from "$lib/core/language";
    import { Acl } from "$lib/core/acl";

    import type EntityCallbacks from "$lib/components/headers/EntityActionsGroup/types/entity-callbacks";
    import type EntityActionButtons from "$lib/components/headers/EntityActionsGroup/types/entity-actions-buttons";

    import FavoriteEntityButton from "$lib/components/entity-actions/FavoriteEntityButton/FavoriteEntityButton.svelte";
    import ActionButtonGroup from "$lib/components/ActionButtonGroup/ActionButtonGroup.svelte";
    import ViewModeSwitch from "$lib/components/entity-actions/ViewModeSwitch/ViewModeSwitch.svelte";
    import type ActionParams from "$lib/types/ui/action-params";
    import TourButton from "$lib/components/entity-actions/TourButton/TourButton.svelte";

    export let scope: string;
    export let viewMode: string;
    export let isFavoriteEntity: boolean = false;
    export let entityActions: EntityActionButtons;
    export let callbacks: EntityCallbacks;
    export let onViewChange: (e: CustomEvent) => void;

    let actions: ActionParams[];
    let dropdownActions: ActionParams[];

    let dynamicActions: ActionParams[] = [];
    let dynamicDropdownActions: ActionParams[] = [];
    let hasFavoriteButton: boolean = false;
    let primaryEntityId: string | null = null;
    let contributorEntityId: string | null = null;

    $: {
        actions = [...entityActions.buttons ?? [], ...dynamicActions];
        dropdownActions = [...entityActions.dropdownButtons ?? [], ...dynamicDropdownActions];
    }

    window.addEventListener('favorites:update', ((e: CustomEvent) => {
        const list: string[] = e.detail || [];
        isFavoriteEntity = list.includes(scope);
    }) as EventListener);

    function loadDynamicActions(): void {
        const single = new Map<string, ActionParams>();
        const dropdown = new Map<string, ActionParams>();

        (Metadata.get(['clientDefs', scope, 'dynamicEntityActions']) || []).forEach((dynamicAction: Record<string, any>) => {
            if (!callbacks.canRunAction(dynamicAction.acl.scope, dynamicAction.acl.action)) {
                return;
            }

            if (dynamicAction.display === 'dropdown' && !dropdown.has(dynamicAction.id)) {
                dropdown.set(dynamicAction.id, {
                    label: dynamicAction.name,
                    action: "dynamicEntityAction",
                    id: dynamicAction.id
                } as ActionParams);
            }

            if (dynamicAction.display === 'single' && !single.has(dynamicAction.id)) {
                single.set(dynamicAction.id, {
                    label: dynamicAction.name,
                    action: "dynamicEntityAction",
                    id: dynamicAction.id
                } as ActionParams)
            }
        });

        dynamicActions = Array.from(single.values());
        dynamicDropdownActions = Array.from(dropdown.values());
    }

    function getContributorEntity(code: string): string | null {
        const scopes: Record<string, any> = Metadata.get(['scopes']);
        for (const [key, defs] of Object.entries(scopes)) {
            if (defs.primaryEntityId === code && defs.role === 'contributor') {
                return key;
            }
        }

        return null;
    }

    onMount(() => {
        primaryEntityId = Metadata.get(['scopes', scope, 'primaryEntityId']);
        contributorEntityId = primaryEntityId ? null : getContributorEntity(scope);

        hasFavoriteButton = Metadata.get(['scopes', scope, 'tab']);
        loadDynamicActions();
    });
</script>

<div class="buttons-container">
    <div class="action-group-container">
        <ActionButtonGroup {actions} {dropdownActions} className="entity-actions" hasMoreButton={true}
                           entityName={scope} dropdownPosition="right"/>
    </div>
    <div class="right-group">
        <div class="entity-buttons">
            <TourButton {scope} mode="list"/>
            {#if Acl.check(contributorEntityId, 'read') && contributorEntityId}
                <a role="button" title={Language.translate('openStagingEntity')} href="#{contributorEntityId}">
                    <i class="ph ph-signpost"></i>
                </a>
            {/if}
            {#if Acl.check(primaryEntityId, 'read') && primaryEntityId}
                <a role="button" title={Language.translate('openPrimaryEntity')} href="#{primaryEntityId}">
                    <i class="ph ph-crown"></i>
                </a>
            {/if}
            {#if hasFavoriteButton}
                <FavoriteEntityButton
                        active={isFavoriteEntity}
                        onFavoriteAdd={callbacks.onAddFavorite}
                        onFavoriteRemove={callbacks.onRemoveFavorite}
                        {scope}
                />
            {/if}
        </div>

        <ViewModeSwitch mode={viewMode} {scope} on:view-change={onViewChange}/>
    </div>
</div>

<style>
    .buttons-container {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: space-between;
        margin: 15px 0;
    }

    .buttons-container :global(.entity-actions) {
        gap: 10px;
    }

    .buttons-container :global(.entity-actions button) {
        border-radius: 3px;
    }

    .buttons-container .right-group {
        display: flex;
        margin-left: auto;
        margin-right: 0;
    }

    .buttons-container .right-group .entity-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
    }

    .buttons-container .right-group .entity-buttons:not(:last-child) {
        margin-right: 20px;
    }

    .action-group-container {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
    }
</style>
