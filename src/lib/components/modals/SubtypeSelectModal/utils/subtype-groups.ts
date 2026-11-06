/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

import type { SubtypeGroup, SubtypeOption } from '../types/subtype-option';

const GROUP_ORDER: Record<string, number> = { numeric: 1, character: 2, date: 3, reference: 4 };

export function groupSubtypeOptions(
    options: SubtypeOption[],
    translateGroup: (name: string) => string
): SubtypeGroup[] {
    const sortedOptions = [...options].sort((a, b) => a.label.localeCompare(b.label));

    if (!sortedOptions.some(option => option.group)) {
        return [{ name: null, label: null, options: sortedOptions }];
    }

    const groups: SubtypeGroup[] = [];
    sortedOptions.forEach(option => {
        const name = option.group || 'other';
        let group = groups.find(g => g.name === name);
        if (!group) {
            group = { name, label: translateGroup(name), options: [] };
            groups.push(group);
        }
        group.options.push(option);
    });

    return groups.sort((a, b) => {
        if (a.name === 'other') return 1;
        if (b.name === 'other') return -1;
        return (GROUP_ORDER[a.name!] || 999) - (GROUP_ORDER[b.name!] || 999)
            || (a.label || '').localeCompare(b.label || '');
    });
}
