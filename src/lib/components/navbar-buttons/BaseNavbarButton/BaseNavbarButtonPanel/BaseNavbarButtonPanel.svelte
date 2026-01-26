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
    import { onDestroy, onMount } from 'svelte';

    export let isOpen: boolean = false;
    export let close: () => void;
    export let icon: HTMLElement | null = null;
    export let title: string = '';
    export let panelClass: string = '';
    export let width: string = '';

    let panel: HTMLElement;

    $: panelStyle = width ? `width: ${width}` : '';

    function handleClickOutside(event: MouseEvent): void {
        const target = event.target as Node;

        // Check if any modal is open
        const modalContainer = document.querySelector('.modal-container');
        const modal = document.querySelector('.modal');
        const modalBackdrop = document.querySelector('.modal-backdrop');

        // Don't close if target is no longer in DOM (was part of modal that closed)
        if (!document.body.contains(target)) {
            return;
        }

        if (panel && !panel.contains(target) &&
            icon && !icon.contains(target) &&
            isOpen && !modalContainer && !modal && !modalBackdrop) {
            close();
        }
    }

    onMount(() => {
        document.addEventListener('click', handleClickOutside);
    });

    onDestroy(() => {
        document.removeEventListener('click', handleClickOutside);
    });
</script>

{#if isOpen}
    <div bind:this={panel} class="base-panel-container {panelClass}">
        <div class="panel panel-default" style={panelStyle}>
            <div class="panel-heading clearfix">
                <span class="panel-heading-title">{title}</span>
                <span class="pull-right">
                    <a href="/" class="close" on:click|preventDefault={close}>
                        <span aria-hidden="true">&times;</span>
                    </a>
                </span>
            </div>
            <div class="panel-body">
                <slot name="actions"></slot>
                <slot></slot>
            </div>
            <slot name="footer"></slot>
        </div>
    </div>
{/if}

<style>
    .base-panel-container {
        position: absolute;
        right: 0;
        z-index: 1000;
    }

    .panel {
        min-width: 500px;
        box-shadow: 0 13px 13px rgba(0, 0, 0, 0.175);
        background: white;
    }

    .panel-body {
        max-height: 400px;
        overflow-y: auto;
    }

    .close {
        margin-left: 10px;
    }
</style>
