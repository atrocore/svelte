import { Utils } from "$lib/core/utils";

export function getValueStyle(value: number) {
    let backgroundColor = '#FFD6C9';
    if (value === -1) {
        backgroundColor = '#CCCCCC';
    }
    if (value > 0) {
        backgroundColor = '#FFE7D1';
    }
    if (value > 24) {
        backgroundColor = '#FEFFD6';
    }
    if (value > 49) {
        backgroundColor = '#FFF8B8';
    }
    if (value > 74) {
        backgroundColor = '#E0FFCC';
    }
    if (value === 100) {
        backgroundColor = '#CAF2C2';
    }

    let data: Record<string, any> = {
        cursor: 'pointer',
        'font-weight': 'normal',
        'background-color': backgroundColor,
        color: Utils.getFontColor(backgroundColor),
        border: Utils.getBorder(backgroundColor),
        padding: '4px 10px',
        fontSize: '100%'
    };

    if (value > 24) {
        data.display = 'block';
        data.width = `${value}%`;
    }

    return Object.entries(data).map(([k, v]) => `${k}: ${v}`).join('; ')
}

export function getStatusStyle(status: string) {
    const backgroundColor = status === 'passed' ? '#CAF2C2' : (status === 'failed' ? '#FFD6C9' : '#CCCCCC');
    return `background-color: ${backgroundColor};`
}