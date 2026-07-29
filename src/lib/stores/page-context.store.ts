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

/**
 * Bridge between the BackboneJS page views and the shell-level Svelte components.
 *
 * Pages publish through it on every render; components mounted in the master view — the sidebars, and in time
 * the header — subscribe instead of being re-created by each page, so they survive navigation.
 *
 * Both writers accept a partial description: whatever a page leaves out falls back to the empty context, which
 * hides the shell parts the page does not want.
 */
export const PageContextBridge = {
    subscribe: pageContextStore.subscribe,

    get(): PageContext {
        return get(pageContextStore);
    },

    /** Replaces the description — used when a page takes over. */
    set(context: Partial<PageContext>): void {
        pageContextStore.set(merge(createEmptyPageContext(), context));
    },

    /** Updates part of the description — used when something changes within the page that is already open. */
    patch(context: Partial<PageContext>): void {
        pageContextStore.update(current => merge(current, context));
    },

    reset(): void {
        pageContextStore.set(createEmptyPageContext());
    }
};

function merge(base: PageContext, context: Partial<PageContext>): PageContext {
    return {
        ...base,
        ...context,
        leftSidebar: { ...base.leftSidebar, ...context.leftSidebar }
    };
}