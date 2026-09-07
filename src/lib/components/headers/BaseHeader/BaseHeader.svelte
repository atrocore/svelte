<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { onMount, onDestroy } from "svelte";

    import Breadcrumbs from "./Breadcrumbs/Breadcrumbs.svelte";
    import type BreadcrumbsItem from "$lib/types/ui/header/breadcrumbs-item";
    import NavigationHistory from "./NavigationHistory/NavigationHistory.svelte";

    export let breadcrumbs: BreadcrumbsItem[] = [];
    export let disableNavigationHistory: boolean = false;
    export let currentIsHeading: boolean = true;
    export let scope: string | null = null;
    export let id: string | null = null;
    export let minimizeHeaderOnScroll: boolean = false;

    let entityHistoryEl: HTMLElement;
    let breadcrumbsEl: HTMLElement;
    let isStuck = false;
    let observer: IntersectionObserver | null = null;

    $: effectiveIsHeading = currentIsHeading && !isStuck;

    onMount(() => {
        if (!minimizeHeaderOnScroll) {
            return;
        }

        const root = entityHistoryEl.closest('main');

        observer = new IntersectionObserver(
            ([entry]) => {
                const stuck = !entry.isIntersecting;

                if (window.screen.width < 768) {
                    isStuck = stuck;
                    return;
                }

                requestAnimationFrame(() => {
                    if (root instanceof HTMLElement) {
                        root.style.paddingBottom = stuck ? `${breadcrumbsEl?.offsetHeight ?? 0}px` : '';
                    }
                    isStuck = stuck;
                });
            },
            {root, threshold: 0}
        );
        observer.observe(entityHistoryEl);
    });

    onDestroy(() => observer?.disconnect());
</script>

<div class="entity-history-container" bind:this={entityHistoryEl}>
    {#if !disableNavigationHistory && scope}
        <NavigationHistory {scope} {id} tabId={sessionStorage.tabId}/>
    {/if}
</div>

<div class="header-wrapper" class:is-stuck={isStuck}>
    {#if breadcrumbs.length > 0}
        <nav class="header-breadcrumbs" bind:this={breadcrumbsEl}>
            <Breadcrumbs items={breadcrumbs} currentIsHeading={effectiveIsHeading}/>
        </nav>
    {/if}

    <slot></slot>
</div>

<style>
    .entity-history-container,
    .header-wrapper {
        padding-top: 10px;
        padding-left: 20px;
        padding-right: 20px;
    }

    .header-wrapper {
        padding-bottom: 0;
    }
</style>
