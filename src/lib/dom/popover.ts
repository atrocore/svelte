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

type PopoverElement = HTMLElement & { _floating?: Floating };

export const Popover = {
    initWithinNode: (node: HTMLElement) => {
        node.querySelectorAll('.popover').forEach(el => {
            const popoverEl = el as PopoverElement;
            if (popoverEl._floating) {
                return;
            }

            const reference = (popoverEl.closest('.cell') || popoverEl.parentNode) as HTMLElement;
            if (!reference) {
                return;
            }

            requestAnimationFrame(() => {
                if (popoverEl._floating || !popoverEl.isConnected) {
                    return;
                }

                popoverEl.style.position = 'fixed';

                popoverEl._floating = new Floating(reference, popoverEl, {
                    placement: 'bottom',
                    offset: [0, 0],
                    disableAutoHide: true,
                    usePositionOnly: true,
                    isOpen: true
                });
            });
        });
    },

    processMutation: (mutation: MutationRecord) => {
        mutation.removedNodes.forEach(node => {
            if (!(node instanceof HTMLElement)) return;

            const popovers: PopoverElement[] = node.classList.contains('popover')
                ? [node]
                : Array.from(node.querySelectorAll<HTMLElement>('.popover'));

            popovers.forEach(popoverEl => {
                popoverEl._floating?.destroy();
                delete popoverEl._floating;
            });
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
