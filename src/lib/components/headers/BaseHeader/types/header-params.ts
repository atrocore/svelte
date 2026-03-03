/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

import type BreadcrumbsItem from "$lib/types/ui/header/breadcrumbs-item";
import type Permissions from "$lib/components/headers/RecordActionsGroup/types/permissions";

type Params = {
    mode: string;
    scope: string;
    id: string;
    searchManager: object,
    showSearchPanel: boolean,
    showFilter: boolean,
    breadcrumbs: BreadcrumbsItem[],
    currentIsHeading: boolean;
    afterOnMount?: () => void,
    afterOnDestroy?: () => void,
    scopePermissions?: Permissions
}

export default Params;
