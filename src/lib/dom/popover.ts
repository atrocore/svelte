/*
 *  AtroCore Software
 *
 *  This source file is available under GNU General Public License version 3 (GPLv3).
 *  Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 *  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 *  @license    GPLv3 (https://www.gnu.org/licenses/)
 */

import HTMLElementWithDropdown from "$lib/types/ui/html-element-with-dropdown";
import Floating from "$lib/dom/floating";

export const Popover = {
    initWithinNode: (node: HTMLElement) => {
        node.querySelectorAll('.popover').forEach(el => {
            const reference = (el.closest('.cell') || el.parentNode) as HTMLElementWithDropdown;
            if (reference._dropdown) {
                return;
            }

            const popoverEl = el as HTMLElement;
            popoverEl.style.position = 'fixed';

            const floating = new Floating(reference, popoverEl, {
                placement: 'bottom',
                offset: [0, 0],
                disableAutoHide: true
            });

            requestAnimationFrame(() => {
                floating.open();
            })
        });
    },

    processMutation: (mutation: MutationRecord) => {
        mutation.removedNodes.forEach(node => {
            const floatingNode = node as HTMLElementWithDropdown;
            if (floatingNode._dropdown) {
                floatingNode._dropdown.destroy();
            }
        });

        mutation.addedNodes.forEach(node => {
            if (!(node instanceof HTMLElement)) return;

            if (node.classList.contains('popover')) {
                const target: HTMLElement | null = node.closest('.cell') || node.parentNode as HTMLElement;

                if (!target) return;

                Popover.initWithinNode(target);
            }
        });
    }
}