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
import type { AuthorizationRequest, AuthorizationResult } from "../types/authorization-request";

/**
 * The authorization request of an OAuth client is kept in its cookie by the authorization page /oauth/authorize.
 */
export function validateAuthorizationRequest(): Promise<AuthorizationRequest> {
    return ApiClient.get<AuthorizationRequest>('oauth/authorizationRequest');
}

export function approveAuthorizationRequest(username: string, password: string): Promise<AuthorizationResult> {
    return ApiClient.post<AuthorizationResult>('oauth/authorizationRequest', { approved: true, username, password });
}

export function denyAuthorizationRequest(): Promise<AuthorizationResult> {
    return ApiClient.post<AuthorizationResult>('oauth/authorizationRequest', { approved: false });
}
