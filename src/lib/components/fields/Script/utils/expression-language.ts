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
import { Metadata } from '$lib/core/metadata';

declare global {
    interface Window {
        expressionCompletionProviderDisposable?: monaco.IDisposable;
    }
}

type EditorContext = { variables?: string[] };

const LANGUAGE_ID = 'symfony-expression';

const expressionLanguageConfig: monaco.languages.IMonarchLanguage = {
    defaultToken: '',
    tokenizer: {
        root: [
            [/\s+/, 'white'],
            [/'([^'\\]|\\.)*'/, 'expr.string'],
            [/"([^"\\]|\\.)*"/, 'expr.string'],
            [/\b\d+(\.\d+)?([eE][+-]?\d+)?\b/, 'expr.number'],
            [/\b(true|false|null|TRUE|FALSE|NULL)\b/, 'expr.keyword'],
            [/\bnot\s+in\b/, 'expr.operator'],
            [/\b(and|or|xor|not|in|matches)\b/, 'expr.operator'],
            [/(\?\?|\?:|===|!==|==|!=|<=|>=|\.\.|&&|\|\||\*\*|[+\-*/%~<>!^&|])/, 'expr.operator'],
            [/[a-zA-Z_]\w*(?=\s*\()/, 'expr.function'],
            [/[a-zA-Z_]\w*/, 'expr.identifier'],
            [/\./, 'expr.operator'],
            [/[?:]/, 'expr.operator'],
            [/,/, 'delimiter'],
            [/[()]/, 'delimiter.parenthesis'],
            [/[[\]]/, 'delimiter.square'],
            [/[{}]/, 'delimiter.bracket']
        ]
    }
};

const expressionLanguageConfiguration: monaco.languages.LanguageConfiguration = {
    autoClosingPairs: [
        { open: '(', close: ')' }, { open: '[', close: ']' }, { open: '{', close: '}' },
        { open: '"', close: '"' }, { open: "'", close: "'" }
    ],
    surroundingPairs: [
        { open: '(', close: ')' }, { open: '[', close: ']' }, { open: '{', close: '}' },
        { open: '"', close: '"' }, { open: "'", close: "'" }
    ],
    brackets: [['(', ')'], ['[', ']'], ['{', '}']]
};

function buildExpressionSuggestions(variables: string[], range: monaco.IRange): monaco.languages.CompletionItem[] {
    let order = 100;

    const variableSuggestions: monaco.languages.CompletionItem[] = [...variables]
        .sort((a, b) => a.localeCompare(b))
        .map((variable) => ({
            label: variable,
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: variable,
            detail: 'Variable',
            range,
            sortText: String(order++)
        }));

    const functions = (Metadata.get(['app', 'expressionLanguageFunctions']) ?? {}) as Record<string, unknown>;
    const functionSuggestions: monaco.languages.CompletionItem[] = Object.keys(functions)
        .sort((a, b) => a.localeCompare(b))
        .map((key) => ({
            label: key,
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: `${key}($0)`,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'Function',
            range,
            sortText: String(order++)
        }));

    return [...variableSuggestions, ...functionSuggestions];
}

function registerExpressionCompletionProvider(): void {
    window.expressionCompletionProviderDisposable?.dispose();

    window.expressionCompletionProviderDisposable = monaco.languages.registerCompletionItemProvider(LANGUAGE_ID, {
        provideCompletionItems(model, position) {
            const editor = monaco.editor.getEditors().find((e) => e.getModel() === model);
            const opts = ((editor?.getRawOptions() ?? {}) as unknown) as EditorContext;
            const variables = opts.variables ?? [];

            const wordUntilPosition = model.getWordUntilPosition(position);
            const charsBeforeWord = model.getValueInRange({
                startLineNumber: position.lineNumber,
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: wordUntilPosition.startColumn
            });

            if (/\.\s*$/.test(charsBeforeWord)) {
                return { suggestions: [] };
            }

            const range: monaco.IRange = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: wordUntilPosition.startColumn,
                endColumn: wordUntilPosition.endColumn
            };

            return { suggestions: buildExpressionSuggestions(variables, range) };
        }
    });
}

export function registerExpressionLanguage(): string {
    monaco.languages.register({ id: LANGUAGE_ID });
    monaco.languages.setLanguageConfiguration(LANGUAGE_ID, expressionLanguageConfiguration);
    monaco.languages.setMonarchTokensProvider(LANGUAGE_ID, expressionLanguageConfig);
    registerExpressionCompletionProvider();

    return LANGUAGE_ID;
}
