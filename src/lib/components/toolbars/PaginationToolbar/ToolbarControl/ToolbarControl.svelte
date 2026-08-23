<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    export let iconClass: string;
    export let iconTitle: string = '';
    export let iconClickable: boolean = false;
    export let onIconClick: () => void = () => {
    };

    export let value: string;
    export let options: { value: any; label: string }[] | null = null;
    export let onSelect: (value: any) => void = () => {
    };

    let open = false;
    let rootEl: HTMLDivElement;
    let valueLabel: string | undefined;

    $: valueLabel = options?.find(o => o.value === value)?.label ?? value;

    function toggle(): void {
        if (!options || !options.length) {
            return;
        }
        open = !open;
    }

    function select(optionValue: any): void {
        if (String(optionValue) === String(value)) {
            return;
        }
        open = false;
        onSelect(optionValue);
    }

    function handleWindowClick(e: MouseEvent): void {
        if (open && rootEl && !rootEl.contains(e.target as Node)) {
            open = false;
        }
    }
</script>

<svelte:window on:click={handleWindowClick} />

<div class="toolbar-control" bind:this={rootEl}>
    <div class="button-group" class:open>
        {#if iconClickable}
            <button type="button" class="small" title={iconTitle} on:click={onIconClick}>
                <i class="{iconClass}"></i>
            </button>
        {/if}

        {#if options && options.length}
            <button type="button" class="small" data-toggle="dropdown" on:click={toggle} title={iconTitle}>
                {#if !iconClickable}
                    <i class="{iconClass}"></i>
                {/if}
                <span>{valueLabel}</span>
            </button>
            <ul class="dropdown-menu">
                {#each options as option (option.value)}
                    <li class:disabled={String(option.value) === String(value)}>
                        <a href="javascript:" on:click|preventDefault={() => select(option.value)}>{option.label}</a>
                    </li>
                {/each}
            </ul>
        {:else}
            <span class="control-value">{valueLabel}</span>
        {/if}
    </div>
</div>

<style>
    .toolbar-control {
        position: relative;
        font-size: 12px;
    }

    .dropdown-menu li a {
        padding: 5px 15px;
        font-size: 12px;
        line-height: 16px;
    }
</style>
