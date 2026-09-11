<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import type AnchorNavItem from "./types/anchor-nav-item";
    import { onDestroy, onMount, tick } from "svelte";
    import {OverlayScrollbars} from "overlayscrollbars";
    import type HTMLElementWithDropdown from "$lib/types/ui/html-element-with-dropdown";

    export let items: AnchorNavItem[];
    export let scrollCallback = (panelName: string, event: Event): void => {
    };
    export let hasLayoutEditor: boolean = false;
    export let activeItemName: string | null = null;

    export let afterOnMount: () => void = () => {}

    let container: HTMLDivElement;

    function scrollIntoViewForElement(el: HTMLElement) {
        const viewport = el.closest('[data-overlayscrollbars-viewport]') as HTMLElement | null;
        if (!viewport) {
            return;
        }

        const elRect = el.getBoundingClientRect();
        const viewportRect = viewport.getBoundingClientRect();

        let delta = 0;
        if (elRect.left < viewportRect.left) {
            delta = elRect.left - viewportRect.left;
        } else if (elRect.right > viewportRect.right) {
            delta = elRect.right - viewportRect.right;
        }

        if (delta !== 0) {
            viewport.scrollBy({left: delta, behavior: 'smooth'});
        }
    }

    let lastScrolledItemName: string | null = null;

    $: if (activeItemName && activeItemName !== lastScrolledItemName && container) {
        lastScrolledItemName = activeItemName;
        const activeLink = container.querySelector(`[data-name="${activeItemName}"]`);
        const activeLi = activeLink?.closest('li');
        if (activeLi) {
            scrollIntoViewForElement(activeLi as HTMLElement);
        }
    }

    function closeLayoutEditorDropdown(): void {
        // TODO: replace with prop when layout editor component is ready
        container?.querySelectorAll('.layout-editor-container [data-toggle="dropdown"]')
            .forEach((el) => (el as HTMLElementWithDropdown)._dropdown?.close());
    }

    onMount(() => {
        OverlayScrollbars(container, {
            scrollbars: { autoHide: 'leave', autoHideDelay: 400 },
        }, {
            scroll: closeLayoutEditorDropdown,
        });

        tick().then(() => {
            afterOnMount();
        })

        window.addEventListener('click', handleWindowClick);
    });

    onDestroy(() => {
        window.removeEventListener('click', handleWindowClick);
        clearHoverTimeout();
    });

    let panelsDropdownEl: HTMLDivElement;
    let panelsDropdownOpen: boolean = false;
    let panelsDropdownOpenedByClick: boolean = false;
    let hoverTimeoutId: ReturnType<typeof setTimeout> | null = null;
    const hoverOpenDelayMs: number = 500;
    const hoverCloseDelayMs: number = 200;

    function clearHoverTimeout(): void {
        if (hoverTimeoutId !== null) {
            clearTimeout(hoverTimeoutId);
            hoverTimeoutId = null;
        }
    }

    function togglePanelsDropdown(): void {
        clearHoverTimeout();
        panelsDropdownOpen = !panelsDropdownOpen;
        panelsDropdownOpenedByClick = panelsDropdownOpen;
    }

    function handlePanelsDropdownMouseEnter(): void {
        clearHoverTimeout();

        if (panelsDropdownOpen) {
            return;
        }

        hoverTimeoutId = setTimeout(() => {
            panelsDropdownOpen = true;
            panelsDropdownOpenedByClick = false;
            hoverTimeoutId = null;
        }, hoverOpenDelayMs);
    }

    function handlePanelsDropdownMouseLeave(): void {
        clearHoverTimeout();

        if (!panelsDropdownOpen || panelsDropdownOpenedByClick) {
            return;
        }

        hoverTimeoutId = setTimeout(() => {
            panelsDropdownOpen = false;
            hoverTimeoutId = null;
        }, hoverCloseDelayMs);
    }

    function handleWindowClick(event: MouseEvent): void {
        if (panelsDropdownOpen && panelsDropdownEl && !panelsDropdownEl.contains(event.target as Node)) {
            clearHoverTimeout();
            panelsDropdownOpen = false;
            panelsDropdownOpenedByClick = false;
        }
    }

    function onPanelsDropdownItemClick(event: Event): void {
        event.preventDefault();
        clearHoverTimeout();
        panelsDropdownOpen = false;
        panelsDropdownOpenedByClick = false;

        const el = event.currentTarget as HTMLElement;
        if (el.dataset.name) {
            scrollCallback(el.dataset.name as string, event);
        }
    }

    function onClick(event: Event): void {
        event.preventDefault();

        const el = event.currentTarget as HTMLElement;
        const li = el.closest('li') as HTMLElement;
        if (li) {
            scrollIntoViewForElement(li);
        }

        if (el.dataset.name) {
            scrollCallback(el.dataset.name as string, event);
        }
    }
