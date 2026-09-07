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

type Params = {
    mode: string;
    scope: string;
    id: string;
    searchManager: object,
    showSearchPanel: boolean,
    showFilter: boolean,
    breadcrumbs: BreadcrumbsItem[],
    afterOnMount?: () => void,
    afterOnDestroy?: () => void,
    disableNavigationHistory: boolean,
    minimizeHeaderOnScroll?: boolean
}

export default Params;
