/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

type LayoutItem = {
    name: string;
    label: string;
    width?: number;
    widthPx?: number;
    link?: boolean;
    notSortable?: boolean;
    align?: 'left' | 'right';
    view?: string;
    customLabel?: string;

    [key: string]: any;
}

export default LayoutItem;
