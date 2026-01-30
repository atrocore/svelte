<script lang="ts">
    import { onMount } from "svelte";

    import {
        getLastEntities
    } from "$lib/components/containers/header/BaseHeader/NavigationHistory/utils/entity-history-utils";

    import NavigationHistoryItem
        from "$lib/components/containers/header/BaseHeader/NavigationHistory/types/navigation-history-item";
    import Preloader from "$lib/components/loaders/Preloader/Preloader.svelte";

    export let scope: string;
    export let id: string | null = null;
    export let tabId: string | null = null;

    let items: NavigationHistoryItem[] = [];
    let loading = false;

    onMount(() => {
        loading = true;
        getLastEntities(scope, id, tabId)
            .then(result => items = result)
            .catch(error => console.error("Error: ", error))
            .finally(() => loading = false);
    });
</script>

<nav class="entity-history">
    {#if loading}
        <Preloader heightPx={10}/>
    {/if}

    {#if items.length > 0}
        <ul>
            {#each items as item}
                <li class={item.className}><a title={item.tooltip} href={item.link}>{item.label}</a></li>
            {/each}
        </ul>
    {/if}
</nav>


<style>
    .entity-history {
        margin-bottom: 15px;
        height: 20px;
        overflow: hidden;
    }

    nav > ul {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        margin: 0;
        padding: 0;
    }

    nav > ul > li {
        display: inline;
        color: #888;
        font-size: 12px;
        line-height: 20px;
    }

    nav > ul > li:not(:first-child):before {
        content: "";
        display: inline-block;
        width: 10px;
        height: 12px;
        vertical-align: middle;
        margin: 0 .5em;
        mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgZmlsbD0iIzAwMDAwMCIgdmlld0JveD0iMCAwIDI1NiAyNTYiPjxwYXRoIGQ9Ik0xNjUuNjYsMjAyLjM0YTgsOCwwLDAsMS0xMS4zMiwxMS4zMmwtODAtODBhOCw4LDAsMCwxLDAtMTEuMzJsODAtODBhOCw4LDAsMCwxLDExLjMyLDExLjMyTDkxLjMxLDEyOFoiPjwvcGF0aD48L3N2Zz4=");
        background-color: #bbb;
        mask-size: 100%;
        mask-repeat: no-repeat;
    }

    nav > ul > li > a {
        color: inherit;
    }

    nav > ul > li.entity {
        font-style: italic;
    }
</style>