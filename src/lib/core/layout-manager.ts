/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

import { writable } from 'svelte/store';

type LayoutManagerAdapter = {
    data: any

    resetToDefault(scope: string, type: string, relatedScope: string | null, layoutProfileId: string, callback: any): any

    get(scope: string, type: string, relatedScope: string | null, layoutProfileId: string, callback: any, cache: any, isAdminPage: boolean): any

    set(scope: string, type: string, relatedScope: string | null, layoutProfileId: string, layout: any, callback: any, errorCallback: any): any
}

const data = writable<LayoutManagerAdapter>();

export const LayoutManager = {
    setLayoutManager(layoutManager: LayoutManagerAdapter): void {
        data.set(layoutManager);
    },

    resetToDefault(scope: string, type: string, relatedScope: string | null, layoutProfileId: string, callback: any) {
        let res = null
        data.subscribe((current: LayoutManagerAdapter) => {
            if (current) {
                res = current.resetToDefault(scope, type, relatedScope, layoutProfileId, callback);
            }
        })();
        return res
    },

    get: function (scope: string, type: string, relatedScope: string | null, layoutProfileId: string, callback: any, cache: any, isAdminPage: boolean): any {
        let res = null
        data.subscribe((current: LayoutManagerAdapter) => {
            if (current) {
                res = current.get(scope, type, relatedScope, layoutProfileId, callback, cache, isAdminPage);
            }
        })();
        return res
    },

    set: function (scope: string, type: string, relatedScope: string | null, layoutProfileId: string, layout: any, callback: any, errorCallback: any): any {
        let res = null
        data.subscribe((current: LayoutManagerAdapter) => {
            if (current) {
                res = current.set(scope, type, relatedScope, layoutProfileId, layout, callback, errorCallback);
            }
        })();
        return res
    },

    clearListAndDetailCache: function () {
        data.subscribe((current: LayoutManagerAdapter) => {
            if (current) {
                current.data = {}
                for (const i in localStorage) {
                    if (i.includes('app-layout') &&
                        (i.includes('-list') || i.includes('detail') || i.includes('summary'))) {
                        delete localStorage[i];
                    }
                }
            }
        })();
    }
};