
function toDom(str: string): string {
    return str.toLowerCase();
}

export function getDataAttributeProps(item: any): any {
    let dataAttributes: Record<string, any> = {};
    ['name', 'id'].forEach(attr => {
        if (item[attr] != null) {
            dataAttributes[`data-${toDom(attr)}`] = item[attr];
        }
    })
    return dataAttributes;
}