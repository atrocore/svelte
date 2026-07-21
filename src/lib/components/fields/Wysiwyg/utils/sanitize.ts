/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

export function sanitizeHtml(value: string | null): string {
    if (!value) return '';
    value = value.replace(/<[\/]{0,1}(base)[^><]*>/gi, '');
    value = value.replace(/<[\/]{0,1}(script)[^><]*>/gi, '');
    value = value.replace(/<[^><]*(onerror|onclick|onmouseover|onmousedown|onmouseenter|onmouseout|mouseleave|onchange|onblur)=[^><]*>/gi, '');
    return value;
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
