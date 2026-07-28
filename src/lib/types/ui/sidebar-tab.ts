/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

import type { ComponentType } from 'svelte';

export type SidebarTabInfo = {
    name: string;
    label: string;
    iconClass?: string | null;
    iconUrl?: string | null;
    title?: string | null;
    hidden?: boolean;
};

export type SidebarTabContent<TContext = any> = {
    component: ComponentType;
    props: (tab: SidebarTabInfo, ctx: TContext) => Record<string, any>;
    isVisible?: (tab: SidebarTabInfo, ctx: TContext) => boolean;
    keepCollapsed?: boolean;
};

export type SidebarTab<TContext = any> = SidebarTabInfo & {
    content: SidebarTabContent<TContext>;
};

export type ResolvedSidebarTab<TContext = any> = SidebarTab<TContext> & {
    props: Record<string, any>;
    hidden: boolean;
};
