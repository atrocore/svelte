/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

import { writable } from 'svelte/store';
import { Language } from '$lib/core/language';

type NotifierAdapter = {
    notify(message: string | boolean, type: string | null, timeout: number): void;
    confirm(message: string, o: any, callback: any, context: any): void;
};

const data = writable<NotifierAdapter>();

export const Notifier = {

    setNotifier(notifier: NotifierAdapter): void {
        data.set(notifier);
    },

    notify(message: string | boolean, type: string | null = null, timeout: number = 2000): void {
        data.subscribe((current: NotifierAdapter) => {
            if (current) {
                current.notify(message, type, 2000);
            }
        })();
    },

    confirm(o: any = null, callback: any = null, context: any): void {
        data.subscribe((current: NotifierAdapter) => {
            if (current) {
                let confirmStyle = null;
                let message = null;
                let confirmText = null;
                if (typeof o === 'string' || o instanceof String) {
                    message = o;
                    confirmText = Language.translate('Yes');
                } else {
                    o = o || {};
                    message = o.message;
                    confirmText = o.confirmText;
                    confirmStyle = o.confirmStyle || null;
                }
                current.confirm(message, {
                    confirmText: confirmText,
                    cancelText: Language.translate('Cancel'),
                    confirmStyle: confirmStyle
                }, callback, context);
            }
        })();
    },
};
