/*
 *  AtroCore Software
 *
 *  This source file is available under GNU General Public License version 3 (GPLv3).
 *  Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 *  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 *  @license    GPLv3 (https://www.gnu.org/licenses/)
 */

import {ApiClient} from '$lib/core/api-client';

import type EntityHistoryResponse
    from "$lib/components/headers/BaseHeader/NavigationHistory/types/entity-history-response";

export async function loadLastEntities(scope: string, id: string | null, tabId: string | null): Promise<EntityHistoryResponse> {
    const params: Record<string, any> = {
        'maxSize': '32',
        'entity': scope
    };

    if (id) params.id = id;
    if (tabId) params.tabId = tabId;

    let entityHistory = {collection: [], total: 0} as EntityHistoryResponse;

    try {
        entityHistory = await ApiClient.get<EntityHistoryResponse>('navigationHistory', params);
    } catch (error) {
        console.error('Error:', error);
    }

    return entityHistory;
}

export async function createHistoryLog(name: string): Promise<void> {
    try {
        await ApiClient.post('logNavigation',
            {name, url: window.location.pathname + (window.location.hash || '#')},
            {'Entity-History': sessionStorage.tabId || 'true'}
        );
    } catch (error) {
        console.error('Error:', error);
    }
}