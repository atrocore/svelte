import { writable } from 'svelte/store';

type ModelFactoryAdapter = {
    create(modelName: string, callback: Function): void
}

const data = writable<ModelFactoryAdapter>();

export const ModelFactory = {

    setModelFactory(modelFactory: ModelFactoryAdapter): void {
        data.set(modelFactory);
    },
    create(modelName: string, callback: Function): void {
        let res = null
        data.subscribe((current: ModelFactoryAdapter) => {
            if (current) {
                current.create(modelName, callback);
            }
        })();
    },
};