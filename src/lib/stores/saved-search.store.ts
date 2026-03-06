import { get, type Writable, writable } from 'svelte/store';
import type SavedSearch from '$lib/components/filters/SavedSearch/types/saved-search'
import type Collection from '$lib/types/entity/collection'
import { ApiClient } from '$lib/core/api-client';

type SavedSearchStore = {
    savedSearchItems: Writable<SavedSearch[]>;
    selectedSavedItemIds: Writable<string[]>;
    collection: Writable<Collection | null>;
    loading: Writable<boolean>;
    fetchSavedSearch: (scope: string) => Promise<SavedSearch[] | undefined>;
    toggleSavedItemSelection: (itemId: string) => void;
    saveSavedSearch: (item: Record<string, any>, id?: string | null) => Promise<SavedSearch | undefined>;
    removeSavedSearch: (itemId: string) => Promise<void>;
    key?: string;
};

let stores = new Map<string, SavedSearchStore>();

function createStore(): SavedSearchStore {
    const savedSearchItems = writable<SavedSearch[]>([]);
    const selectedSavedItemIds = writable<string[]>([]);
    const collection = writable<Collection | null>(null);
    const loading = writable(false);
    let savedSearchFetched: boolean = false;

    async function fetchSavedSearch(scope: string): Promise<SavedSearch[] | undefined> {
        if (get(loading) || savedSearchFetched) {
            return;
        }

        loading.set(true);

        let where = [{
            type: 'equals',
            attribute: 'entityType',
            value: scope
        }];
        const queryString = window.$.param({
            collectionOnly: true,
            maxSize: 20,
            where
        });
        savedSearchFetched = true;

        try {
            const data = await ApiClient.get<any>(`SavedSearch?${queryString}`);
            savedSearchItems.set(data.list);
            loading.set(false);
            return data.list;
        } catch {
            loading.set(false);
        }
    }

    async function saveSavedSearch(item: Record<string, any>, id: string | null = null): Promise<SavedSearch | undefined> {
        try {
            const data = id
                ? await ApiClient.patch<SavedSearch>(`SavedSearch/${id}`, item)
                : await ApiClient.post<SavedSearch>('SavedSearch', item);

            savedSearchItems.update((list) => {
                if (id !== null) {
                    return list.map(item => item.id === id ? data : item);
                }
                return [data, ...list];
            });
            return data;
        } catch {
            return undefined;
        }
    }

    async function removeSavedSearch(itemId: string): Promise<void> {
        try {
            await ApiClient.delete(`SavedSearch/${itemId}`);
            savedSearchItems.update((list) => list.filter(v => v.id !== itemId));
        } catch {
            // ignore
        }
    }

    function toggleSavedItemSelection(itemId: string): void {
        selectedSavedItemIds.update((selected) => {
            if (selected.includes(itemId)) {
                return selected.filter((id) => id !== itemId);
            } else {
                return [...selected, itemId];
            }
        });
    }

    return {
        savedSearchItems,
        selectedSavedItemIds,
        collection,
        loading,
        fetchSavedSearch,
        toggleSavedItemSelection,
        saveSavedSearch,
        removeSavedSearch
    }
}

export function getSavedSearchStore(scope: string, uniqueKey: string | null, initial: Record<string, any> | null = null): SavedSearchStore {
    const key = scope + '_' + (uniqueKey ?? 'default');
    let store = stores.get(key);
    if (!store) {
        store = createStore();
        store.key = key;
        stores.set(key, store);

        if (initial) {
            store.savedSearchItems.set(initial.items ?? []);
            store.selectedSavedItemIds.set(initial.selectedItems ?? []);
        }

        store.fetchSavedSearch(scope);
    }
    return store;
}
