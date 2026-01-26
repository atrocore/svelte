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

type StorageAdapter = {
    get(type: string, name: string): any;
    has(type: string, name: string): boolean;
    clear(type: string, name: string): void;
    set(type: string, name: string, value: any): void;
};

const data = writable<StorageAdapter>();

export const Storage = {

    setStorage(storage: StorageAdapter): void {
        data.set(storage);
    },

    get(type: string, name: string): any {
        let res = null;
        data.subscribe((current: StorageAdapter) => {
            if (current) {
                res = current.get(type, name);
            }
        })();
        return res;
    },

    has(type: string, name: string): any {
        let res = null;
        data.subscribe((current: StorageAdapter) => {
            if (current) {
                res = current.has(type, name);
            }
        })();
        return res;
    },

    clear(type: string, name: string): any {
        data.subscribe((current: StorageAdapter) => {
            if (current) {
                current.clear(type, name);
            }
        })();
    },

    set(type: string, name: string, value: any): any {
        data.subscribe((current: StorageAdapter) => {
            if (current) {
                current.set(type, name, value);
            }
        })();
    },
};
