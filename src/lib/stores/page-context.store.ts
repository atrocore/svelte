/*
 *  AtroCore Software
 *
 *  This source file is available under GNU General Public License version 3 (GPLv3).
 *  Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 *  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 *  @license    GPLv3 (https://www.gnu.org/licenses/)
 */

import { get, writable } from 'svelte/store';
import type { LeftSidebarContext, PageContext } from '$lib/types/page/page-context';

export function createEmptyLeftSidebarContext(): LeftSidebarContext {
    return {
        enabled: false,
        activeTab: null,
        tabProps: {},
        onNodeSelect: null,
        onWidthChange: null,
        renderLayoutEditor: null
    };
}

export function createEmptyPageContext(): PageContext {
    return {
        pageId: null,
        scope: null,
        mode: 'list',
        model: null,
        collection: null,
        isAdminPage: false,
        leftSidebar: createEmptyLeftSidebarContext()
    };
}

export const pageContextStore = writable<PageContext>(createEmptyPageContext());

let ownerPageId: string | null = null;

export const PageContextBridge = {
    subscribe: pageContextStore.subscribe,

    get(): PageContext {
        return get(pageContextStore);
    },

    claim(pageId: string): void {
        ownerPageId = pageId;
        pageContextStore.set(createEmptyPageContext());
    },

    set(context: Partial<PageContext>): void {
        if (!context.pageId || context.pageId !== ownerPageId) {
            return;
        }

        pageContextStore.set(merge(createEmptyPageContext(), context));
    }
};

function merge(base: PageContext, context: Partial<PageContext>): PageContext {
    return {
        ...base,
        ...context,
        leftSidebar: { ...base.leftSidebar, ...context.leftSidebar }
    };
}