<script lang="ts">
    import { Language } from "$lib/core/language";

    import BreadcrumbsItem from "$lib/types/ui/header/breadcrumbs-item";
    import AdminCardGroup from "./types/admin-card-group";
    import { getAdminCardGroups } from "./utils/admin-utils";

    import BaseHeader from "$lib/components/headers/BaseHeader/BaseHeader.svelte";
    import Collapser from "$lib/components/collapsers/Collapser/Collapser.svelte";

    import TreePanel from "$lib/components/panels/TreePanel/TreePanel.svelte";

    export let cacheDate: string | null = null;

    const breadcrumbs: BreadcrumbsItem[] = [
        {
            label: Language.translate('Administration')
        }
    ];

    const groups: AdminCardGroup[] = getAdminCardGroups(cacheDate);
</script>

<TreePanel isAdminPage={true} scope="Administration" mode="detail"/>
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
                            <a href={item.url} class="card" class:has-alert={!!item.alert} title={item.tooltip}>
                                <div class="top">
                                    <i class="{item.icon} icon"></i>
                                    <span class="title">{item.title}</span>
                                </div>
                                <div class="description">{item.description}</div>
                                {#if item.alert || item.docsUrl}
                                    <div class="bottom">
                                        {#if item.docsUrl}
                                            <a href={item.docsUrl} target="_blank"
                                               class="help-link">{Language.translate('Help Center')}</a>
                                        {/if}

                                        {#if item.alert}
                                            <i title={item.alert} class="ph ph-warning-circle alert-icon"></i>
                                        {/if}
                                    </div>
                                {/if}
                            </a>
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
        margin-bottom: 20px;
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

    .card {
        display: flex;
        flex-direction: column;
        padding: 15px;
        background-color: #fff;
    }

    .card:hover, .card:focus {
        background-color: #f8f8f8;
    }

    .card:active {
        background-color: #f3f3f3;
    }

    .card i.icon {
        font-size: 30px;
    }

    .card .title {
        font-size: 16px;
    }

    .card > * {
        flex-shrink: 0;
    }

    .card .description {
        flex: 1;
        min-height: 0;
        color: #666;
    }

    .card .bottom {
        margin-top: 10px;
        margin-bottom: -5px;
    }

    .card .help-link {
        font-size: 12px;
        float: left;
    }

    .card.has-alert .icon,
    .card.has-alert .title,
    .card.has-alert .description,
    .card .alert-icon {
        color: #dc3545;
    }

    .card .alert-icon {
        float: right;
    }

    .card.has-alert {
        border-color: #dc3545;
    }

    @media screen and (max-width: 767px) {
        .admin-content :global(details summary) {
            margin-left: -10px;
            margin-right: -10px;
            padding-left: 10px;
            padding-right: 10px;
        }
    }
</style>