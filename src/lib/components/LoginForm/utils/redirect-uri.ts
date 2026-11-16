/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

/**
 * The user agent is returned only to an http or https URI, or to a private-use URI scheme in reverse domain notation
 * of a native application: other schemes, such as "javascript:" or "data:", would run in the context of AtroCore.
 */
export function isAllowedRedirectUri(redirectUri: string): boolean {
    let url: URL;
    try {
        url = new URL(redirectUri);
    } catch {
        return false;
    }

    const scheme = url.protocol.slice(0, -1).toLowerCase();
    if (scheme === 'http' || scheme === 'https') {
        return url.host !== '';
    }

    return scheme.includes('.') && /^[a-z][a-z0-9+.-]*$/.test(scheme);
}
