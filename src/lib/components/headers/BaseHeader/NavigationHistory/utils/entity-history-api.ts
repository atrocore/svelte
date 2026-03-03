/*
 *  AtroCore Software
 *
 *  This source file is available under GNU General Public License version 3 (GPLv3).
 *  Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 *  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 *  @license    GPLv3 (https://www.gnu.org/licenses/)
 */

import { Utils } from "$lib/core/utils";

import type EntityHistoryResponse
    from "$lib/components/headers/BaseHeader/NavigationHistory/types/entity-history-response";

export async function loadLastEntities(scope: string, id: string | null, tabId: string | null): Promise<EntityHistoryResponse> {
    let params: Record<string, any> = {
        'maxSize': '32',
        'entity': scope
    };

    if (id) {
        params.id = id;
    }

    if (tabId) {
        params.tabId = tabId;
    }

    let entityHistory = {collection: [], total: 0} as EntityHistoryResponse;

    try {
        const response = await Utils.getRequest('LastViewed/action/getNavigationHistory', params);

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        entityHistory = await response.json() as EntityHistoryResponse;
    } catch (error) {
        console.error('Error:', error);
    }

    return entityHistory;
}

export async function createHistoryLog(name: string): Promise<void>
{
    try {
        const response = await Utils.postRequest(
            'App/logNavigation/' + name,
            {
                url: window.location.pathname + (window.location.hash || '#')
            },
            {
                'Entity-History': sessionStorage.tabId || 'true'
            }
        );

        if (!response.ok) {
            throw new Error('Unable to create history log');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}