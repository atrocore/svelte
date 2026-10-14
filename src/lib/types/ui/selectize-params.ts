/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

import type SelectizeOption from "$lib/types/ui/selectize-option";

type SelectizeParams = {
    options: SelectizeOption[];
    value: string | null;
    clearable?: boolean;
    disabled?: boolean;
    onChange: (value: string) => void;
}

export default SelectizeParams;
