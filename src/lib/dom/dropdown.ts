/*
 *  AtroCore Software
 *
 *  This source file is available under GNU General Public License version 3 (GPLv3).
 *  Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 *  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 *  @license    GPLv3 (https://www.gnu.org/licenses/)
 */

import Floating from "$lib/dom/floating";
import type FloatingParams from "$lib/types/ui/floating-params";
import type HTMLElementWithDropdown from "$lib/types/ui/html-element-with-dropdown";

type HTMLElementWithSelectize = HTMLElement & { selectize?: any };

function processDropdownMutation(mutation: MutationRecord): void {
    mutation.removedNodes.forEach(node => {
        const dropdownNode = node as HTMLElementWithDropdown;
        if (dropdownNode?._dropdown) {
            dropdownNode._dropdown.destroy();
        }
    });

    Dropdown.initWithinNode(mutation.target as HTMLElement);
}

function processSelectizeMutation(mutation: MutationRecord): void {
    mutation.removedNodes.forEach(node => {
        const reference = node as HTMLElementWithDropdown;
        if (reference instanceof HTMLElement && reference._dropdown) {
            reference._dropdown.destroy();
        }
    });

    mutation.addedNodes.forEach(node => {
        if (!(node instanceof HTMLElement)) return;

        if (node.closest('.query-builder')) return;

        if (node.classList.contains('selectize-control')) {
            const mainEl = node.parentNode?.querySelector('.selectized') as HTMLElementWithSelectize;
            const selectize = mainEl?.selectize;
            const input = node.querySelector('.selectize-input') as HTMLElementWithDropdown;
            const dropdown = node.querySelector('.selectize-dropdown') as HTMLElement;

            if (!selectize || !input || !dropdown) return;

            if (input._dropdown) {
                input._dropdown.destroy();
            }

            // override positioning logic for selectize dropdown
            selectize.positionDropdown = () => {
                dropdown.style.width = node.offsetWidth + 'px';
            };

            const dropdownObj = new Floating(input, dropdown, {
                usePositionOnly: true,
            });

            requestAnimationFrame(() => {
                if (selectize.isOpen) {
                    dropdownObj.open();
                }
            });

            selectize.on('dropdown_open', () => {
                requestAnimationFrame(() => dropdownObj.open());
            });

            selectize.on('dropdown_close', () => {
                requestAnimationFrame(() => dropdownObj.close());
            });

            selectize.on('item_remove', () => {
                requestAnimationFrame(() => dropdownObj.open());
            });
        }
    });
}

export const Dropdown = {
    create: (referenceEl: HTMLElement, floatingEl: HTMLElement, params?: FloatingParams) => {
        return new Floating(referenceEl, floatingEl, params);
    },

    initWithinNode: (node: HTMLElement) => {
        node.querySelectorAll('[data-toggle=dropdown]').forEach(el => {
            if (el.closest('#header')) {
                return;
            }

            const reference = el as HTMLElementWithDropdown;
            if (reference._dropdown) {
                return;
            }

            const menu = reference.parentNode?.querySelector('.dropdown-menu') as HTMLElement;
            if (!menu) {
                return;
            }

            new Floating(reference, menu);
        });
    },

    processMutation: (mutation: MutationRecord) => {
        processDropdownMutation(mutation);
        processSelectizeMutation(mutation);
    }
}