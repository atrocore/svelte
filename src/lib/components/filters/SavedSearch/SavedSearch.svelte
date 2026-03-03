<script lang="ts">
    import { onDestroy } from "svelte";
    import { Language } from "$lib/core/language"
    import { Notifier } from "$lib/core/notifier";
    import { Acl } from "$lib/core/acl";
    import Preloader from "$lib/components/loaders/Preloader/Preloader.svelte";
    import { getSavedSearchStore } from "$lib/stores/saved-search.store";
    import type SavedSearch from "./types/saved-search"
    import { get } from "svelte/store"
    import Collapser from "$lib/components/collapsers/Collapser/Collapser.svelte";
    import { UserData } from "$lib/core/user-data";

    export let scope: string;
    export let savedSearchList: Array<SavedSearch> = [];
    export let opened: boolean = true;
    export let loading: boolean = true;
    export let searchManager: any;
    export let hideRowAction: boolean = false;
    export let uniqueKey: string | null;
    export let editingItem: SavedSearch | null = null;
    export let edit: (item: SavedSearch) => void = () => {};
    export let copy: (item: SavedSearch) => void = () => {};
    export let rename: (item: SavedSearch) => void = () => {};
    export let remove: (item: SavedSearch) => void = () => {};
    export let cancel: () => void = () => {};

    export let selectedSavedSearchIds: Array<string> = [];

    let savedSearchStore = getSavedSearchStore(scope, uniqueKey, {
        items: searchManager.savedSearchList || [],
        selectedItems: searchManager.getSavedFilters().map(v => v.id)
    });

    let savedSearchSubscribe = savedSearchStore.savedSearchItems.subscribe(value => {
        savedSearchList = value;
    });

    const selectedSavedItemIdsSub = savedSearchStore.selectedSavedItemIds.subscribe(value => {
        selectedSavedSearchIds = value;
    });

    const loadingSubscribe = savedSearchStore.loading.subscribe(value => {
        loading = value;
    });

    function handleSavedSearchChecked(e: Event, item: SavedSearch): void {
        savedSearchStore.toggleSavedItemSelection(item.id);
        let checked = get(savedSearchStore.selectedSavedItemIds);
        searchManager.update({
            savedFilters: get(savedSearchStore.savedSearchItems).filter(item => checked.includes(item.id))
        });
        updateCollection();
    }

    function isOwner(item: SavedSearch): boolean {
        const userData = UserData.get();
        return userData?.user?.id === item.userId || userData?.user?.isAdmin;
    }

    function updateCollection(): void {
        Notifier.notify(Language.translate('loading', 'messages'));
        searchManager.fetchCollection();
    }

    onDestroy(() => {
        savedSearchSubscribe();
        selectedSavedItemIdsSub();
        loadingSubscribe();
    });

</script>

<Collapser bind:opened={opened} className="checkboxes-filter" title={Language.translate('Saved Filters')}>
    {#if loading}
        <div style="margin-top: 5px;">
            <Preloader heightPx={12}/>
        </div>
    {:else if savedSearchList.length > 0}
        <ul>
            {#each savedSearchList as item}
                <li class="checkbox">
                    <label class:active={selectedSavedSearchIds.includes(item.id)}>
                        <input type="checkbox" checked={selectedSavedSearchIds.includes(item.id)}
                               on:change={(e) => handleSavedSearchChecked(e, item)} name="{item.id}">
                        <span>{item.name}</span>
                        <sup class="status-icons">
                            {#if item.isPublic}
                                <i class="ph ph-users-three visibility"></i>
                            {:else}
                                <i class="ph ph-shield visibility"></i>
                            {/if}
                        </sup>
                    </label>
                    {#if (Acl.check('SavedSearch', 'edit') || Acl.check('SavedSearch', 'delete')) && !hideRowAction}
                        <div class="list-row-buttons btn-group">
                            {#if editingItem?.id === item.id}
                                <span on:click={cancel} style="position:absolute; right: 20px; cursor: pointer"><i
                                        class="ph ph-pencil-simple-slash"></i></span>
                            {/if}
                            <a style="cursor: pointer; color: var(--action-icon-color)" href="javascript:"
                               class="dropdown-toggle" data-toggle="dropdown">
                                <i class="ph ph-dots-three-vertical"></i>
                            </a>
                            <ul class="dropdown-menu pull-right">
                                {#if editingItem?.id === item.id}
                                    <li><a on:click={cancel}>{Language.translate('Cancel Edit')}</a></li>
                                {:else}
                                    <li><a on:click={() => {copy(item)}}>{Language.translate('Copy')}</a></li>
                                    {#if isOwner(item)}
                                        <li><a on:click={() => {edit(item)}}>{Language.translate('Edit')}</a></li>
                                    {/if}
                                {/if}
                                {#if isOwner(item)}
                                    <li><a on:click={() => rename(item)}>{Language.translate('Rename')}</a></li>
                                    <li><a on:click={() => remove(item)}>{Language.translate('Remove')}</a></li>
                                {/if}
                            </ul>
                        </div>
                    {/if}
                </li>
            {/each}
        </ul>
    {:else}
        <span class="empty-filters-placeholder">{Language.translate('emptySavedSearchPlaceholder')}</span>
    {/if}
</Collapser>

<style>
    ul {
        padding: 0;
    }

    .visibility:not(:first-child) {
        margin-left: 3px;
    }

    .empty-filters-placeholder {
        min-height: 20px;
        font-size: 12px;
        margin-top: 4px;
        display: block;
    }

    .dropdown-menu li {
        cursor: pointer;
    }
</style>
