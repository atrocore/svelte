/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

import { UserData } from "$lib/core/user-data";
import { Notifier } from "$lib/dom/notifier";
import { ApiClient } from '$lib/core/api-client';

export async function startStopJm(pause: boolean) {
    let userData = UserData.get();
    if (!userData) {
        return;
    }

    try {
        await ApiClient.post('jobManagerPause', { pause });
        Notifier.notify('Done', 'success');
    } catch (error) {
        console.error('Error:', error);
    }
}
