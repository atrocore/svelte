<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { onMount } from "svelte";
    import { Metadata } from '$lib/core/metadata';
    import { Language } from "$lib/core/language";
    import { Acl } from "$lib/core/acl";

    import type EntityCallbacks from "$lib/components/headers/EntityActionsGroup/types/entity-callbacks";
    import type EntityActionButtons from "$lib/components/headers/EntityActionsGroup/types/entity-actions-buttons";

    import FavoriteEntityButton from "$lib/components/entity-actions/FavoriteEntityButton/FavoriteEntityButton.svelte";
    import ActionButtonGroup from "$lib/components/ActionButtonGroup/ActionButtonGroup.svelte";
    import type ActionParams from "$lib/types/ui/action-params";
    import TourButton from "$lib/components/entity-actions/TourButton/TourButton.svelte";
    import Preloader from "$lib/components/loaders/Preloader/Preloader.svelte";
    import EntityStatusIndicator from "$lib/components/EntityStatusIndicator/EntityStatusIndicator.svelte";
    import type EntityStat from "$lib/components/headers/EntityActionsGroup/types/entity-stat";

    export let scope: string;
    export let isFavoriteEntity: boolean = false;
    export let entityActions: EntityActionButtons;
    export let callbacks: EntityCallbacks;
    export let entityStats: EntityStat[][] = [];
    export let entityStatsLoading: boolean = false;

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
                           entityName={scope} dropdownPosition="right">
            <div class="left-extra-buttons">
                {#if hasFavoriteButton}
                    <FavoriteEntityButton
                            active={isFavoriteEntity}
                            onFavoriteAdd={callbacks.onAddFavorite}
                            onFavoriteRemove={callbacks.onRemoveFavorite}
                            {scope}
                    />
                {/if}
                {#if Acl.check(contributorEntityId, 'read') && contributorEntityId}
                    <a role="button" title={Language.translate('openContributorEntity')} href="#{contributorEntityId}">
                        <i class="ph ph-signpost"></i>
                    </a>
                {/if}
                <TourButton {scope} mode="list"/>
            </div>
        </ActionButtonGroup>
    </div>
    <div class="right-group">
        <div class="entity-buttons">
            {#if entityStats.length > 0}
                <div class="entity-stats-container">
                    {#if entityStatsLoading}
                        <Preloader heightPx={14}/>
                    {:else}
                        {#each entityStats as group}
                            <div class="group">
                                {#each group as stat, i}
                                    <span class="entity-stat" data-name={stat.name}><i class="ph {stat.icon}"></i><span class="stat-label">{stat.label}:</span><span class="stat-value">{stat.value}</span></span><!--{#if i < group.length - 1}<span class="separator"><i class="ph ph-dot"></i></span>{/if}-->
                                {/each}
                            </div>
                        {/each}
                    {/if}
                </div>
            {/if}

            <EntityStatusIndicator {scope}/>

            {#if Acl.check(primaryEntityId, 'read') && primaryEntityId}
                <a role="button" title={Language.translate('openPrimaryEntity')} href="#{primaryEntityId}">
                    <i class="ph ph-crown"></i>
                </a>
            {/if}
        </div>
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

    .entity-stats-container {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 15px;
    }

    .entity-stats-container .group {
        display: flex;
        align-items: center;
        gap: 20px;
    }

    .entity-stat {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        line-height: 1;
    }

    .entity-stat .stat-value {
        font-weight: bold;
    }

    .entity-stats-container .separator {
        margin: 0 7px;
        color: #999;
    }

    .action-group-container {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
    }

    .action-group-container .left-extra-buttons {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
        margin-left: 20px;
    }
</style>
