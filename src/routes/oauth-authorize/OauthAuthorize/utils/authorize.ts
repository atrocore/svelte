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

export function validateAuthorizationRequest(query: string): Promise<AuthorizationRequest> {
    return ApiClient.get<AuthorizationRequest>(`oauth/authorize?${query}`);
}

export function approveAuthorizationRequest(query: string, username: string, password: string): Promise<AuthorizationResult> {
    return ApiClient.post<AuthorizationResult>('oauth/authorize', { query, approved: true, username, password });
}

export function denyAuthorizationRequest(query: string): Promise<AuthorizationResult> {
    return ApiClient.post<AuthorizationResult>('oauth/authorize', { query, approved: false });
}
