import { Acl } from '$lib/core/acl';
import { Config } from '$lib/core/config';
import { Metadata } from '$lib/core/metadata';
import { Notifier } from '$lib/core/notifier';
import { Language } from '$lib/core/language';

export type ToolbarOptions = {
    maxHeight: number;
    markdownView: any;
    editor: any;
    onPreviewToggle: (ed: any) => void;
    uploadImage: (file: any, onSuccess: any, onError: any) => void;
};

export function buildToolbar(EasyMDE: any, options: ToolbarOptions): any[] {
    const { maxHeight, markdownView, editor, onPreviewToggle, uploadImage } = options;

    const items: any[] = [
        { name: 'undo', className: 'ph ph-arrow-counter-clockwise', action: EasyMDE.undo, title: 'Undo' },
        { name: 'redo', className: 'ph ph-arrow-clockwise', action: EasyMDE.redo, title: 'Redo' },
        '|',
        { name: 'heading-1', className: 'ph ph-text-h-one', action: EasyMDE.toggleHeading1, title: 'Big Heading' },
        { name: 'heading-2', className: 'ph ph-text-h-two', action: EasyMDE.toggleHeading2, title: 'Medium Heading' },
        { name: 'heading-3', className: 'ph ph-text-h-three', action: EasyMDE.toggleHeading3, title: 'Small Heading' },
        '|',
        { name: 'bold', className: 'ph ph-text-b', action: EasyMDE.toggleBold, title: 'Bold' },
        { name: 'italic', className: 'ph ph-text-italic', action: EasyMDE.toggleItalic, title: 'Italic' },
        { name: 'strikethrough', className: 'ph ph-text-strikethrough', action: EasyMDE.toggleStrikethrough, title: 'Strikethrough' },
        '|',
        { name: 'unordered-list', className: 'ph ph-list-bullets', action: EasyMDE.toggleUnorderedList, title: 'Generic List' },
        { name: 'ordered-list', className: 'ph ph-list-numbers', action: EasyMDE.toggleOrderedList, title: 'Numbered List' },
        { name: 'code', className: 'ph ph-code', action: EasyMDE.toggleCodeBlock, title: 'Code' },
        { name: 'quote', className: 'ph ph-quotes', action: EasyMDE.toggleBlockquote, title: 'Quote' },
        { name: 'link', className: 'ph ph-link', action: EasyMDE.drawLink, title: 'Create Link' },
        { name: 'horizontal-rule', className: 'ph ph-minus', action: EasyMDE.drawHorizontalRule, title: 'Insert Horizontal Line' },
        '|',
    ];

    if (Acl.check('File', 'read') && markdownView) {
        items.push({
            name: 'selectImage',
            action: (_ed: any) => {
                Notifier.notify(Language.translate('Loading...'));
                markdownView.createView(
                    'selectFileDialog',
                    Metadata.get('clientDefs.File.modalViews.select') || 'views/modals/select-records',
                    {
                        scope: 'File',
                        filters: {
                            queryBuilder: {
                                condition: 'AND',
                                rules: [
                                    {
                                        id: 'typeId',
                                        field: 'typId',
                                        operator: 'in',
                                        value: [
                                            '019c320b-77ba-73d3-8f1b-8346dce0f7bb',
                                            '019c320b-8c5f-7374-880c-ce48237046cb',
                                        ],
                                    },
                                ],
                            },
                        },
                    },
                    (view: any) => {
                        view.render();
                        Notifier.notify(false);
                        markdownView.listenTo(view, 'select', (model: any) => {
                            Notifier.notify(Language.translate('Loading...'));
                            (window as any).$.ajax({
                                type: 'POST',
                                url: 'File/action/prepareForRichEditor',
                                contentType: 'application/json',
                                data: JSON.stringify({ fileId: model.get('id') }),
                            }).done((response: any) => {
                                Notifier.notify(false);
                                const file = new File([], model.get('name'));
                                (file as any).url = response.sharedUrl;
                                editor().uploadImageUsingCustomFunction(uploadImage, file);
                            }).error((response: any) => {
                                Notifier.notify(false);
                                console.error(response);
                                (window as any).Espo.ui.error('Error while selecting file');
                            });
                        });
                    }
                );
            },
            className: 'ph ph-file-image',
            title: Language.translate('Select Image'),
        });
    }

    if (Acl.check('File', 'create') && markdownView) {
        items.push({
            name: 'uploadImage',
            action: (_ed: any) => {
                Notifier.notify(Language.translate('Loading...'));
                markdownView.createView('upload', 'views/file/modals/upload', {
                    scope: 'File',
                    fullFormDisabled: true,
                    layoutName: 'upload',
                    multiUpload: false,
                    attributes: { share: true },
                }, (view: any) => {
                    view.render();
                    Notifier.notify(false);
                    markdownView.listenTo(view.model, 'after:file-upload', (entity: any) => {
                        const file = new File([], entity.name);
                        (file as any).url = entity.sharedUrl;
                        editor().uploadImageUsingCustomFunction(uploadImage, file);
                    });
                    markdownView.listenToOnce(view, 'close', () => {
                        markdownView.clearView('upload');
                    });
                });
            },
            className: 'ph ph-download',
            title: Language.translate('Upload Image'),
        });
    }

    if (items[items.length - 1] !== '|') {
        items.push('|');
    }

    items.push({
        name: 'fullscreen',
        action: (ed: any) => EasyMDE.toggleFullScreen(ed),
        title: 'Toggle Fullscreen',
        className: 'ph ph-arrows-out',
        noDisable: true,
    });

    items.push({
        name: 'preview',
        action: (ed: any) => {
            EasyMDE.togglePreview(ed);
            onPreviewToggle(ed);
        },
        title: 'Toggle Preview',
        className: 'ph ph-eye',
        noDisable: true,
    });

    items.push({
        name: 'guide',
        action: 'https://www.markdownguide.org/basic-syntax/',
        title: 'Markdown Guide',
        className: 'ph ph-question',
    });

    return items;
}

export function buildImageUploadFunction(
    uploadImage: (file: any, onSuccess: any, onError: any) => void
): (file: File, onSuccess: any, onError: any) => void {
    return (file: File, onSuccess: any, onError: any) => {
        if (!Acl.check('File', 'create')) {
            (window as any).Espo.ui.error('You are not allowed to upload images');
            return;
        }
        const maxUploadSize = (Config.get('chunkFileSize') || 2) * 1024 * 1024;
        if (file.size >= maxUploadSize) {
            (window as any).Espo.ui.notify(`Your file exceeded size limit of ${maxUploadSize / 1024 / 1024} MB`);
            return;
        }
        const extensions: string[] = Metadata.get(['app', 'file', 'image', 'extensions']) || [];
        const isImage = extensions.some(ext => file.name.endsWith(ext));
        if (!isImage) {
            (window as any).Espo.ui.error('Your file is not an image.');
            return;
        }
        const reader = new FileReader();
        Notifier.notify('Uploading...');
        reader.onload = (e: any) => {
            (window as any).$.ajax({
                type: 'POST',
                url: 'File?silent=true',
                contentType: 'application/json',
                data: JSON.stringify({
                    name: file.name,
                    fileSize: file.size,
                    fileContents: e.target.result,
                    share: true,
                }),
            }).done((response: any) => {
                Notifier.notify(false);
                (file as any).url = response.sharedUrl;
                uploadImage(file, onSuccess, onError);
            }).error((response: any) => {
                Notifier.notify(false);
                console.error(response);
                (window as any).Espo.ui.error('Error while uploading file');
            });
        };
        reader.readAsDataURL(file);
    };
}
