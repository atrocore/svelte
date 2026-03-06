<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { onMount, beforeUpdate, createEventDispatcher } from 'svelte';
    import { Acl } from '$lib/core/acl';
    import { Config } from '$lib/core/config';
    import { Notifier } from '$lib/core/notifier';
    import { ApiClient } from '$lib/core/api-client';
    import { Language } from '$lib/core/language';
    import { Metadata } from '$lib/core/metadata';
    import { sanitizeHtml, plainToHtml, htmlToPlain } from '../utils/sanitize';
    import { buildImageButtons, SUMMERNOTE_ICONS } from '../utils/summernote-options';
    import type { FieldFetchResult } from '$lib/types/ui/field';

    export let name: string = '';
    export let value: string | null = null;
    export let isHtml: boolean = true;
    export let hasIsHtml: boolean = false;
    export let height: number = 250;
    export let minHeight: number | undefined = undefined;
    export let toolbar: any[] | undefined = undefined;
    export let wysiwygView: any = null;
    export let maxLength: number | undefined = undefined;
    export let countBytesInsteadOfCharacters: boolean = false;

    const dispatch = createEventDispatcher();

    const defaultToolbar = [
        ['style', ['style']],
        ['style', ['bold', 'italic', 'underline', 'clear']],
        ['fontsize', ['fontsize']],
        ['color', ['color']],
        ['list', ['ul', 'ol']],
        ['para', ['paragraph']],
        ['height', ['height']],
        ['table', ['table']],
        ['link', ['link', 'hr']],
        ['image', getImageButtonNames()],
        ['misc', ['codeview', 'fullscreen']],
    ];

    function getImageButtonNames(): string[] {
        const names: string[] = [];
        if (Acl.check('File', 'read')) names.push('selectImage');
        if (Acl.check('File', 'create')) names.push('uploadImage');
        return names;
    }

    let summernoteEl: HTMLDivElement;
    let textareaEl: HTMLTextAreaElement;
    let summernote: any = null;
    let prevIsHtml = isHtml;
    let currentValue = value;
    let currentLength = 0;
    let hasError = false;

    function getEditor() {
        return summernote;
    }

    function getRealLength(text: string): number {
        if (!text) return 0;
        if (countBytesInsteadOfCharacters) return encodeURI(text).split(/%..|./).length - 1;
        return text.toString().length;
    }

    function updateTextCounter(text: string = '') {
        if (!maxLength) return;
        currentLength = getRealLength(text);
        hasError = maxLength < currentLength;
    }

    export function fetch(): FieldFetchResult {
        let v: string | null;
        if (isHtml) {
            v = summernote ? summernote.summernote('code') : currentValue;
        } else {
            v = textareaEl ? textareaEl.value : currentValue;
        }
        if (v === '' || v === '<p><br></p>' || v === '<p></p>' || v === '<br>') v = null;

        const result: FieldFetchResult = { [name]: v };
        if (hasIsHtml) {
            result[name + 'Plain'] = isHtml ? htmlToPlain(v) : v;
        }
        return result;
    }

    function initSummernote(): void {
        const $ = (window as any).$;
        if (!$ || !summernoteEl) return;

        summernote = $(summernoteEl);

        const lang = Config.get('language');
        if (lang && !(lang in $.summernote.lang)) {
            $.summernote.lang[lang] = Language.translate('summernote', 'sets') ?? {};
        }

        summernote.html(sanitizeHtml(currentValue));
        summernote.find('style').remove();
        summernote.find('link[rel="stylesheet"]').remove();

        const buttons = buildImageButtons(wysiwygView, getEditor);

        const options: Record<string, any> = {
            lang,
            callbacks: {
                onImageUpload: (files: File[]) => {
                    const file = files[0];
                    files.pop();

                    if (!Acl.check('File', 'create')) {
                        (window as any).Espo.ui.error('You are not allowed to upload images');
                        return;
                    }

                    const extensions: string[] = Metadata.get(['app', 'file', 'image', 'extensions']) || [];
                    if (!extensions.some(ext => file.name.endsWith(ext))) {
                        (window as any).Espo.ui.error('Your file is not an image.');
                        return;
                    }

                    const maxSize = (Config.get('chunkFileSize') || 2) * 1024 * 1024;
                    if (file.size >= maxSize) {
                        (window as any).Espo.ui.notify(`Your file exceeded size limit of ${maxSize / 1024 / 1024} MB`);
                        return;
                    }

                    const reader = new FileReader();
                    Notifier.notify('Uploading...');
                    reader.onload = (e: any) => {
                        ApiClient.post<{ sharedUrl: string }>('File?silent=true', {
                            name: file.name,
                            fileSize: file.size,
                            fileContents: e.target.result,
                            share: true,
                        })
                            .then(response => {
                                Notifier.notify(false);
                                summernote?.summernote('insertImage', response.sharedUrl);
                            })
                            .catch(err => {
                                Notifier.notify(false);
                                console.error(err);
                                (window as any).Espo.ui.error('Error while uploading file');
                            });
                    };
                    reader.readAsDataURL(file);
                },
                onKeyup: () => updateTextCounter(summernote?.summernote('code') || ''),
                onBlur: () => dispatch('change'),
                onPaste: (e: any) => {
                    const text = ((e.originalEvent || e).clipboardData || (window as any).clipboardData).getData('Text');
                    e.preventDefault();
                    document.execCommand('insertText', false, text);
                },
            },
            toolbar: toolbar ?? defaultToolbar,
            buttons,
            icons: SUMMERNOTE_ICONS,
        };

        if (height) options.height = height;
        if (minHeight) options.minHeight = minHeight;

        summernote.summernote(options);
        updateTextCounter(summernote.summernote('code') || '');
    }

    function destroySummernote(): void {
        if (summernote) {
            summernote.summernote('destroy');
            summernote = null;
        }
    }

    beforeUpdate(() => {
        if (isHtml === prevIsHtml) return;

        // Capture and convert value before DOM updates
        if (prevIsHtml && summernote) {
            let v = summernote.summernote('code') as string | null;
            if (v === '' || v === '<p><br></p>' || v === '<p></p>' || v === '<br>') v = null;
            currentValue = htmlToPlain(v);
            destroySummernote();
        } else if (!prevIsHtml && textareaEl) {
            const v = textareaEl.value || null;
            currentValue = v ? plainToHtml(v) : null;
        }

        prevIsHtml = isHtml;
    });

    onMount(() => {
        if (isHtml) initSummernote();

        return () => destroySummernote();
    });

    // Re-init summernote after Svelte switches to isHtml mode
    $: if (isHtml && summernoteEl && !summernote) {
        initSummernote();
    }
</script>

{#if isHtml}
    <textarea class="main-element form-control hidden" {name}></textarea>
    <div bind:this={summernoteEl} class="summernote"></div>
{:else}
    <textarea
        bind:this={textareaEl}
        class="main-element form-control auto-height"
        class:error={hasError}
        {name}
        value={currentValue ?? ''}
        on:keyup={() => updateTextCounter(textareaEl?.value || '')}
    ></textarea>
{/if}

{#if maxLength}
    <div class="text-length-counter">
        <span class="current-length" class:error={hasError}>{currentLength}</span>
        <span class="maximum">/{maxLength}</span>
    </div>
{/if}
