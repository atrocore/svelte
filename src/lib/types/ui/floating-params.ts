/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

import {Placement, Strategy} from "@floating-ui/dom";

type FloatingParams = {
    disableAutoHide?: boolean;
    usePositionOnly?: boolean;
    isOpen?: boolean;
    dropdownListElSelector?: string;
    placement?: Placement;
    strategy?: Strategy;
    onDropdownShow?: (dropdown: HTMLElement) => void;
    onDropdownHide?: (dropdown: HTMLElement) => void;
    onDestroy?: (trigger: HTMLElement, dropdown: HTMLElement) => void;
    flip?: boolean | Record<string, any>,
    shift?: boolean | Record<string, any>,
    offset?: boolean | Record<string, any>,
    size?: boolean | Record<string, any>,
    arrow?: boolean | Record<string, any>,
    hide?: boolean | Record<string, any>
}

export default FloatingParams;