/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

import { ApiClient } from "$lib/core/api-client";

/**
 * The sign-in URL of the identity provider; signing in there approves the OAuth authorization request.
 */
export function getOidcLoginUrl(authorizationQuery: string): Promise<string> {
    return ApiClient.get<{ url: string }>('oidcLoginUrl', { authorizationQuery }).then(data => data.url);
}
