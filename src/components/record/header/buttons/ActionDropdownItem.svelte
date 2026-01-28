<script lang="ts">
    import { Language } from "$lib/core/language";
    import { createEventDispatcher } from "svelte";
    import ActionParams from "../interfaces/ActionParams";

    const dispatch = createEventDispatcher();

    export let params: ActionParams;
    export let className: string = '';

    function runAction(e: Event) {
        const el = e.target as HTMLElement;

        dispatch('execute', {
            data: el.dataset,
            action: el.dataset.action,
            event: e
        });
    }
</script>

<a href="javascript:" class="action {className}" data-name={params.name} data-action={params.action || params.name}
   data-id={params.id} title={params.tooltip} on:click={runAction}>
    {#if params.html}{@html params.html}{:else}{Language.translate(params.label)}{/if}
</a>