</script>

<div class="panel-navigation">
    {#if items && items.length > 0}
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div class="panels-dropdown" class:open={panelsDropdownOpen} bind:this={panelsDropdownEl}
             on:mouseenter={handlePanelsDropdownMouseEnter} on:mouseleave={handlePanelsDropdownMouseLeave}>
            <button type="button" class="small panels-dropdown-toggle" on:click={togglePanelsDropdown} data-toggle="dropdown"
                    aria-haspopup="true" aria-expanded={panelsDropdownOpen}>
                <i class="ph" class:ph-caret-down={!panelsDropdownOpen} class:ph-caret-up={panelsDropdownOpen} style="font-size: 14px;"></i>
            </button>
            <ul class="dropdown-menu panels-dropdown-menu">
                {#each items as item}
                    <li><a href="javascript:" data-name={item.name}
                           on:click={onPanelsDropdownItemClick}>{item.title ?? item.name}</a></li>
                {/each}
            </ul>
        </div>
    {/if}
    {#if items}
        <div class="items-container os-host-flexbox"
             bind:this={container}
        >
            <ul class="nav-pills">
                {#each items as item}
                    <li class="item" class:active={item.name === activeItemName}><a href="javascript:" data-name={item.name}
                                        on:click={onClick}>{item.title ?? item.name}</a></li>
                {/each}
                {#if hasLayoutEditor}
                    <div class="layout-editor-container"></div>
                {/if}
            </ul>
        </div>
    {/if}
</div>

<style>
    :global(.panel-navigation .os-scrollbar) {
        --os-size: 6px;
    }

    .panel-navigation {
        display: flex;
        position: relative;
        overflow-x: clip;
        border-top: 1px solid #eee;
        padding: 0 20px;
        margin: 0 -20px;
        background: #fafafa;
        box-shadow: 0 5px 5px 0 rgb(204 204 204 / 20%);
    }

    .panel-navigation .layout-editor-container {
        flex-shrink: 0;
        margin-left: auto;
        padding: 0 5px;
        display: flex;
        align-items: center;
    }

    .panels-dropdown {
        position: relative;
        display: flex;
        align-items: center;
        flex-shrink: 0;
    }

    .panels-dropdown-toggle {
        padding: 3px;
        margin-inline-end: 4px;
    }

    .items-container {
        position: relative;
        display: flex;
        overflow: hidden;
        -webkit-user-select: none;
        user-select: none;
    }

    .nav-pills {
        display: flex;
        gap: 5px;
        padding: 0;
        margin: 0;
        list-style: none;
    }

    .nav-pills > li > a {
        display: block;
        padding: 10px 5px;
        color: #333;
        transition: border-bottom-color .2s ease, color .2s ease;
        user-select: none;
        font-size: 13px;
        line-height: 1;
        -webkit-user-drag: none;
        white-space: nowrap;
    }

    .nav-pills > li > a, .nav-pills > li > a:hover {
        background-color: transparent;
        text-decoration: none;
    }

    .nav-pills > li > a:hover, .nav-pills > li.active > a {
        color: #1a75d1;
    }
</style>
