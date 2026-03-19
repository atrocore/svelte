import type Item from './item';

type Group = {
    name: string;
    prefix?: string;
    fields: Item[];
}

export default Group;
