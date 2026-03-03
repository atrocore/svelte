type Rule = {
    condition: string;
    id: string;
    operator: string;
    value: any
    rules: Rule[]
}

export default Rule;
