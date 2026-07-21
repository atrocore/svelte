/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

export function computeEditorHeight(value: string | null, fullScreen: boolean): string {
    if (fullScreen) return '100vh';
    const lines = (value ?? '').split('\n').length;
    if (lines <= 3) return '60px';
    if (lines <= 40) return `${lines * 20}px`;
    return '800px';
}
