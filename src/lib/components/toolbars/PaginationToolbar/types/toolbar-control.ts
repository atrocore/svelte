type ToolbarControlOption = {
    value: any;
    label: string;
    hidden?: boolean;
    group?: string;
    disabled?: boolean;
    onClick?: () => void;
};

type ToolbarControlDef = {
    key: string;
    iconClass: string;
    iconTitle?: string;
    iconClickable?: boolean;
    onIconClick?: () => void;
    value: string;
    options?: ToolbarControlOption[] | null;
    onSelect?: (value: any) => void;
};

export default ToolbarControlDef;
