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

interface MetadataInterface {
    get(path: string[]): any
}

const data = writable<MetadataInterface>();

export const Metadata = {

    setMetadata(metadata: MetadataInterface): void {
        data.set(metadata);
    },

    get(path: string[]): any {
        let res = null
        data.subscribe((current: MetadataInterface) => {
            if (current) {
                res = current.get(path);
            }
        })();
        return res
    },
};