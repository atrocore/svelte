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
import { Config } from '$lib/core/config';
import type SelectionGroup from '../types/selection-group';

export function checkMergeable(groups: SelectionGroup[], isComparable: boolean): boolean {
    if (!isComparable) return false;

    let scope: string | null = null;
    for (const group of groups) {
        if (!scope) {
            scope = group.key;
            continue;
        }
        if (scope !== group.key) {
            return false;
        }
    }
    return true;
}

export function checkComparable(currentSelectionId: string | null, groups: SelectionGroup[]): boolean {
    return !!(currentSelectionId && groups.length > 0 && (groups.length > 1 || groups[0]?.collection.length > 1));
}

export function parseSelectionItemsResponse(data: any): Record<string, SelectionGroup> {
    const result: Record<string, SelectionGroup> = {};

    data.list.forEach((item: any) => {
        if (!result[item.entityType]) {
            result[item.entityType] = {
                key: item.entityType,
                collection: [],
                rowList: []
            };
        }

        result[item.entityType].collection.push({
            id: item.id,
            entityId: item.entityId,
            entityName: item.name,
            entityType: item.entityType
        });

        result[item.entityType].rowList.push(item.entityId);
    });

    return result;
}

export function mergeGroups(existingGroups: SelectionGroup[], newGroupsRecord: Record<string, SelectionGroup>): SelectionGroup[] {
    const existingKeys = existingGroups.map(g => g.key);
    let mergedGroups = [...existingGroups];

    Object.values(newGroupsRecord).forEach(newGroup => {
        if (!existingKeys.includes(newGroup.key)) {
            mergedGroups.push(newGroup);
        } else {
            mergedGroups = mergedGroups.map(group => {
                if (newGroup.key === group.key) {
                    return {
                        ...group,
                        collection: [...group.collection, ...newGroup.collection],
                        rowList: [...group.rowList, ...newGroup.rowList]
                    };
                }
                return group;
            });
        }
    });

    return mergedGroups;
}

export function addIconsToGroups(groups: SelectionGroup[]): SelectionGroup[] {
    if (Config.get('tabIconsDisabled')) {
        return groups;
    }

    return groups.map(group => ({
        ...group,
        icon: Utils.getTabIcon(group.key)
    }));
}

export function removeItemFromGroups(groups: SelectionGroup[], selectionItemId: string): SelectionGroup[] {
    return groups.map(group => ({
        ...group,
        collection: group.collection.filter(s => s.id !== selectionItemId),
        rowList: group.rowList.filter(id => {
            const item = group.collection.find(s => s.id === selectionItemId);
            return item ? id !== item.entityId : true;
        })
    })).filter(g => g.collection.length > 0);
}

export function calculateTotalItems(groups: SelectionGroup[]): number {
    return groups.reduce((acc, g) => acc + g.collection.length, 0);
}
