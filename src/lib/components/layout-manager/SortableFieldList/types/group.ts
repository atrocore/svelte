import type Field from "./field";

type Group = {
    name: string;
    fields: Field[];

    [key: string]: any;
}

export default Group;