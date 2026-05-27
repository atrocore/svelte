/*
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
*/

export function formatIntForEdit(value: number | null): string {
    if (value === null || value === undefined || isNaN(value)) return '';
    return value.toString();
}

export function formatIntForDisplay(value: number | null, thousandSeparator: string): string {
    if (value === null || value === undefined || isNaN(value)) return '';
    if (!thousandSeparator) return value.toString();
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
}

export function parseIntValue(raw: string, thousandSeparator: string): number | null {
    if (!raw?.trim()) return null;
    const stripped = thousandSeparator ? raw.split(thousandSeparator).join('') : raw;
    if (stripped.includes('.') || stripped.includes(',')) return null;
    const parsed = parseInt(stripped, 10);
    return isNaN(parsed) ? null : parsed;
}
