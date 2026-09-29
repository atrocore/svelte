/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

import { sanitizeHtml as sanitizeHtmlHelper } from '$lib/helpers/html';

export function sanitizeHtml(value: string | null): string {
    return sanitizeHtmlHelper(value);
}

export function plainToHtml(text: string | null): string {
    return (text || '').replace(/\n/g, '<br>');
}

export function htmlToPlain(html: string | null): string | null {
    if (html === null) return null;
    let value = (html || '').replace(/<br\s*\/?>/mg, '\n');
    value = value.replace(/<\/p\s*\/?>/mg, '\n\n');
    const div = document.createElement('div');
    div.innerHTML = value;
    div.querySelectorAll('style, link[ref="stylesheet"]').forEach(el => el.remove());
    return div.textContent || '';
}
