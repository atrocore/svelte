/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

import { Utils } from '$lib/core/utils';

export async function fetchSelectionItems(selectionId: string, offset: number = 0, maxSize: number = 20): Promise<Response> {
    return Utils.getRequest('SelectionItem', {
        maxSize: String(maxSize),
        offset: String(offset),
        where: JSON.stringify([
            {
                attribute: 'selectionId',
                type: 'equals',
                value: selectionId
            }
        ])
    });
}

export async function deleteSelectionItem(selectionItemId: string): Promise<Response> {
    return Utils.request('DELETE', `SelectionItem/${selectionItemId}`, null);
}
