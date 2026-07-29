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
import { Metadata } from '$lib/core/metadata';

export type LinkedRecord = {
    id: string;
    /** Ancestor paths of the record, one entry per parent branch, each pipe-delimited. Empty for flat trees. */
    routes: string[];
};

/**
 * The records the given one is linked to through `link` — the nodes the tree has to mark while that link's tab
 * is open.
 *
 * The model is asked first: it often already carries the ids, and an empty list is a valid answer, so the
 * attribute merely has to be set for the request to be skipped. Hierarchical trees are the exception — they
 * also need the ancestors of each record in order to open the path down to it, and only the server knows those.
 */
export async function loadLinkedRecords(scope: string, link: string, model: any, needsRoutes: boolean): Promise<LinkedRecord[]> {
    const fromModel = readFromModel(scope, link, model);
    if (fromModel && !needsRoutes) {
        return fromModel;
    }

    const response = await ApiClient.get<Record<string, any>>('entityRelation', {
        entityName: scope,
        id: model.get('id'),
        link
    });

    return (response?.list || []).map((item: any) => ({
        id: item.id,
        routes: item.routes || []
    }));
}

function readFromModel(scope: string, link: string, model: any): LinkedRecord[] | null {
    if (Metadata.get(['entityDefs', scope, 'fields', link, 'type']) === 'link') {
        const id = model.get(`${link}Id`);
        return id ? [{ id, routes: [] }] : [];
    }

    const ids = model.get(`${link}Ids`);
    if (ids === undefined || ids === null) {
        return null;
    }

    return (ids as string[]).map(id => ({ id, routes: [] }));
}

export function parseRoute(route: string): string[] {
    return (route || '').split('|').filter(id => !!id);
}
