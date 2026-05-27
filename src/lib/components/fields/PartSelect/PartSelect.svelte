<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { onMount, onDestroy, tick } from 'svelte';
    import { createEventDispatcher } from 'svelte';

    export let name: string;
    export let value: string | null = null;
    export let options: Array<{ id: string; label: string }> = [];
    export let wrapperClass: string = '';

    const dispatch = createEventDispatcher<{ change: string | null }>();

    let selectEl: HTMLSelectElement;
    let selectizeInstance: any = null;
    let syncing = false;

    onMount(() => {
        tick().then(() => {
            initSelectize();
        })
    });

    onDestroy(() => {
        if (selectizeInstance) {
            selectizeInstance.destroy();
            selectizeInstance = null;
        }
    });

    function registerClearButtonPlugin(): void {
        const Selectize = (window as any).Selectize;
        if (!Selectize) return;

        Selectize.define('clear_button', function (this: any) {
            const self = this;

            function appendButton(): void {
                if (!self.getValue()) {
                    self.$control.find('.clear-button').remove();
                    return;
                }
                if (self.$control.find('.clear-button').length) return;
                const $ = (window as any).$;
                const $btn = $('<a href="javascript:" class="clear-button" title="Clear"><i class="ph ph-minus"></i></a>');
                $btn.on('click', (e: MouseEvent) => {
                    e.preventDefault();
                    self.clear();
                });
                self.$control.append($btn);
            }

            this.setup = (function () {
                const original = self.setup;
                return function (this: any) {
                    original.apply(this, arguments);
                    appendButton();
                    this.on('change', appendButton);
                    this.on('clear', appendButton);
                    this.on('item_add', appendButton);
                    this.on('item_remove', appendButton);
                };
            })();
        });
    }

    function initSelectize(): void {
        const $ = (window as any).$;
        if (!$ || typeof $.fn?.selectize !== 'function' || !selectEl) return;

        registerClearButtonPlugin();

        $(selectEl).selectize({
            valueField: 'value',
            labelField: 'text',
            searchField: ['text'],
            plugins: ['clear_button'],
            onChange(val: string) {
                if (!syncing) dispatch('change', val || null);
            }
        });

        selectizeInstance = (selectEl as any).selectize;
    }

    $: if (selectizeInstance) {
        tick().then(() => {
            syncing = true;
            selectizeInstance.clearOptions();
            selectizeInstance.addOption({ value: '', text: '' });
            options.forEach(opt => selectizeInstance.addOption({ value: opt.id, text: opt.label }));
            selectizeInstance.refreshOptions(false);
            selectizeInstance.setValue(value ?? '', true);
            syncing = false;
        })

    }
</script>

<div class="part-select {wrapperClass}">
    <select bind:this={selectEl} {name} class="form-control"></select>
</div>
