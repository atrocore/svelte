<!--
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 -->

<script lang="ts">
    import PopoverButton from '$lib/components/buttons/PopoverButton/PopoverButton.svelte';
    import CurrentSelectionPanel from './CurrentSelectionPanel/CurrentSelectionPanel.svelte';
    import { Language } from '$lib/core/language';

    export let renderLinkField: (container: HTMLElement) => void = () => {
    };
    export let onSelectionChange: () => void = () => {
    };
    export let panelWidth: string = '500px';
    export let userModel: any;

    let badgeComponent: PopoverButton;
    let panelComponent: CurrentSelectionPanel;
    let total = 0;

    export function handleSelectionChange(): void {
        if (panelComponent) {
            panelComponent.handleSelectionChange();
        }
    }
</script>

<PopoverButton
        bind:this={badgeComponent}
        title={Language.translate('currentSelection')}
        iconClass="ph ph-basket"
>
    <span slot="badge-indicator" class={"badge number-badge " + (total > 0 ? '' : 'hidden')}>{total}</span>
    <svelte:fragment slot="panel" let:isOpen let:iconElement let:close>
        <CurrentSelectionPanel
                bind:this={panelComponent}
                bind:total
                icon={iconElement}
                {isOpen}
                {close}
                {renderLinkField}
                {onSelectionChange}
                {userModel}
                width={panelWidth}
        />
    </svelte:fragment>
</PopoverButton>

<style>
    .number-badge {
        position: absolute;
        top: 3px;
        left: 24px;
        z-index: 10;
        font-size: 9px;
        padding: 2px 5px;
        background-color: #ef990e;
        color: #fff;
    }
</style>
