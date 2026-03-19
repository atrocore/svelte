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

import User from "$lib/types/entity/user";

type UserDataType = {
    preferences: {
        language: string | null;
    };
    user: User;
    token: string;
};

const data = writable({});

export const UserData = {

    set(userData: any): void {
        data.set(userData);
    },

    get(): UserDataType | null {
        let res = null;

        data.subscribe((current) => {
            if (current) {
                res = current;
            }
        })();

        return res;
    },
};
