/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

import { ApiClient } from "$lib/core/api-client";

export type UserSessionResponse = {
    token: string;
    user: any;
    preferences: any;
    acl: any;
    settings: any;
    appParams: any;
};

export function login(username: string, password: string): Promise<UserSessionResponse> {
    return ApiClient.get<UserSessionResponse>('userSession', undefined, {
        Authorization: 'Basic ' + btoa(`${username}:${password}`),
    });
}
