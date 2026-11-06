<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { Language } from '$lib/core/language';
    import { Metadata } from '$lib/core/metadata';
    import { Acl } from '$lib/core/acl';
    import { getTabIcon } from '$lib/helpers/icon';

    import Modal from '$lib/components/modals/Modal/Modal.svelte';
    import IconCard from '$lib/components/IconCard/IconCard.svelte';
    import Collapser from '$lib/components/collapsers/Collapser/Collapser.svelte';
    import type { SubtypeOption } from './types/subtype-option';
    import { groupSubtypeOptions } from './utils/subtype-groups';

    export let scope: string;
    export let onSelect: (subtype: string) => void;
    export let onClose: () => void;

    const subtypeScopes: Record<string, string> = Metadata.get(['scopes', scope, 'subtypeScopes']) || {};

    const options: SubtypeOption[] = Object.entries(subtypeScopes)
        .filter(([, subtype]) => Acl.check(subtype, 'create'))
        .map(([type, subtype]) => {
            const description = Language.has(subtype, 'subtypeDescriptions', 'Global')
                ? Language.get('Global', 'subtypeDescriptions', subtype)
                : null;

            return {
                scope: subtype,
                label: Language.translateOption(type, 'type', scope),
                description: typeof description === 'string' && description ? description : null,
                icon: getTabIcon(subtype),
                group: Metadata.get(['scopes', subtype, 'subtypeGroup']) || null
            };
        });

    const groups = groupSubtypeOptions(options, name => Language.translate(name, 'subtypeGroups', scope));
</script>

<Modal
    header={`${Language.translate(scope, 'scopeNames')}: ${Language.translate('selectType', 'labels', 'Global')}`}
    {onClose}
    closeOnEscape={true}
    closeOnBackdrop={true}
    position="top"
    size="large"
>
    <div class="subtype-groups">
        {#each groups as group (group.name)}
            {#if group.label}
                <Collapser opened={true} title={group.label}>
                    <div class="cards-container">
                        {#each group.options as option (option.scope)}
                            <IconCard
                                iconSrc={option.icon}
                                title={option.label}
                                description={option.description}
                                onClick={() => onSelect(option.scope)}
                            />
                        {/each}
                    </div>
                </Collapser>
            {:else}
                <div class="cards-container">
                    {#each group.options as option (option.scope)}
                        <IconCard
                            iconSrc={option.icon}
                            title={option.label}
                            description={option.description}
                            onClick={() => onSelect(option.scope)}
                        />
                    {/each}
                </div>
            {/if}
        {/each}
    </div>
</Modal>

<style>
    .subtype-groups :global(details:not(:last-child)) {
        margin-bottom: 10px;
    }

    .subtype-groups :global(details summary) {
        margin-left: -20px;
        margin-right: -20px;
        padding-left: 20px;
        padding-right: 20px;
    }

    .subtype-groups > :global(*:not(:first-child)) {
        margin-top: 20px;
    }

    .subtype-groups :global(details summary:hover) {
        background-color: #f7f7f7;
    }

    .subtype-groups :global(details .cards-container) {
        margin: 5px 0 10px;
    }

    .cards-container {
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    }
</style>
