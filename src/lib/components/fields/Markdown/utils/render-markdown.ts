/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

export function renderMarkdown(text: string | null): string {
    if (!text) return '';
    const marked = (window as any).marked;
    if (!marked) return text;
    return marked(text);
}
