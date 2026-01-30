import { writable } from 'svelte/store';

type ModelFactoryCallback = (model: Record<string, any>) => void;

interface ModelFactoryInterface {
    create(modelName: string, callback: ModelFactoryCallback): void
}

const data = writable<ModelFactoryInterface>();

export const ModelFactory = {
    setModelFactory(modelFactory: ModelFactoryInterface): void {
        data.set(modelFactory);
    },

    create(modelName: string, callback: ModelFactoryCallback): void {
        data.subscribe((current: ModelFactoryInterface) => {
            if (current) {
                current.create(modelName, callback);
            }
        })();
    },
};