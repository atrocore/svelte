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
    'i', 'iframe', 'img', 'ins', 'kbd', 'li', 'mark', 'ol', 'p', 'pre', 'q', 's', 'small', 'span', 'strike', 'strong', 'style',
    'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'u', 'ul'
];

const ALLOWED_ATTR = [
    'align', 'alt', 'border', 'cellpadding', 'cellspacing', 'class', 'color', 'colspan', 'dir', 'face', 'height',
    'href', 'lang', 'rel', 'rowspan', 'size', 'span', 'src', 'start', 'style', 'target', 'title', 'type', 'valign',
    'width', 'frameborder', 'referrerpolicy'
];

// Fixed for every embedded iframe, content can not choose them: no camera, microphone, geolocation, clipboard etc.
export const IFRAME_ALLOW ='autoplay; encrypted-media; picture-in-picture; fullscreen';
// The iframe src is a third-party origin, so allow-same-origin gives it its own origin, never ours.
// Not allowed: top navigation (redirecting the AtroCore tab), forms, modals.
const IFRAME_SANDBOX = 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation';

// Hosts allowed as iframe src (video embeds only, https only). Used by the sanitizer and the iframe preview CSP frame-src.
export const IFRAME_ALLOWED_HOSTS = ['www.youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com'];

function isAllowedIframeSrc(src: string | null): boolean {
    if (!src) return false;
    try {
        const url = new URL(src, window.location.href);
        return url.protocol === 'https:' && IFRAME_ALLOWED_HOSTS.includes(url.hostname.toLowerCase());
    } catch (e) {
        return false;
    }
}

// Separate instance so the iframe hook does not affect other DOMPurify usages
const htmlPurifier = DOMPurify(window);

htmlPurifier.addHook('afterSanitizeAttributes', (node: Element) => {
    if (node.nodeName !== 'IFRAME') return;

    if (!isAllowedIframeSrc(node.getAttribute('src'))) {
        node.parentNode?.removeChild(node);
        return;
    }

    // Applies also where content is rendered directly in the main document (list view, Markdown, detail without useIframe)
    node.setAttribute('allow', IFRAME_ALLOW);
    node.setAttribute('sandbox', IFRAME_SANDBOX);
});

export function sanitizeHtml(value: string | null): string {
    if (!value) return '';
    return htmlPurifier.sanitize(value, {
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
