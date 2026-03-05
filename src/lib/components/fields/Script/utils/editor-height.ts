export function computeEditorHeight(value: string | null, fullScreen: boolean): string {
    if (fullScreen) return '100vh';
    const lines = (value ?? '').split('\n').length;
    if (lines <= 3) return '60px';
    if (lines <= 40) return `${lines * 20}px`;
    return '800px';
}
