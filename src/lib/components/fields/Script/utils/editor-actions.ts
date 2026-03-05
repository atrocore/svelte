import type * as monaco from 'monaco-editor';
import { Language } from '$lib/core/language';
import { Metadata } from '$lib/core/metadata';
import { Notifier } from '$lib/core/notifier';

export type EditorActionsConfig = {
    addFields?: { entityName?: string; entityNameField?: string };
    addAttributes?: { entityName?: string; entityNameField?: string };
};

interface BackboneModel {
    get(key: string): unknown;
}

interface BackboneDialog {
    render(): void;
    once(event: string, callback: (models: BackboneModel[]) => void): void;
}

interface ScriptFieldView {
    model: BackboneModel;
    createView(
        name: string,
        view: string,
        options: Record<string, unknown>,
        callback: (dialog: BackboneDialog) => void
    ): void;
    ajaxPostRequest(
        url: string,
        data: Record<string, unknown>
    ): { success(cb: (res: { text: string }) => void): void };
}

export function registerEditorActions(
    editor: monaco.editor.IStandaloneCodeEditor,
    actions: EditorActionsConfig,
    scriptFieldView: unknown
): void {
    const view = scriptFieldView as ScriptFieldView;

    if (actions.addFields) {
        const config = actions.addFields;
        editor.addAction({
            id: 'add-entity-fields',
            label: Language.translate('addFields'),
            contextMenuGroupId: 'navigation',
            contextMenuOrder: 1.5,
            run(ed) {
                const entityName = config.entityName ?? (view.model.get(config.entityNameField ?? '') as string);
                Notifier.notify('Loading...');
                view.createView('dialog', 'views/modals/select-records', {
                    scope: 'EntityField',
                    multiple: true,
                    createButton: false,
                    massRelateEnabled: false,
                    allowSelectAllResult: false,
                    boolFilterList: ['fieldsFilter', 'notLingual'],
                    boolFilterData: { fieldsFilter: { entityId: entityName } }
                }, (dialog) => {
                    dialog.render();
                    Notifier.notify(false);
                    dialog.once('select', (models) => {
                        const fields = models.map((m) => m.get('code') as string);
                        view.ajaxPostRequest('App/action/prepareScriptFields', { entityName, fields })
                            .success((res) => {
                                ed.executeEdits('add-entity-fields', [{
                                    range: ed.getSelection() ?? ed.getModel()!.getFullModelRange(),
                                    text: res.text,
                                    forceMoveMarkers: true
                                }]);
                            });
                    });
                });
            }
        });
    }

    if (actions.addAttributes) {
        const config = actions.addAttributes;
        const entityName = config.entityName ?? (view.model.get(config.entityNameField ?? '') as string);

        if (Metadata.get(['scopes', entityName, 'hasAttribute'])) {
            editor.addAction({
                id: 'add-entity-attributes',
                label: Language.translate('addAttributes'),
                contextMenuGroupId: 'navigation',
                contextMenuOrder: 1.6,
                run(ed) {
                    Notifier.notify('Loading...');
                    view.createView(
                        'dialog',
                        (Metadata.get(['clientDefs', 'Attribute', 'modalViews', 'select']) as string) || 'views/modals/select-records',
                        {
                            scope: 'Attribute',
                            multiple: true,
                            createButton: false,
                            massRelateEnabled: true,
                            boolFilterList: ['onlyForEntity', 'onlyEditableAttributes'],
                            boolFilterData: { onlyForEntity: entityName },
                            allowSelectAllResult: false,
                        },
                        (dialog) => {
                            dialog.render();
                            Notifier.notify(false);
                            dialog.once('select', (models) => {
                                const attributesIds = models.map((m) => m.get('id') as string);
                                view.ajaxPostRequest('App/action/prepareScriptAttributes', { entityName, attributesIds })
                                    .success((res) => {
                                        ed.executeEdits('add-entity-attributes', [{
                                            range: ed.getSelection() ?? ed.getModel()!.getFullModelRange(),
                                            text: res.text,
                                            forceMoveMarkers: true
                                        }]);
                                    });
                            });
                        }
                    );
                }
            });
        }
    }
}
