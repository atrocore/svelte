import SortableJS from 'sortablejs';
import type { Options } from 'sortablejs';

const defaultOptions: Options = {
    group: 'fields',
    draggable: 'li',
    animation: 150,
};

export const SortableList = {
    create: (el: Element, options: Options): SortableJS => {
        return SortableJS.create(el as HTMLElement, { ...defaultOptions, ...options });
    },

    getDataAttributeProps: (item: any, attrs: string[] = ['name', 'id']): Record<string, any> => {
        const result: Record<string, any> = {};
        attrs.forEach(attr => {
            if (item[attr] != null) {
                result[`data-${attr.toLowerCase()}`] = item[attr];
            }
        });
        return result;
    },
};
