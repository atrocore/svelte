import type GridCell from './grid-cell';

type GridRow = {
    number: number;
    cells: (GridCell | false)[];
    layoutRemoveDisabled?: boolean;
}

export default GridRow;
