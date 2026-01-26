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
    import BaseNavbarButton from '$lib/components/navbar-buttons/BaseNavbarButton/BaseNavbarButton.svelte';
    import CurrentSelectionPanel from './CurrentSelectionPanel/CurrentSelectionPanel.svelte';
    import { Language } from '$lib/core/language';

    export let renderLinkField: (container: HTMLElement) => void = () => {
    };
    export let onSelectionChange: () => void = () => {
    };
    export let panelWidth: string = '500px';
    export let userModel: any;

    let badgeComponent: BaseNavbarButton;
    let panelComponent: CurrentSelectionPanel;

    export function handleSelectionChange(): void {
        if (panelComponent) {
            panelComponent.handleSelectionChange();
        }
    }
</script>

<BaseNavbarButton
        bind:this={badgeComponent}
        title={Language.translate('currentSelection')}
        iconClass="ph ph-basket"
>
    <svelte:fragment slot="panel" let:isOpen let:iconElement let:close>
        <CurrentSelectionPanel
                bind:this={panelComponent}
                icon={iconElement}
                {isOpen}
                {close}
                {renderLinkField}
                {onSelectionChange}
                {userModel}
                width={panelWidth}
        />
    </svelte:fragment>
</BaseNavbarButton>
