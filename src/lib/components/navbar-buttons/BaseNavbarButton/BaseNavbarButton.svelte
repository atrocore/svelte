<!--
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 -->

<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    export let title: string = '';
    export let iconClass: string = '';
    export let isOpen: boolean = false;

    const dispatch = createEventDispatcher();

    let iconElement: HTMLElement;

    function handleClick(): void {
        if (!isOpen) {
            isOpen = true;
            dispatch('open');
        }
    }

    export function close(): void {
        isOpen = false;
        dispatch('close');
    }

    export function getIconElement(): HTMLElement {
        return iconElement;
    }
</script>

<a
        href="/"
        class="notifications-button"
        bind:this={iconElement}
        on:click|preventDefault={handleClick}
        {title}
>
    <i class={iconClass}></i>
    <slot name="badge-indicator"></slot>
</a>
<slot name="panel" {isOpen} {iconElement} close={close}></slot>

<style>
    .notifications-button {
        position: relative;
    }
</style>
