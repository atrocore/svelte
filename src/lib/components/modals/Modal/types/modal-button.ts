export type ModalButton = {
    name: string;
    label: string;
    style?: string;
    disabled?: boolean;
    loading?: boolean;
    iconClass?: string;
    type?: 'button' | 'submit';
    form?: string;
};

export type ModalPosition = 'center' | 'top' | 'left' | 'right';

export type ModalButtonsPosition = 'top' | 'bottom';

export type ModalButtonsAlign = 'left' | 'right';
