/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

type RowAction = {
    name: string;
    label?: string;
    html?: string;
    iconClass?: string;
    iconUrl?: string;
    hidden?: boolean;
    disabled?: boolean;
    quick?: boolean;
    link?: string;
    data?: Record<string, string>;
};

export default RowAction;
