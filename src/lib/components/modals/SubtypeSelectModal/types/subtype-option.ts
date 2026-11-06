/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

export type SubtypeOption = {
    scope: string;
    label: string;
    description: string | null;
    icon: string | null;
    group: string | null;
};

export type SubtypeGroup = {
    name: string | null;
    label: string | null;
    options: SubtypeOption[];
};
