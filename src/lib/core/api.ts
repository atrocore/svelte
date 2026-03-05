/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

import { UserData } from '$lib/core/user-data';
import { Storage } from '$lib/core/storage';

const API_BASE = '/api/v1';

export class ApiError extends Error {
    constructor(
        public readonly status: number,
        public readonly statusText: string,
        public readonly body: unknown,
    ) {
        super(`API error ${status}: ${statusText}`);
        this.name = 'ApiError';
    }
}

function buildHeaders(extra?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...extra,
    };

    const userData = UserData.get();
    if (userData?.user) {
        headers['Authorization-Token'] = btoa(userData.user.userName + ':' + userData.token);
    }

    const locale = Storage.get('user', 'locale');
    if (locale) {
        headers['Locale-Id'] = locale;
    }

    return headers;
}

function joinUrl(path: string): string {
    const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
    const normalized = path.startsWith('/') ? path.slice(1) : path;
    return `${base}/${normalized}`;
}

async function parseResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        let body: unknown;
        try {
            body = await response.json();
        } catch {
            body = await response.text().catch(() => null);
        }
        throw new ApiError(response.status, response.statusText, body);
    }

    const contentType = response.headers.get('Content-Type') ?? '';
    if (response.status === 204 || !contentType.includes('application/json')) {
        return undefined as unknown as T;
    }

    return response.json() as Promise<T>;
}

export const Api = {
    /**
     * GET /api/v1/{url}?{params}
     */
    get<T = unknown>(url: string, params?: Record<string, any>, headers?: Record<string, string>): Promise<T> {
        let finalUrl = url;
        if (params && Object.keys(params).length > 0) {
            const query = new URLSearchParams(
                Object.fromEntries(
                    Object.entries(params).map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : String(v)])
                )
            ).toString();
            finalUrl = `${url}?${query}`;
        }
        return fetch(joinUrl(finalUrl), {
            method: 'GET',
            headers: buildHeaders(headers),
        }).then(parseResponse<T>);
    },

    /**
     * POST /api/v1/{url}
     */
    post<T = unknown>(url: string, data?: unknown, headers?: Record<string, string>): Promise<T> {
        return fetch(joinUrl(url), {
            method: 'POST',
            headers: buildHeaders(headers),
            body: data !== undefined ? JSON.stringify(data) : undefined,
        }).then(parseResponse<T>);
    },

    /**
     * PUT /api/v1/{url}
     */
    put<T = unknown>(url: string, data?: unknown, headers?: Record<string, string>): Promise<T> {
        return fetch(joinUrl(url), {
            method: 'PUT',
            headers: buildHeaders(headers),
            body: data !== undefined ? JSON.stringify(data) : undefined,
        }).then(parseResponse<T>);
    },

    /**
     * PATCH /api/v1/{url}
     */
    patch<T = unknown>(url: string, data?: unknown, headers?: Record<string, string>): Promise<T> {
        return fetch(joinUrl(url), {
            method: 'PATCH',
            headers: buildHeaders(headers),
            body: data !== undefined ? JSON.stringify(data) : undefined,
        }).then(parseResponse<T>);
    },

    /**
     * DELETE /api/v1/{url}
     */
    delete<T = unknown>(url: string, data?: unknown, headers?: Record<string, string>): Promise<T> {
        return fetch(joinUrl(url), {
            method: 'DELETE',
            headers: buildHeaders(headers),
            body: data !== undefined ? JSON.stringify(data) : undefined,
        }).then(parseResponse<T>);
    },

    /**
     * Raw request — returns Response without parsing, for edge cases.
     */
    request(method: string, url: string, data?: unknown, headers?: Record<string, string>): Promise<Response> {
        return fetch(joinUrl(url), {
            method: method.toUpperCase(),
            headers: buildHeaders(headers),
            body: data !== undefined ? JSON.stringify(data) : undefined,
        });
    },
};