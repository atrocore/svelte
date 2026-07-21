<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import DropdownActionButton from "$lib/components/buttons/DropdownActionButton/DropdownActionButton.svelte";
    import ActionButton from "$lib/components/buttons/ActionButton/ActionButton.svelte";
    import type ActionParams from "$lib/types/ui/action-params";
    import type ActionButtonParams from "$lib/components/buttons/ActionButton/types/action-button-params";
    import type DropdownActionParams from "$lib/components/buttons/DropdownActionButton/types/dropdown-action-params";

    export let actions: (ActionButtonParams | DropdownActionParams)[] = [];
    export let dropdownActions: ActionParams[] = [];
    export let dynamicActionsDropdown: ActionParams[] = [];
    export let loadingActions: boolean = false;
    export let hasMoreButton: boolean = false;
    export let dropdownPosition: string = 'left';
    export let className: string = '';
    export let entityName: string = '';
    export let executeAction: (e: CustomEvent<any>) => void = () => {
    };
</script>

<div class="button-group {className}">
    {#each actions as action}
        {#if 'dropdownItems' in action && action.dropdownItems?.length}
            <DropdownActionButton params={action} on:execute={executeAction}/>
        {:else}
            <ActionButton params={action} entityName={entityName} on:execute={executeAction}/>
        {/if}
    {/each}

    <DropdownActionButton dropdownItems={dropdownActions} dynamicItems={dynamicActionsDropdown}
                          loading={loadingActions} {hasMoreButton} {dropdownPosition}
                          on:execute={executeAction}/>

    <slot></slot>
</div>
