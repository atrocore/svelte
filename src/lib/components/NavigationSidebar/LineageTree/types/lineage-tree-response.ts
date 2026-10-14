/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

import type { LineageEndpoint } from './lineage-endpoint';
import type { LineageLink } from './lineage-link';
import type { LineageRecord } from './lineage-record';

export type LineageTreeResponse = {
    currentEndpoint: { scope: string; id: string };
    endpoints: LineageEndpoint[];
    records: LineageRecord[];
    links: LineageLink[];
    truncated: boolean;
};
