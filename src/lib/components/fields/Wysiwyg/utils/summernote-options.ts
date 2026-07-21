/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

import { Acl } from '$lib/core/acl';
import { Metadata } from '$lib/core/metadata';
import { Notifier } from '$lib/dom/notifier';
import { Language } from '$lib/core/language';
import { ApiClient } from '$lib/core/api-client';

export const SUMMERNOTE_ICONS = {
    magic: 'ph ph-magic-wand',
    caret: 'ph ph-caret-down caret-icon',
    bold: 'ph ph-text-b',
    italic: 'ph ph-text-italic',
    underline: 'ph ph-text-underline',
    eraser: 'ph ph-eraser',
    font: 'ph ph-text-aa',
    unorderedlist: 'ph ph-list-dashes',
    orderedlist: 'ph ph-list-numbers',
    alignLeft: 'ph ph-text-align-left',
    alignCenter: 'ph ph-text-align-center',
    alignRight: 'ph ph-text-align-right',
    alignJustify: 'ph ph-text-align-justify',
    indent: 'ph ph-text-indent',
    outdent: 'ph ph-text-outdent',
    textHeight: 'ph ph-text-t',
    table: 'ph ph-grid-nine',
    link: 'ph ph-link',
    minus: 'ph ph-minus',
    code: 'ph ph-code',
    arrowsAlt: 'ph ph-arrows-out',
};

export function buildImageButtons(wysiwygView: any, getEditor: () => any): Record<string, any> {
    const buttons: Record<string, any> = {};
    const $ = (window as any).$;

    if (Acl.check('File', 'read') && wysiwygView) {
        buttons['selectImage'] = (_context: any) => {
            return $.summernote.ui.button({
                contents: '<i class="ph ph-file-image"></i>',
                tooltip: Language.translate('Select Image'),
                click: () => {
                    Notifier.notify(Language.translate('Loading...'));
                    wysiwygView.createView(
                        'selectFileDialog',
                        Metadata.get(['clientDefs', 'File', 'modalViews', 'select']) || 'views/modals/select-records',
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
                            Notifier.clearRegular();
                            wysiwygView.listenTo(view, 'select', (model: any) => {
                                Notifier.notify(Language.translate('Loading...'));
                                ApiClient.post<{ sharedUrl: string }>(`File/${model.get('id')}/createSharedUrl`, {})
                                    .then(response => {
                                        Notifier.clearRegular();
                                        getEditor()?.summernote('insertImage', response.sharedUrl);
                                    })
                                    .catch(err => {
                                        Notifier.clearRegular();
                                        console.error(err);
                                        (window as any).Espo.ui.error('Error while selecting file');
                                    });
                            });
                        }
                    );
                },
            }).render();
        };
    }

    if (Acl.check('File', 'create') && wysiwygView) {
        buttons['uploadImage'] = (_context: any) => {
            return $.summernote.ui.button({
                contents: '<i class="ph ph-download"></i>',
                tooltip: Language.translate('Upload Image'),
                click: () => {
                    Notifier.notify(Language.translate('Loading...'));
                    wysiwygView.createView('upload', 'views/file/modals/upload', {
                        scope: 'File',
                        fullFormDisabled: true,
                        layoutName: 'upload',
                        multiUpload: false,
                        attributes: { share: true },
                    }, (view: any) => {
                        view.render();
                        Notifier.clearRegular();
                        wysiwygView.listenTo(view.model, 'after:file-upload', (entity: any) => {
                            const extensions: string[] = Metadata.get(['app', 'file', 'image', 'extensions']) || [];
                            if (!extensions.some((ext: string) => entity.name.endsWith(ext))) {
                                (window as any).Espo.ui.error('Your file is not an image.');
                                return;
                            }
                            getEditor()?.summernote('insertImage', entity.sharedUrl);
                        });
                        wysiwygView.listenToOnce(view, 'close', () => {
                            wysiwygView.clearView('upload');
                        });
                    });
                },
            }).render();
        };
    }

    return buttons;
}
