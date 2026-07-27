/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

import { Language } from '$lib/core/language';
import { getAdminPanelGroups } from '$lib/core/administration';

export function getAdminTreeData(searchValue: string): any[] {
    let groups = getAdminPanelGroups();
    let total = groups.length;
    let result: any[] = [];
    let i = 0;
    groups.forEach((group) => {
        let treeItem = {
            id: group.id,
            name: Language.get('Admin', 'labels', group.label) ?? group.label,
            offset: i,
            total: total,
            disabled: true,
            load_on_demand: false,
            children: []
        }
        let j = 0;
        let totalItem = group.itemList.length;
        for (const item of group.itemList) {
            if (item.listDisabled) {
                continue;
            }
            const label = Language.translate(item['label'], 'labels', 'Admin');
            if ((searchValue ?? '').length < 3 || (label.toLowerCase().includes(searchValue.toLowerCase()))) {
                treeItem.children.push({
                    id: item['url'],
                    name: label,
                    offset: j,
                    total: totalItem,
                    disabled: false,
                    load_on_demand: false,
                });
                j++;
            }

        }
        if (treeItem.children.length === 0) {
            return;
        }
        result.push(treeItem);
        i++;
    });

    return result;
}

export function isAdminLinkUnique(scope: string, searchValue: string): boolean {
    let count = 0;
    for (const treeItem of getAdminTreeData(searchValue)) {
        for (const child of treeItem.children) {
            if (child.id.includes('#' + scope)) {
                count += 1;
            }
        }
    }

    return count == 1;
}