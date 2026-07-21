<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

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