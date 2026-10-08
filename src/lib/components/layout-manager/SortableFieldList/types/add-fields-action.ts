/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

/**
 * An item of the menu adding columns to a layout. A module describes its own item in
 * clientDefs.<scope>.layoutAddFieldsActions.<key>, with the dialog view giving the columns. An item without a view is
 * the one adding attributes.
 */
type AddFieldsAction = {
    label: string;
    view?: string;
    layoutTypes?: string[];
}

export default AddFieldsAction;
