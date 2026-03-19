type GridCell = {
    name: string;
    label?: string;
    id?: string;
    fullWidth?: boolean;
    customLabel?: string;
    noLabel?: boolean;
    layoutRemoveDisabled?: boolean;
    attributeId?: string;
    [key: string]: any;
}

export default GridCell;
