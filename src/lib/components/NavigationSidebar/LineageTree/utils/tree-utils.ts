/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

import { ApiClient } from '$lib/core/api-client';
import type { LineageEndpoint } from '../types/lineage-endpoint';
import type { LineageLink } from '../types/lineage-link';
import type { LineageRecord } from '../types/lineage-record';
import type { LineageRow } from '../types/lineage-row';
import type { LineageTreeResponse } from '../types/lineage-tree-response';

export function loadLineageTree(entityName: string, id: string, endpoint: LineageEndpoint | null = null): Promise<LineageTreeResponse> {
    const params: Record<string, string> = { entityName, id };
    if (endpoint) {
        params.endpointEntityName = endpoint.scope;
        params.endpointId = endpoint.id;
    }

    return ApiClient.get<LineageTreeResponse>('dataLineageTree', params);
}

export function buildLineageRows(tree: LineageTreeResponse, currentScope: string, currentId: string): LineageRow[] {
    const children = new Map<string, LineageRecord[]>();
    let root: LineageRecord | null = null;

    for (const record of tree.records) {
        if (record.toScope === null || record.toId === null) {
            if (root === null) {
                root = record;
            }
            continue;
        }

        const parentKey = `${record.toScope}:${record.toId}`;
        children.set(parentKey, [...(children.get(parentKey) ?? []), record]);
    }

    const findLink = (record: LineageRecord): LineageLink | null =>
        tree.links.find(link => link.from === record.scope && link.to === record.toScope) ?? null;

    const rows: LineageRow[] = [];

    const visit = (record: LineageRecord, depth: number, guides: boolean[], link: LineageLink | null): void => {
        const recordChildren = children.get(`${record.scope}:${record.id}`) ?? [];
        const consolidationChildren = recordChildren.filter(child => findLink(child)?.type === 'consolidation');
        const pipelineChildren = recordChildren.filter(child => findLink(child)?.type !== 'consolidation');

        rows.push({
            record,
            kind: consolidationChildren.length > 0 ? 'master' : (link?.type === 'consolidation' ? 'contributor' : 'pipeline'),
            depth,
            guides,
            link,
            pipelineChildLink: pipelineChildren.length > 0 ? findLink(pipelineChildren[0]) : null,
            hasPipelineChild: pipelineChildren.length > 0,
            hasConsolidationChildren: consolidationChildren.length > 0,
            isCurrent: record.scope === currentScope && record.id === currentId
        });

        consolidationChildren.forEach((child, index) => {
            visit(child, depth + 1, [...guides, index < consolidationChildren.length - 1], findLink(child));
        });

        pipelineChildren.forEach(child => visit(child, depth, guides, findLink(child)));
    };

    if (root) {
        visit(root, 0, [], null);
    }

    return rows;
}
