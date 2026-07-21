/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

import type GridRow from './grid-row';

type GridPanel = {
    label?: string;
    style: string;
    rows: GridRow[];
    number: number;
    name?: string;
    isCustomLabel?: boolean;
    layoutRemoveDisabled?: boolean;
    customLabel?: string;
    [key: string]: any;
}

export default GridPanel;
