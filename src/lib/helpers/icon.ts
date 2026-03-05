/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

import { Metadata } from '$lib/core/metadata';

export function getSystemIconUrl(name: string): string | null {
    const systemIcons: Record<string, any> = Metadata.get(['app', 'systemIcons']) || {};
    if (name in systemIcons && systemIcons[name].path) {
        return systemIcons[name].path;
    }
    return null;
}

export function getTabIcon(scope: string): string | null {
    const iconClass: string | null = Metadata.get(['clientDefs', scope, 'iconClass']) || null;
    if (iconClass) {
        const systemIcons: Record<string, any> = Metadata.get(['app', 'systemIcons']) || {};
        if (iconClass in systemIcons && systemIcons[iconClass].path) {
            return systemIcons[iconClass].path;
        }
    }

    const firstSymbol = scope.match(/\p{L}/u)?.[0] || null;
    let key = null;

    if (firstSymbol) {
        if (Number.isInteger(firstSymbol)) {
            key = firstSymbol + '-numbers-icon.svg';
        } else {
            key = firstSymbol.toLowerCase() + '-alphabet-icon.svg';
        }

        return 'client/img/icons/default/' + key;
    }

    return null;
}
