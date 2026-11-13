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
 * The server passes the state of the sign-in to the user interface by cookies, so the URL carries nothing of it.
 */
const SIGN_IN_ERROR_COOKIE = 'auth-error';
const AUTHORIZATION_REQUEST_COOKIE = 'auth-request';

function readCookie(name: string): string | null {
    for (const part of document.cookie.split(';')) {
        const [key, ...value] = part.trim().split('=');
        if (key === name) {
            return decodeURIComponent(value.join('='));
        }
    }

    return null;
}

function removeCookie(name: string): void {
    document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
}

/**
 * The error of the last sign-in at an external identity provider, shown once.
 */
export function takeSignInError(): string | null {
    const error = readCookie(SIGN_IN_ERROR_COOKIE);
    if (error !== null) {
        removeCookie(SIGN_IN_ERROR_COOKIE);
    }

    return error || null;
}

/**
 * The user interface stops showing the sign-in form of an authorization request that cannot be completed.
 */
export function forgetAuthorizationRequest(): void {
    removeCookie(AUTHORIZATION_REQUEST_COOKIE);
}
