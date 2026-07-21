/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

type Params = {
    scope: string;
    type: string;
    reelType?: string;
    disabledParameters?: string[];
    relatedScope: string | null;
    layoutProfileId: string;
    layoutProfiles?: any[];
    editable?: boolean;
    layout?: any;
    dataAttributeList?: string[];
    dataAttributesDefs?: Record<string, Record<string, any>>;
    allowSwitch?: boolean;
    fieldTypes?: string[];
    openEditLabelDialog?: (scope: string, name: string | undefined, callback?: ((label: string) => void) | null, key?: string) => void;
    openEditDialog?: (field: any, scope: string, attrList: string[], attrDefs: Record<string, Record<string, any>>, callback: (attrs: Record<string, any>) => void) => void;
    openAddAttributesDialog?: (scope: string, callback: (fields: any[]) => void) => void;
    onEditPanel?: (panel: any, attrList: string[], attrDefs: Record<string, Record<string, any>>, callback: (attrs: Record<string, any>) => void) => void;
    onlyManyToMany?: boolean;
    inModal?: boolean;
    replaceButtons?: boolean;
    afterRender?: () => void;
    onUpdate?: (reset: boolean) => void;
    getActiveLayoutProfileId?: () => string | null;
}

export default Params;
