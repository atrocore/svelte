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

/**
 * Opens the session of the user interface: the server sets the session cookies.
 */
export async function signInToUserInterface(username: string, password: string): Promise<void> {
    await ApiClient.post<boolean>('oauth/signIn', { username, password });
}
