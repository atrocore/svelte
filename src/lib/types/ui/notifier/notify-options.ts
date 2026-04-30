import type { NotifyAction } from './notify-action';

export type NotifyOptions = {
    type?: string;
    duration?: number;
    closeButton?: boolean;
    actions?: NotifyAction[];
    onClick?: () => void;
    onClose?: () => void;
};
