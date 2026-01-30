import { writable } from 'svelte/store';

type CollectionFactoryAdapter = {
    create(modelName: string, callback: Function): void
}

const data = writable<CollectionFactoryAdapter>();

export const CollectionFactory = {

    setCollectionFactory(collectionFactory: CollectionFactoryAdapter): void {
        data.set(collectionFactory);
    },
    create(modelName: string, callback: Function): void {
        let res = null
        data.subscribe((current: CollectionFactoryAdapter) => {
            if (current) {
                current.create(modelName, callback);
            }
        })();
    },
};