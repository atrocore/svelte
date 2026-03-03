/*
 *  AtroCore Software
 *
 *  This source file is available under GNU General Public License version 3 (GPLv3).
 *  Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 *  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 *  @license    GPLv3 (https://www.gnu.org/licenses/)
 */

import { Language } from "$lib/core/language";

import ActionHistoryRecord from "$lib/types/entity/action-history-record";
import NavigationHistoryItem
    from "$lib/components/headers/BaseHeader/NavigationHistory/types/navigation-history-item";
import {
    loadLastEntities
} from "$lib/components/headers/BaseHeader/NavigationHistory/utils/entity-history-api";

export async function getLastEntities(scope: string, id: string | null, tabId: string | null): Promise<NavigationHistoryItem[]> {
    const response = await loadLastEntities(scope, id, tabId);

    return response.collection.map(getEntityHistoryItem);
}

function getEntityHistoryItem(item: ActionHistoryRecord): NavigationHistoryItem {
    let label = '';
    let link = '';
    let className = '';
    let tooltip = '';

    if (item.controllerName === 'App' && item.targetId) {
        let category = 'labels';
        let scope = 'Admin'
        if (!Language.has(item.targetId, category, scope)) {
            category = 'scopeNames';
            scope = 'Global'

            if (!Language.has(item.targetId, category, scope)) {
                category = 'labels';
            }
        }

        label = Language.translate(item.targetId, category, scope);
        className = 'entity';
        if (item.targetUrl) {
            link = item.targetUrl;
        }
    } else if (item.targetId === null) {
        label = Language.translate(item.controllerName, 'scopeNamesPlural');
        link = `#${item.controllerName}`;
        className = 'entity';
    } else {
        label = `${item.targetName || item.targetId}`;
        link = `#${item.controllerName}/view/${item.targetId}`
        tooltip = Language.translate(item.controllerName, 'scopeNames');
    }

    return {
        name: item.targetId || item.controllerName,
        label: label,
        link: link,
        className: className,
        tooltip: tooltip,
    } as NavigationHistoryItem;
}