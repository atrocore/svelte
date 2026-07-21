/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

type GridCell = {
    name: string;
    label?: string;
    id?: string;
    fullWidth?: boolean;
    customLabel?: string;
    noLabel?: boolean;
    layoutRemoveDisabled?: boolean;
    attributeId?: string;
    [key: string]: any;
}

export default GridCell;
