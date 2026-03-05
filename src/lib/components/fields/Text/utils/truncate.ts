export function truncate(
    value: string,
    maxLength: number,
    maxNewLineCount: number
): { text: string; isCut: boolean } {
    if (!value) return { text: '', isCut: false };

    let text = value.toString();
    let isCut = false;

    if (text.length > maxLength) {
        text = text.substr(0, maxLength);
        isCut = true;
    }

    const nlCount = (text.match(/\n/g) || []).length;
    if (nlCount > maxNewLineCount) {
        text = text.split('\n').slice(0, maxNewLineCount).join('\n');
        isCut = true;
    }

    if (isCut) text += ' ...';

    return { text, isCut };
}