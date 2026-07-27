/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

import { Acl } from '$lib/core/acl';
import { Metadata } from '$lib/core/metadata';

import type AdminPanelGroup from '$lib/types/admin/admin-panel-group';

export function getAdminPanelGroups(): AdminPanelGroup[] {
    const isGlobalAdmin = !!Acl.getUser()?.isAdmin();
    const groups = (Metadata.get(['app', 'adminPanel']) || {}) as Record<string, AdminPanelGroup>;

    return Object.entries(groups)
        .map(([id, group]) => ({
            ...group,
            id,
            itemList: (group.itemList || []).filter(item => {
                if (isGlobalAdmin) {
                    return true;
                }

                return !!item.scope && !!Acl.checkScopeHasAcl(item.scope) && !!Acl.check(item.scope, 'read');
            })
        }))
        .filter(group => group.itemList.length > 0);
}
