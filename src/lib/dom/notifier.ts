/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

import Toastify from 'toastify-js';
import type { NotifyOptions } from '$lib/types/ui/notifier/notify-options';
import type { NotifyAction } from '$lib/types/ui/notifier/notify-action';

const regularToasts: ReturnType<typeof Toastify>[] = [];
const stickyToasts: ReturnType<typeof Toastify>[] = [];

let clearRegularTimer: number | null = null;

export const Notifier = {

    notify(message: string, options: NotifyOptions | string | null = null, duration: number = 2000): void {
        const opts: NotifyOptions = typeof options === 'string'
            ? { type: options, duration }
            : (options ?? {});

        const { type = 'warning', actions = [], onClick, onClose } = opts;
        const resolvedType = type === 'danger' ? 'error' : (type || 'warning');
        const isError = resolvedType === 'error';
        const resolvedDuration = isError ? -1 : (opts.duration ?? 3000);
        const closeButton = isError ? true : (opts.closeButton ?? false);
        const isSticky = resolvedDuration <= 0;

        if (!isSticky) {
            regularToasts.forEach(t => t.hideToast());
            regularToasts.length = 0;
        }

        const node = document.createElement('span');
        node.innerHTML = message;
        node.className = 'toast-text';

        const toastList = isSticky ? stickyToasts : regularToasts;

        const toast = Toastify({
            node,
            duration: resolvedDuration,
            gravity: 'bottom',
            position: 'center',
            className: `toast-${resolvedType}`,
            stopOnFocus: true,
            onClick: onClick,
            callback: () => {
                const idx = toastList.indexOf(toast);
                if (idx !== -1) toastList.splice(idx, 1);
                onClose?.();
            },
        });

        toast.showToast();
        toastList.push(toast);

        const el = toast.toastElement;
        if (!el) return;

        for (const action of (actions as NotifyAction[])) {
            const btn = document.createElement('button');
            btn.className = 'toast-action-btn';
            if (action.tooltip) btn.title = action.tooltip;
            if (action.iconClass) {
                const icon = document.createElement('i');
                icon.className = action.iconClass;
                btn.appendChild(icon);
            }
            if (action.label) {
                const text = document.createElement('span');
                text.textContent = action.label;
                btn.appendChild(text);
            }
            btn.addEventListener('click', () => {
                action.callback();
                toast.hideToast();
            });
            el.appendChild(btn);
        }

        if (closeButton) {
            if (regularToasts.length + stickyToasts.length > 1) {
                const closeAllBtn = document.createElement('span');
                closeAllBtn.className = 'toast-close-all-btn';
                closeAllBtn.title = 'Close all';
                closeAllBtn.innerHTML = '<i class="ph ph-square"></i><i class="ph ph-x-square"></i>';
                closeAllBtn.addEventListener('click', () => this.closeAll());
                el.appendChild(closeAllBtn);
            }

            const btn = document.createElement('i');
            btn.className = 'ph ph-x toast-close-btn';
            btn.addEventListener('click', () => toast.hideToast());
            el.appendChild(btn);
        }
    },

    closeAll(): void {
        regularToasts.forEach(t => t.hideToast());
        regularToasts.length = 0;
        stickyToasts.forEach(t => t.hideToast());
        stickyToasts.length = 0;
    },

    clearRegular(): void {
        if (clearRegularTimer) clearTimeout(clearRegularTimer);
        clearRegularTimer = setTimeout(() => {
            clearRegularTimer = null;
            regularToasts.forEach(t => t.hideToast());
            regularToasts.length = 0;
        }, 200);
    },

};
