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
 * The sign-in URL of the identity provider. Signing in there approves the authorization request the sign-in form is
 * shown for, otherwise opens the session of the user interface on the current route.
 */
export function getOidcLoginUrl(): Promise<string> {
    return ApiClient.get<{ url: string }>('oidcLoginUrl', { returnHash: window.location.hash }).then(data => data.url);
}
