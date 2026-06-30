<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { onMount, onDestroy } from 'svelte';

    export let header: string = '';
    export let buttons: Array<{
        name: string;
        label: string;
        style?: string;
        disabled?: boolean;
    }> = [];
    export let onButtonClick: (name: string) => void = () => {};
    export let onClose: () => void = () => {};
    export let fitHeight: boolean = false;

    let modalEl: HTMLElement;
    const jQuery = (window as any).$;

    function applyFitHeight(): void {
        const headerHeight = jQuery(modalEl).find('header.modal-header').outerHeight() ?? 0;
        const footerHeight = jQuery(modalEl).find('footer.modal-footer').outerHeight() ?? 0;
        const windowHeight = window.innerHeight;
        const bodyHeight = windowHeight - headerHeight - footerHeight;
        jQuery(modalEl).find('div.modal-body').css({ height: bodyHeight + 'px', overflow: 'auto' });
    }

    onMount(() => {
        jQuery(modalEl).modal({ backdrop: 'static', keyboard: false });
        jQuery(modalEl).on('hidden.bs.modal', () => onClose());

        if (fitHeight) {
            jQuery(modalEl).on('shown.bs.modal', () => {
                applyFitHeight();
                jQuery(window).on('resize.modal-fit-height', applyFitHeight);
            });
        }
    });

    onDestroy(() => {
        if (fitHeight) {
            jQuery(window).off('resize.modal-fit-height');
        }
        jQuery(modalEl).modal('hide');
        jQuery(modalEl).off('hidden.bs.modal');
        if (!jQuery('.modal:visible').length) {
            jQuery('.modal-backdrop').remove();
            jQuery('body').removeClass('modal-open');
        }
    });

    export function close(): void {
        jQuery(modalEl).modal('hide');
    }
</script>

<div bind:this={modalEl} class="dialog modal" role="dialog" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <header class="modal-header">
                <a href="javascript:" class="close" on:click={close}>
                    <span aria-hidden="true"><i class="ph ph-x"></i></span>
                </a>
                <h4 class="modal-title">{header}</h4>
            </header>

            {#if buttons.length}
                <footer class="modal-footer">
                    <div class="btn-group main-btn-group">
                        {#each buttons as btn (btn.name)}
                            <button
                                    type="button"
                                    class="btn btn-{btn.style ?? 'default'}"
                                    disabled={btn.disabled ?? false}
                                    on:click={() => onButtonClick(btn.name)}
                            >
                                {btn.label}
                            </button>
                        {/each}
                    </div>
                </footer>
            {/if}

            <div class="modal-body-wrapper">
                <div class="modal-body body">
                    <slot />
                </div>
            </div>
        </div>
    </div>
</div>
