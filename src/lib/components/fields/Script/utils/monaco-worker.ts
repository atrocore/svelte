declare module 'monaco-editor/esm/vs/language/json/json.worker?worker' {
    const W: { new(): Worker };
    export default W;
}
declare module 'monaco-editor/esm/vs/language/css/css.worker?worker' {
    const W: { new(): Worker };
    export default W;
}
declare module 'monaco-editor/esm/vs/language/html/html.worker?worker' {
    const W: { new(): Worker };
    export default W;
}
declare module 'monaco-editor/esm/vs/editor/editor.worker?worker' {
    const W: { new(): Worker };
    export default W;
}

export function setupMonacoWorker(): void {
    self.MonacoEnvironment = {
        getWorker: async (_moduleId: string, label: string): Promise<Worker> => {
            if (label === 'json') {
                const { default: JsonWorker } = await import('monaco-editor/esm/vs/language/json/json.worker?worker');
                return new JsonWorker();
            }
            if (label === 'css' || label === 'scss' || label === 'less') {
                const { default: CssWorker } = await import('monaco-editor/esm/vs/language/css/css.worker?worker');
                return new CssWorker();
            }
            if (label === 'html' || label === 'handlebars' || label === 'razor') {
                const { default: HtmlWorker } = await import('monaco-editor/esm/vs/language/html/html.worker?worker');
                return new HtmlWorker();
            }
            const { default: EditorWorker } = await import('monaco-editor/esm/vs/editor/editor.worker?worker');
            return new EditorWorker();
        }
    };
}
