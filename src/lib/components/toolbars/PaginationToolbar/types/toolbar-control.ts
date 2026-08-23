type ToolbarControlOption = {
    value: any;
    label: string;
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
