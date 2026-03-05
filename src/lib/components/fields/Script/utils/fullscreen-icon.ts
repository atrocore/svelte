import type * as monaco from 'monaco-editor';
import { Language } from '$lib/core/language';

export function initFullScreenIcon(
    cell: Element | null,
    editor: monaco.editor.IStandaloneCodeEditor
): () => void {
    if (!cell) return () => {};

    cell.querySelectorAll('.ph-corners-out').forEach((el) => el.parentElement?.remove());

    const link = document.createElement('a');
    link.href = 'javascript:';
    link.className = 'fullscreen hidden';
    link.title = Language.translate('fullscreen', 'labels');
    link.style.order = '-1';
    link.innerHTML = '<i class="ph ph-corners-out"></i>';

    const container = cell.querySelector(':scope > .inline-actions') ?? cell;
    container.prepend(link);

    link.addEventListener('click', () => {
        editor.getAction('fullscreen')?.run();
    });

    function handleMouseEnter(e: MouseEvent): void {
        e.stopPropagation();
        link.classList.remove('hidden');
    }

    function handleMouseLeave(e: MouseEvent): void {
        e.stopPropagation();
        link.classList.add('hidden');
    }

    cell.addEventListener('mouseenter', handleMouseEnter);
    cell.addEventListener('mouseleave', handleMouseLeave);

    return () => {
        cell.removeEventListener('mouseenter', handleMouseEnter);
        cell.removeEventListener('mouseleave', handleMouseLeave);
        link.remove();
    };
}
