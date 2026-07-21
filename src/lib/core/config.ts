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

interface ConfigInterface {
    get(key: string): any
}

const data = writable<ConfigInterface>();

export const Config = {

    setConfig(config: ConfigInterface): void {
        data.set(config);
    },

    get(key: string): any {
        let res = null
        data.subscribe((current: ConfigInterface) => {
            if (current) {
                res = current.get(key);
            }
        })();
        return res
    },
};