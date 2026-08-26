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
    export let options: { value: any; label: string; hidden?: boolean; group?: string; disabled?: boolean; onClick?: () => void }[] | null = null;
    export let onSelect: (value: any) => void = () => {
    };

    let open = false;
    let rootEl: HTMLDivElement;
    let valueLabel: string | undefined;

    $: valueLabel = options?.find(o => o.value === value)?.label ?? value;
    $: visibleOptions = (options ?? []).filter(o => !o.hidden);
    $: visibleOptionsWithLayout = (() => {
        let lastGroup: string | undefined;
        let isFirst = true;
        return visibleOptions.map(option => {
            const isNewGroup = option.group !== lastGroup;
            const showDivider = isNewGroup && !isFirst;
            const showGroupHeader = isNewGroup && !!option.group;
            lastGroup = option.group;
            isFirst = false;
            return {option, showDivider, showGroupHeader};
        });
    })();

    function isOptionDisabled(option: { value: any; disabled?: boolean }): boolean {
        return !!option.disabled || String(option.value) === String(value);
    }

    function select(option: { value: any; disabled?: boolean; onClick?: () => void }): void {
        if (isOptionDisabled(option)) {
            return;
        }
        open = false;
        if (option.onClick) {
            option.onClick();
        } else {
            onSelect(option.value);
        }
    }

    function toggle(): void {
        if (!visibleOptions.length) {
            return;
        }
        open = !open;
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
            <button type="button" title={iconTitle} on:click={onIconClick}>
                <i class="{iconClass}"></i>
            </button>
        {/if}

        {#if visibleOptions.length}
            <button type="button" class="last" data-toggle="dropdown" on:click={toggle} title={iconTitle}>
                {#if !iconClickable}
                    <i class="{iconClass}"></i>
                {/if}
                <span>{@html valueLabel}</span>
            </button>
            <ul class="dropdown-menu">
                {#each visibleOptionsWithLayout as { option, showDivider, showGroupHeader } (option.value)}
                    {#if showDivider}
                        <li class="divider"></li>
                    {/if}
                    {#if showGroupHeader}
                        <li class="dropdown-header">{option.group}</li>
                    {/if}
                    <li class:disabled={isOptionDisabled(option)}>
                        <a href="javascript:" on:click|preventDefault={() => select(option)}>{@html option.label}</a>
                    </li>
                {/each}
            </ul>
        {:else}
            <span class="control-value">{@html valueLabel}</span>
        {/if}
    </div>
</div>

<style>
    .toolbar-control {
        position: relative;
        font-size: 12px;
    }
</style>
