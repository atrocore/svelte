/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

import SortableJS from 'sortablejs';
import type { Options } from 'sortablejs';

const defaultOptions: Options = {
    group: 'fields',
    draggable: 'li',
    animation: 150,
};

export const SortableList = {
    create: (el: Element, options: Options): SortableJS => {
        return SortableJS.create(el as HTMLElement, { ...defaultOptions, ...options });
    },

    getDataAttributeProps: (item: any, attrs: string[] = ['name', 'id']): Record<string, any> => {
        const result: Record<string, any> = {};
        attrs.forEach(attr => {
            if (item[attr] != null) {
                result[`data-${attr.toLowerCase()}`] = item[attr];
            }
        });
        return result;
    },
};
