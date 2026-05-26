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

export type PrefixOption = {
    id: string;
    name: string;
    value: string;
};

export type MeasureUnit = {
    id: string;
    name: string;
    symbol?: string;
    [key: string]: unknown;
};

export type MeasureData = {
    units: MeasureUnit[];
    displayFormat?: string;
    [key: string]: unknown;
};

const measureCache: Record<string, Promise<MeasureData>> = {};
const prefixCache: Record<string, Promise<PrefixOption[]>> = {};

export function loadPrefixOptions(where: any[] = []): Promise<PrefixOption[]> {
    const cacheKey = JSON.stringify(where);
    if (!prefixCache[cacheKey]) {
        const params: Record<string, any> = { maxSize: 200, sortBy: 'name', asc: true };
        if (where.length > 0) {
            params.where = where;
        }
        prefixCache[cacheKey] = ApiClient.get<{ list: PrefixOption[] }>('Prefix', params)
            .then(res => res.list ?? []);
    }
    return prefixCache[cacheKey];
}

export function loadMeasureData(measureId: string): Promise<MeasureData> {
    if (!measureCache[measureId]) {
        measureCache[measureId] = ApiClient.get<MeasureData>(`Measure/${measureId}/measureWithUnits`);
    }
    return measureCache[measureId];
}
