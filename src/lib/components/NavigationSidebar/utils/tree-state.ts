/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

import { Storage } from '$lib/core/storage';

const FILTER_KEY = 'treeWhereData';
const SEARCH_KEY = 'treeSearchValue';

export const ADMIN_SEARCH_SCOPE = '_admin';

export function saveTreeFilter(scope: string, where: any): void {
    Storage.set(FILTER_KEY, scope, where);
}

export function loadTreeFilter(scope: string): any[] {
    return JSON.parse(JSON.stringify(Storage.get(FILTER_KEY, scope) || []));
}

export function clearTreeFilter(scope: string): void {
    Storage.clear(FILTER_KEY, scope);
}

export function saveTreeSearch(scope: string, value: string): void {
    Storage.set(SEARCH_KEY, scope, value);
}

export function loadTreeSearch(scope: string): string {
    return Storage.get(SEARCH_KEY, scope) || '';
}

export function clearTreeSearch(scope: string): void {
    Storage.clear(SEARCH_KEY, scope);
    Storage.clear(SEARCH_KEY, ADMIN_SEARCH_SCOPE);
}
