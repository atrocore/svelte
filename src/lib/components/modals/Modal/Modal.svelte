<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts" context="module">
    let modalCounter = 0;
</script>

<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import type { ModalButton, ModalPosition, ModalButtonsPosition, ModalButtonsAlign } from './types/modal-button';

    export let header: string = '';
    export let buttons: ModalButton[] = [];
    export let buttonsPosition: ModalButtonsPosition = 'top';
    export let buttonsAlign: ModalButtonsAlign = 'left';
    export let onButtonClick: (name: string) => void = () => {};
    export let onClose: () => void = () => {};
    export let fullHeight: boolean = false;
    export let fullWidth: boolean = false;
    export let position: ModalPosition = 'center';
    export let closeOnEscape: boolean = false;
    export let closeOnBackdrop: boolean = false;
    export let beforeClose: () => boolean | Promise<boolean> = () => true;

    const titleId = `modal-title-${++modalCounter}`;

    let dialogEl: HTMLDialogElement;

    onMount(() => {
        dialogEl.showModal();
    });

    onDestroy(() => {
        if (dialogEl?.open) {
            dialogEl.close();
        }
    });

    async function attemptClose(): Promise<void> {
        const canClose = await beforeClose();
        if (!canClose) {
            return;
        }
        if (dialogEl.open) {
            dialogEl.close();
        }
        onClose();
    }

    export function close(): void {
        attemptClose();
    }

    function handleCancel(e: Event): void {
        e.preventDefault();
        if (closeOnEscape) {
            attemptClose();
        }
    }

    function handleBackdropClick(e: MouseEvent): void {
        if (closeOnBackdrop && e.target === dialogEl) {
            attemptClose();
        }
    }

    function handleFooterButtonClick(btn: ModalButton): void {
        if (btn.type === 'submit') {
            return;
        }
        onButtonClick(btn.name);
    }
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<dialog
    bind:this={dialogEl}
    class="dialog position-{position}"
    class:full-width={fullWidth}
    class:full-height={fullHeight || position === 'left' || position === 'right'}
    class:buttons-in-header={buttonsPosition === 'top'}
    aria-labelledby={$$slots.header ? undefined : titleId}
    on:cancel={handleCancel}
    on:click={handleBackdropClick}
>
    <header class:default={!$$slots.header}>
        {#if $$slots.header}
            <slot name="header" />
        {:else}
            <h2 id={titleId}>{header}</h2>
        {/if}
        <button type="button" class="close" on:click={close} aria-label="Close">
            <i class="ph ph-x"></i>
        </button>
    </header>

    <main class="body">
        <slot />
    </main>

    {#if buttons.length}
        <footer class:align-left={buttonsAlign === 'left'}>
            {#each buttons as btn (btn.name)}
                <button
                    type={btn.type ?? 'button'}
                    form={btn.form}
                    class={btn.style ?? ''}
                    disabled={btn.disabled || btn.loading || false}
                    on:click={() => handleFooterButtonClick(btn)}
                >
                    {#if btn.loading}
                        <i class="ph ph-circle-notch ph-spin"></i>
                    {:else if btn.iconClass}
                        <i class={btn.iconClass}></i>
                    {/if}
                    <span>{btn.label}</span>
                </button>
            {/each}
        </footer>
    {/if}
</dialog>

<style>
    .dialog {
        display: flex;
        flex-direction: column;
        width: 700px;
        max-width: calc(100vw - 40px);
        max-height: calc(100vh - 40px);
        margin: auto;
        padding: 0;
        border: none;
        border-radius: 10px;
        background-color: #fff;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
        overflow: hidden;
    }

    .dialog::backdrop {
        background: rgba(0, 0, 0, 0.5);
    }

    .dialog.full-width {
        width: calc(100vw - 40px);
    }

    .dialog.full-height {
        height: calc(100vh - 40px);
    }

    .dialog.position-top {
        margin-top: 48px;
        margin-bottom: auto;
    }

    .dialog.position-left {
        margin-left: 20px;
        margin-right: auto;
    }

    .dialog.position-right {
        margin-right: 20px;
        margin-left: auto;
    }

    header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 12px 20px;
        border-bottom: 1px solid #e5e5e5;
        flex-shrink: 0;
    }

    header button.close {
        color: inherit;
        opacity: 1;
    }

    header button.close i {
        font-size: 22px;
    }

    header.default {
        background: var(--nav-menu-background);
        color: var(--nav-font-color);
    }

    header h2 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        line-height: 24px;
        text-transform: uppercase;
    }

    header {
        order: 0;
    }

    .body {
        order: 1;
        flex: 1;
        overflow: auto;
        padding: 20px;
    }

    footer {
        order: 2;
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding: 10px 20px;
        flex-shrink: 0;
    }

    footer.align-left {
        justify-content: flex-start;
    }

    .dialog.buttons-in-header .body {
        order: 2;
    }

    .dialog.buttons-in-header footer {
        order: 1;
    }
</style>
