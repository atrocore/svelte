<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import type BreadcrumbsItem from "$lib/types/ui/header/breadcrumbs-item";

    export let items: BreadcrumbsItem[] = [];
    export let currentIsHeading: boolean = true;
</script>

<ul class="breadcrumbs-wrapper">
    {#each items as item, index}
        <li class="breadcrumbs-item" class:full-width={index === items.length - 1 && currentIsHeading}>
            {#if index !== items.length - 1}
                {#if item.url}
                    <a href="{item.url}" class={item.className}>
                        {#if item.html}{@html item.html}{:else}{item.label}{/if}
                    </a>
                {:else}
                    <span class={item.className}>{#if item.html}{@html item.html}{:else}{item.label}{/if}</span>
                {/if}
            {:else}
                {#if currentIsHeading}
                    <h3 class={item.className}>
                        {#if item.html}{@html item.html}{:else}{item.label}{/if}
                    </h3>
                {:else}
                    <span class={item.className}>{#if item.html}{@html item.html}{:else}{item.label}{/if}</span>
                {/if}
            {/if}
        </li>
    {/each}
</ul>

<style>
    .breadcrumbs-wrapper {
        display: block;
        padding: 0;
        margin: 0;
    }

    .breadcrumbs-item {
        display: inline;
        color: #000;
    }

    .breadcrumbs-item.full-width {
        display: block;
        margin: 5px 0 0;
    }

    .breadcrumbs-item:not(:last-child):after {
        content: " / ";
        margin: 0 0.25em;
        color: #bbb;
    }

    .breadcrumbs-item > a {
        color: inherit;
    }

    .breadcrumbs-item > h3 {
        font-size: 20px;
        line-height: normal;
    }
</style>