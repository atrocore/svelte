/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

import * as monaco from 'monaco-editor';
import { ExpressionLanguage } from 'expression-language';
import { Metadata } from '$lib/core/metadata';

const OWNER = 'expression-language-validation';
const DEBOUNCE_MS = 300;

type EditorContext = { variables?: string[] };

type LintError = { message?: string; cursor?: number; subject?: string };

function buildLinter(): InstanceType<typeof ExpressionLanguage> {
    const expressionLanguage = new ExpressionLanguage();
    const functions = (Metadata.get(['app', 'expressionLanguageFunctions']) ?? {}) as Record<string, unknown>;

    Object.keys(functions).forEach((name) => {
        expressionLanguage.register(name, () => '', () => undefined);
    });

    return expressionLanguage;
}

function collectExpressionMarkers(model: monaco.editor.ITextModel, variables: string[]): monaco.editor.IMarkerData[] {
    const text = model.getValue();
    if (text.trim() === '') {
        return [];
    }

    try {
        buildLinter().lint(text, variables);
        return [];
    } catch (e) {
        const error = e as LintError;
        const message = error.message ?? 'Invalid expression';

        const tokenStart = Math.max(0, (error.cursor ?? 0) - 1);
        const tokenLength = error.subject ? String(error.subject).length : 1;

        const start = model.getPositionAt(Math.min(tokenStart, model.getValueLength()));
        const end = model.getPositionAt(Math.min(tokenStart + tokenLength, model.getValueLength()));

        return [{
            severity: monaco.MarkerSeverity.Error,
            message,
            startLineNumber: start.lineNumber,
            startColumn: start.column,
            endLineNumber: end.lineNumber,
            endColumn: end.column
        }];
    }
}

export function registerExpressionValidation(
    editor: monaco.editor.IStandaloneCodeEditor,
    engine: string
): () => void {
    if (engine !== 'ExpressionLanguage') {
        return () => {};
    }

    const model = editor.getModel();
    if (!model) {
        return () => {};
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    const scheduleValidate = (): void => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            const variables = ((editor.getRawOptions() as unknown) as EditorContext).variables ?? [];
            monaco.editor.setModelMarkers(model, OWNER, collectExpressionMarkers(model, variables));
        }, DEBOUNCE_MS);
    };

    scheduleValidate();
    const subscription = model.onDidChangeContent(scheduleValidate);

    return () => {
        clearTimeout(timer);
        subscription.dispose();
        monaco.editor.setModelMarkers(model, OWNER, []);
    };
}
