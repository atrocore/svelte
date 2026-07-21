/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

import { ApiClient } from '$lib/core/api-client';

export async function addBookmark(entityType: string, entityId: string): Promise<Record<string, any> | null> {
    try {
        return await ApiClient.post<Record<string, any>>('Bookmark', { entityType, entityId });
    } catch {
        return null;
    }
}

export async function removeBookmark(bookmarkId: string): Promise<boolean> {
    try {
        await ApiClient.delete(`Bookmark/${bookmarkId}`, undefined, { 'permanently': 'true' });
        return true;
    } catch {
        return false;
    }
}
