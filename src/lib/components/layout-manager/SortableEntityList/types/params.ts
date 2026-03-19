type Params = {
    list?: Array<string | Record<string, any>>,
    onSaved?: (items: any) => void,
    onEditItem?: (item: any, callback: (newItem: any) => void) => void,
    canReset?: boolean,
}

export default Params;
