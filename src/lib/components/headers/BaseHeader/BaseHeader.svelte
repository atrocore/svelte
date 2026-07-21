<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import Breadcrumbs from "./Breadcrumbs/Breadcrumbs.svelte";
    import type BreadcrumbsItem from "$lib/types/ui/header/breadcrumbs-item";
    import NavigationHistory from "./NavigationHistory/NavigationHistory.svelte";

    export let breadcrumbs: BreadcrumbsItem[] = [];
    export let disableNavigationHistory: boolean = false;
    export let currentIsHeading: boolean = true;
    export let scope: string | null = null;
    export let id: string | null = null;

</script>

{#if !disableNavigationHistory && scope}
    <NavigationHistory {scope} {id} tabId={sessionStorage.tabId}/>
{/if}

<div class="header-wrapper">
    {#if breadcrumbs.length > 0}
        <nav class="header-breadcrumbs">
            <Breadcrumbs items={breadcrumbs} {currentIsHeading}/>
        </nav>
    {/if}

    <slot></slot>
</div>
