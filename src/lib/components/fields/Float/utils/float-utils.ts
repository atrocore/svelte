/*
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
*/

export function formatFloatForEdit(value: number | null, decimalMark: string): string {
    if (value === null || value === undefined || isNaN(value)) return '';
    const parts = value.toString().split('.');
    return parts.join(decimalMark);
}

export function formatFloatForDisplay(
    value: number | null,
    thousandSeparator: string,
    decimalMark: string,
    decimalPlaces: number | null = null
): string {
    if (value === null || value === undefined || isNaN(value)) return '';
    let str: string;
    if (decimalPlaces !== null && decimalPlaces >= 0) {
        str = value.toFixed(decimalPlaces);
    } else {
        str = value.toString();
    }
    const parts = str.split('.');
    if (thousandSeparator) {
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
    }
    return parts.join(decimalMark);
}

export function parseFloatValue(raw: string, thousandSeparator: string, decimalMark: string): number | null {
    if (!raw?.trim()) return null;
    const cleaned = raw.split(thousandSeparator).join('').split(decimalMark).join('.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
}
