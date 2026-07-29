<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import ResizableCollapser from '$lib/components/collapsers/ResizableCollapser/ResizableCollapser.svelte';
    import Preloader from '$lib/components/loaders/Preloader/Preloader.svelte';
    import type { ResolvedSidebarTab, SidebarTab } from '$lib/types/ui/sidebar-tab';

    export let className: string = '';
    export let position: 'left' | 'right' = 'left';
    export let hidden: boolean = false;
    export let minWidth: number = 300;
    export let maxWidth: number = 600;
    export let width: number = minWidth;
    export let isCollapsed: boolean = false;
    export let isPinned: boolean = true;

    export let tabs: SidebarTab[] = [];
    export let context: any = null;
    export let loading: boolean = false;

    export let activeName: string | null = null;
    export let onSelect: ((tab: SidebarTab) => void) | null = null;
    export let content: any = null;

    $: resolvedTabs = resolve(tabs, context);
    $: activeTab = resolvedTabs.find(tab => tab.name === activeName) ?? null;
    $: if (activeTab?.hidden) { select(resolvedTabs.find(tab => !tab.hidden)); }
    $: showContent = !!activeTab && !activeTab.hidden
        && (!isCollapsed || activeTab.content.keepCollapsed);

    function resolve(tabList: SidebarTab[], ctx: any): ResolvedSidebarTab[] {
        return tabList.map(tab => {
            const props = tab.content.props(tab, ctx);

            return {
                ...tab,
                props,
                key: tab.content.key ? tab.content.key(props) : tab.name,
                hidden: tab.content.isVisible ? !tab.content.isVisible(tab, ctx) : !!tab.hidden
            };
        });
    }

    function select(tab: SidebarTab | undefined): void {
        if (tab && onSelect) {
            onSelect(tab);
        }
    }
</script>

<!--TODO: move ResizableCollapser to the current component on RightSidebar refactoring -->
<ResizableCollapser {className} {position} {hidden} {minWidth} {maxWidth}
                    bind:width={width} bind:isCollapsed={isCollapsed} bind:isPinned={isPinned}
                    on:sidebar-resize on:sidebar-collapse on:sidebar-pin>
    <div class="tabbed-content" class:hidden={isCollapsed}>
        {#if loading && resolvedTabs.length === 0}
            <div class="tabs-loading">
                <Preloader heightPx={14}/>
            </div>
        {:else if resolvedTabs.length > 0}
            <div class="tab-strip">
                {#each resolvedTabs as tab (tab.name)}
                    <a href="javascript:" class="tab" data-name={tab.name}
                       class:active={tab.name === activeName} class:hidden={tab.hidden}
                       on:click|preventDefault={() => select(tab)}>{tab.label}</a>
                {/each}
                <slot name="strip"/>
            </div>

            {#if activeTab}
                <div class="sidebar-header">
                    <h5>{#if activeTab.iconUrl}<img src={activeTab.iconUrl} alt="" class="entity-icon">{:else if activeTab.iconClass}<i
                            class="{activeTab.iconClass} font-icon"></i>{/if}{#if activeTab.title}{@html activeTab.title}{:else}{activeTab.label}{/if}</h5>
                    <slot name="heading"/>
                </div>

                {#if showContent}
                    {#key activeTab.key}
                        <svelte:component this={activeTab.content.component} bind:this={content} {...activeTab.props}/>
                    {/key}
                {/if}
            {/if}
        {/if}
    </div>
    <slot name="footer"/>
</ResizableCollapser>

<style>
    .tabbed-content {
        flex: 1;
    }

    .tabs-loading {
        display: flex;
        justify-content: center;
        padding: 20px 0;
    }

    .tab-strip {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        margin-left: -8px;
        padding-bottom: 10px;
        min-height: 26px;
    }

    .tab {
        padding: 4px 8px;
        color: #333;
        text-decoration: none;
        line-height: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        border-bottom: 2px solid transparent;
        transition: border-color 0.15s ease, color 0.15s ease;
    }

    .tab.active {
        color: #06c;
        border-bottom-color: #06c;
        letter-spacing: 0;
    }

    .tab:hover:not(.active) {
        border-bottom-color: #bbb;
    }

    .sidebar-header :global(a) {
        color: inherit;
        text-decoration: none;
    }

    .sidebar-header :global(a:hover) {
        color: inherit;
        text-decoration: underline;
    }

    .entity-icon {
        width: 22px;
        height: 22px;
        margin-inline-end: .5em;
        filter: brightness(0);
        user-select: none;
    }

    .font-icon {
        margin-inline-end: 10px;
        font-size: 20px;
    }
</style>