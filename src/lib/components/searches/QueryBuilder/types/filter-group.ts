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
 * A group of filters that are not fields of the entity, as a module describes it in
 * clientDefs.<scope>.queryBuilderFilterGroups.<key>. A filter of the group is added by the dialog view, which triggers
 * "add" with the items selected, each named after a field of the group.
 */
type FilterGroup = {
    label: string;
    addLabel: string;
    view: string;
    fields: Record<string, FilterGroupField>;
}

export type FilterGroupField = {
    type: string;
    label: string;
}

export default FilterGroup;
