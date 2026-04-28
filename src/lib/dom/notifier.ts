import Toastify from 'toastify-js';

export type NotifyAction = {
    label: string;
    iconClass?: string;
    callback: () => void;
};

export type NotifyOptions = {
    type?: string;
    duration?: number;
    closeButton?: boolean;
    actions?: NotifyAction[];
};

const activeToasts: ReturnType<typeof Toastify>[] = [];

export function clearAll(): void {
    activeToasts.forEach(t => t.hideToast());
    activeToasts.length = 0;
}

export function notify(message: string, options: NotifyOptions = {}): void {
    const { type = 'warning', duration = 3000, closeButton = false, actions = [] } = options;
    const resolvedType = type === 'danger' ? 'error' : (type || 'warning');

    const toast = Toastify({
        text: message,
        duration,
        gravity: 'bottom',
        position: 'center',
        className: `toast-${resolvedType}`,
        stopOnFocus: true,
        escapeMarkup: false,
        callback: () => {
            const idx = activeToasts.indexOf(toast);
            if (idx !== -1) activeToasts.splice(idx, 1);
        },
    });

    toast.showToast();
    activeToasts.push(toast);

    const el = toast.toastElement;
    if (!el) return;

    for (const action of actions) {
        const btn = document.createElement('button');
        btn.className = 'toast-action-btn';
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
        const btn = document.createElement('i');
        btn.className = 'ph ph-x toast-close-btn';
        btn.addEventListener('click', () => toast.hideToast());
        el.appendChild(btn);
    }
}
