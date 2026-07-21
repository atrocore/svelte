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