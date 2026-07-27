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
import { getAdminPanelGroups } from "$lib/core/administration";

import type AdminCard from "../types/admin-card";
import type AdminCardGroup from "../types/admin-card-group";

export function getAdminCardGroups(cacheDate: string | null): AdminCardGroup[] {
    const groups: AdminCardGroup[] = [];

    for (let data of getAdminPanelGroups()) {
        const group = {
            id: data.id,
            title: Language.translate(data.label, 'labels', 'Admin')
        } as AdminCardGroup;

        group.items = data.itemList.map((item: Record<string, any>) => {
            let alert = null;
            let tooltip = null;

            if (item.url === '#Admin/rebuildDb' && localStorage.getItem('pd_isNeedToRebuildDatabase') === 'true') {
                alert = Language.translate('rebuildDbWarning', 'labels', 'Admin');
            } else if (item.url === '#Composer/list' && localStorage.getItem('pd_isNeedToUpdate') === 'true') {
                alert = Language.translate('updatesAvailable', 'labels', 'Admin');
            } else if (item.url === '#Admin/clearCache' && cacheDate) {
                tooltip = Language.translate('clearCacheTooltip', 'labels', 'Admin') + ' ' + cacheDate;
            }

            return {
                url: item.url,
                icon: item.icon || 'ph ph-gear',
                title: Language.translate(item.label, 'labels', 'Admin'),
                description: Language.translate(item.description, 'descriptions', 'Admin'),
                docsUrl: item.docsUrl,
                alert: alert,
                tooltip: tooltip
            } as AdminCard;
        });

        groups.push(group);
    }

    return groups;
}