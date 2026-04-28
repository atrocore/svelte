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

const regularToasts: ReturnType<typeof Toastify>[] = [];
const stickyToasts: ReturnType<typeof Toastify>[] = [];

export function clearAll(): void {
    [...regularToasts, ...stickyToasts].forEach(t => t.hideToast());
    //TODO: ?????
    regularToasts.length = 0;
    stickyToasts.length = 0;
}

export function notify(message: string, options: NotifyOptions = {}): void {
    const { type = 'warning', duration = 3000, closeButton = false, actions = [] } = options;
    const resolvedType = type === 'danger' ? 'error' : (type || 'warning');
    const isSticky = duration <= 0;

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
        duration,
        gravity: 'bottom',
        position: 'center',
        className: `toast-${resolvedType}`,
        stopOnFocus: true,
        callback: () => {
            const idx = toastList.indexOf(toast);
            if (idx !== -1) toastList.splice(idx, 1);
        },
    });

    toast.showToast();
    toastList.push(toast);

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
