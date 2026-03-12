<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { onMount } from 'svelte';
    import { Acl } from '$lib/core/acl';
    import { buildToolbar, buildImageUploadFunction } from '../utils/toolbar';
    import type { FieldFetchResult } from '$lib/types/ui/field';

    export let name: string = '';
    export let value: string | null = null;
    export let minHeight: number = 200;
    export let maxHeight: number = 400;
    export let markdownView: any = null;

    let wrapperEl: HTMLDivElement;
    let textareaEl: HTMLTextAreaElement;
    let editor: any = null;

    export function fetch(): FieldFetchResult {
        const v = editor ? editor.value() : (value ?? '');
        return { [name]: v === '' ? null : v };
    }

    function uploadImage(file: any, onSuccess: any, _onError: any): void {
        if (file.url) onSuccess(file.url);
    }

    function onPreviewToggle(ed: any): void {
        const wrapper = ed.codemirror.getWrapperElement();
        const scroller = ed.codemirror.getScrollerElement();
        wrapper?.classList.toggle('preview-enabled');
        scroller?.classList.toggle('hide');
        if (!ed.isFullscreenActive()) {
            const previewEl = wrapperEl?.querySelector('.editor-preview-full.editor-preview') as HTMLElement | null;
            if (previewEl) previewEl.style.maxHeight = `${maxHeight}px`;
        }
    }

    onMount(() => {
        const EasyMDE = (window as any).EasyMDE;
        if (!EasyMDE || !textareaEl) return;

        editor = new EasyMDE({
            element: textareaEl,
            autoDownloadFontAwesome: false,
            minHeight: `${minHeight}px`,
            spellChecker: false,
            nativeSpellcheck: true,
            inputStyle: 'contenteditable',
            forceSync: true,
            status: false,
            initialValue: value ?? '',
            sideBySideFullscreen: false,
            shortcuts: {
                toggleFullScreen: null,
                drawImage: null,
                toggleSideBySide: null,
            },
            previewRender: (plainText: string) => (window as any).marked(plainText),
            previewClass: ['editor-preview', 'complex-text'],
            toolbar: buildToolbar(EasyMDE, {
                maxHeight,
                markdownView,
                editor: () => editor,
                onPreviewToggle,
                uploadImage,
            }),
            uploadImage: !!Acl.check('File', 'create'),
            imageUploadFunction: buildImageUploadFunction(uploadImage),
            onToggleFullScreen: (isFullScreen: boolean) => {
                const scroller = editor.codemirror.getScrollerElement();
                const previewEl = wrapperEl?.querySelector('.editor-preview-full.editor-preview') as HTMLElement | null;
                if (isFullScreen) {
                    if (scroller) scroller.style.maxHeight = '';
                    if (previewEl) previewEl.style.maxHeight = '';
                } else {
                    if (scroller) scroller.style.maxHeight = `${maxHeight}px`;
                    if (previewEl) previewEl.style.maxHeight = `${maxHeight}px`;
                }
            },
        });

        const scroller = editor.codemirror.getScrollerElement();
        if (scroller) scroller.style.maxHeight = `${maxHeight}px`;

        editor.codemirror.on('change', () => {
            value = editor.value();
            if (markdownView && markdownView.model) {
                markdownView.model.set(name, value, { silent: true });
            }
        });

        return () => {
            if (editor) {
                try {
                    editor.cleanup();
                    editor.toTextArea();
                } catch (e) {}
                editor = null;
            }
        };
    });
</script>

<div bind:this={wrapperEl}>
    <textarea bind:this={textareaEl} {name}></textarea>
</div>
