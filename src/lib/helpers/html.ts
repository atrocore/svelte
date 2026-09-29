/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
    'a', 'abbr', 'b', 'blockquote', 'br', 'caption', 'center', 'cite', 'code', 'col', 'colgroup', 'dd', 'del',
    'details', 'div', 'dl', 'dt', 'em', 'figcaption', 'figure', 'font', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr',
    'i', 'img', 'ins', 'kbd', 'li', 'mark', 'ol', 'p', 'pre', 'q', 's', 'small', 'span', 'strike', 'strong', 'style',
    'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'u', 'ul'
];

const ALLOWED_ATTR = [
    'align', 'alt', 'border', 'cellpadding', 'cellspacing', 'class', 'color', 'colspan', 'dir', 'face', 'height',
    'href', 'lang', 'rel', 'rowspan', 'size', 'span', 'src', 'start', 'style', 'target', 'title', 'type', 'valign',
    'width'
];

export function sanitizeHtml(value: string | null): string {
    if (!value) return '';
    return DOMPurify.sanitize(value, {
        ALLOWED_TAGS,
        ALLOWED_ATTR,
        ALLOW_DATA_ATTR: false,
        FORCE_BODY: true
    }) as string;
}

export function sanitizeTitle(value: string | null): string {
    if (!value) return '';
    const body = DOMPurify.sanitize(value, {
        ALLOWED_TAGS: [],
        KEEP_CONTENT: true,
        RETURN_DOM: true
    });
    return body.textContent || '';
}
