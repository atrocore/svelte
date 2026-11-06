<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { Language } from "$lib/core/language";

    import type BreadcrumbsItem from "$lib/types/ui/header/breadcrumbs-item";
    import type AdminCardGroup from "./types/admin-card-group";
    import { getAdminCardGroups } from "./utils/admin-utils";

    import BaseHeader from "$lib/components/headers/BaseHeader/BaseHeader.svelte";
    import Collapser from "$lib/components/collapsers/Collapser/Collapser.svelte";
    import IconCard from "$lib/components/IconCard/IconCard.svelte";

    export let cacheDate: string | null = null;

    const breadcrumbs: BreadcrumbsItem[] = [
        {
            label: Language.translate('Administration')
        }
    ];

    const groups: AdminCardGroup[] = getAdminCardGroups(cacheDate);
</script>

<main>
    <div class="admin-page">
        <div class="page-header">
            <BaseHeader {breadcrumbs} scope="App" id="Administration"/>
        </div>

        <div class="admin-content">
            {#each groups as group}
                <Collapser opened={true} title={group.title}>
                    <div class="cards-container">
                        {#each group.items as item}
                            <IconCard
                                href={item.url}
                                iconClass={item.icon}
                                title={item.title}
                                description={item.description}
                                tooltip={item.tooltip}
                                alert={item.alert}
                                docsUrl={item.docsUrl}
                            />
                        {/each}
                    </div>
                </Collapser>
            {/each}
        </div>
    </div>
</main>

<style>
    .admin-page {
        padding: 0 20px 20px;
    }

    .admin-page .page-header {
        margin: 0 -20px 20px;
    }

    .admin-page .page-header :global(h3) {
        font-size: 24px;
    }

    .admin-content :global(details:not(:last-child)) {
        margin-bottom: 10px;
    }

    .admin-content :global(details summary) {
        margin-left: -20px;
        margin-right: -20px;
        padding-left: 20px;
        padding-right: 20px;
    }

    .admin-content :global(details summary:hover) {
        background-color: #f7f7f7;
    }

    .cards-container {
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 15px;
        margin: 5px 0 10px;
    }

    .cards-container > :global(.card) {
        display: flex;
        flex-direction: column;
        padding: 15px;
        background-color: #fff;
    }

    .cards-container > :global(.card:hover),
    .cards-container > :global(.card:focus) {
        background-color: #f8f8f8;
    }

    .cards-container > :global(.card:active) {
        background-color: #f3f3f3;
    }

    .cards-container > :global(.card > *) {
        flex-shrink: 0;
    }

    .cards-container > :global(.card i.icon) {
        font-size: 30px;
    }

    .cards-container > :global(.card .title) {
        font-size: 16px;
    }

    .cards-container > :global(.card .description) {
        flex: 1;
        min-height: 0;
    }

    @media screen and (max-width: 767px) {
        .admin-page .page-header {
            margin-left: -10px;
        }

        .admin-content :global(details summary) {
            margin-left: -10px;
            margin-right: -10px;
            padding-left: 10px;
            padding-right: 10px;
        }
    }
</style>