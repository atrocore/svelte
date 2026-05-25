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

export type ExtensibleEnumOption = {
    id: string;
    name: string;
    preparedName?: string;
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

const optionsCache: Record<string, Promise<ExtensibleEnumOption[]>> = {};
const measureCache: Record<string, Promise<MeasureData>> = {};

export function loadExtensibleEnumOptions(enumId: string): Promise<ExtensibleEnumOption[]> {
    if (!optionsCache[enumId]) {
        optionsCache[enumId] = ApiClient.get<ExtensibleEnumOption[]>(`ExtensibleEnum/${enumId}/options`);
    }
    return optionsCache[enumId];
}

export function loadMeasureData(measureId: string): Promise<MeasureData> {
    if (!measureCache[measureId]) {
        measureCache[measureId] = ApiClient.get<MeasureData>(`Measure/${measureId}/measureWithUnits`);
    }
    return measureCache[measureId];
}
