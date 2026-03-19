<script lang="ts">
    import type Button from "$lib/types/ui/button";

    export let buttonList: Button[] = [];
    export let disabled: boolean = false;
</script>

<div class="button-container">
    {#each buttonList as button}
        <button
                on:click={button.onClick}
                data-action="{button.name}"
                disabled={disabled || button.disabled}
                type="button"
                style="{button.cssStyle}"
                class={`action ${button.style ?? ''}`}>
            {button.label}
        </button>
    {/each}
</div>

<style>
    .button-container {
        display: flex;
        gap: 10px;
        padding-top: 10px;
    }
</style>