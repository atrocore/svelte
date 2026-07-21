/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

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