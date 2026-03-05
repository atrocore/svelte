import { type Writable, writable } from 'svelte/store';

type GeneralFilterStore = {
    selectBoolFilters: Writable<string[]>;
    advancedFilterChecked: Writable<boolean>;
    advancedFilterDisabled: Writable<boolean>;
    toggleBoolFilters: (filter: string) => void;
    key?: string;
};

let stores = new Map<string, GeneralFilterStore>();

function createStore(): GeneralFilterStore {
    const selectBoolFilters = writable<string[]>([]);
    const advancedFilterChecked = writable(false);
    const advancedFilterDisabled = writable(false);

    function toggleBoolFilters(filter: string): void {
        selectBoolFilters.update((selected) => {
            if (selected.includes(filter)) {
                return selected.filter(v => v !== filter);
            } else {
                return [...selected, filter];
            }
        })
    }

    return {
        selectBoolFilters,
        advancedFilterChecked,
        advancedFilterDisabled,
        toggleBoolFilters
    }
}

export function getGeneralFilterStore(uniqueKey: string | null): GeneralFilterStore {
    uniqueKey = uniqueKey ?? 'default';
    let store = stores.get(uniqueKey);
    if (!store) {
        store = createStore();
        store.key = uniqueKey;
        stores.set(uniqueKey, store);
    }
    return store;
}