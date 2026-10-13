/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

import type SelectizeParams from "$lib/types/ui/selectize-params";

type HTMLSelectElementWithSelectize = HTMLSelectElement & { selectize?: any };

let clearButtonRegistered = false;

function registerClearButtonPlugin(): void {
    if (clearButtonRegistered) {
        return;
    }

    clearButtonRegistered = true;

    (window as any).Selectize.define('clear_button', function (this: any) {
        const self = this;

        function appendButton(): void {
            if (!self.getValue()) {
                self.$control.find('.clear-button').remove();
                return;
            }
            if (self.$control.find('.clear-button').length) return;
            const $btn = (window as any).$('<a href="javascript:" class="clear-button" title="Clear"><i class="ph ph-minus"></i></a>');
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

export function selectize(node: HTMLSelectElementWithSelectize, params: SelectizeParams) {
    let current = params;

    const getValue = (): string | null => current.clearable ? (current.value ?? '') : current.value;

    const create = (): void => {
        if (current.clearable) {
            registerClearButtonPlugin();
        }

        const value = getValue();

        (window as any).$(node).selectize({
            valueField: 'value',
            labelField: 'text',
            searchField: ['text'],
            plugins: current.clearable ? ['clear_button'] : [],
            options: current.clearable ? [{ value: '', text: '' }, ...current.options] : current.options,
            items: value !== null ? [value] : [],
            onChange: (value: string) => {
                if (value || current.clearable) {
                    current.onChange(value);
                }
            }
        });
    };

    create();

    return {
        update: (next: SelectizeParams) => {
            const optionsChanged = next.clearable !== current.clearable || JSON.stringify(next.options) !== JSON.stringify(current.options);
            current = next;

            if (optionsChanged) {
                node.selectize?.destroy();
                create();
                return;
            }

            const value = getValue();
            if (value !== null && node.selectize?.getValue() !== value) {
                node.selectize?.setValue(value, true);
            }
        },
        destroy: () => node.selectize?.destroy()
    };
}
