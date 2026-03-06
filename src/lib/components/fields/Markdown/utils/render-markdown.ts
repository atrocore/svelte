export function renderMarkdown(text: string | null): string {
    if (!text) return '';
    const marked = (window as any).marked;
    if (!marked) return text;
    return marked(text);
}
