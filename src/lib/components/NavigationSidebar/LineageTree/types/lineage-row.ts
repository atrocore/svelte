/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

import type { LineageGuide } from './lineage-guide';
import type { LineageLink } from './lineage-link';
import type { LineageRecord } from './lineage-record';

export type LineageRow = {
    record: LineageRecord;
    kind: 'master' | 'contributor' | 'pipeline';
    depth: number;
    guides: LineageGuide[];
    link: LineageLink | null;
    pipelineChildLink: LineageLink | null;
    consolidationChildLink: LineageLink | null;
    hasPipelineChild: boolean;
    hasConsolidationChildren: boolean;
    isCurrent: boolean;
};
