import type GridRow from './grid-row';

type GridPanel = {
    label?: string;
    style: string;
    rows: GridRow[];
    number: number;
    name?: string;
    isCustomLabel?: boolean;
    layoutRemoveDisabled?: boolean;
    customLabel?: string;
    [key: string]: any;
}

export default GridPanel;
