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
import { Lexer as TwigLexer, type Token as TwigToken } from 'twig-lexer';
import { Metadata } from '$lib/core/metadata';
import { Language } from '$lib/core/language';

declare global {
    interface Window {
        twigCompletionProviderDisposables?: Map<string, monaco.IDisposable>;
        twigHoverProviderDisposables?: Map<string, monaco.IDisposable>;
        twigSemanticTokensProviderDisposables?: Map<string, monaco.IDisposable>;
        twigDocumentHighlightProviderDisposables?: Map<string, monaco.IDisposable>;
    }
}

type ProviderDisposablesKey = 'twigCompletionProviderDisposables' | 'twigHoverProviderDisposables' | 'twigSemanticTokensProviderDisposables' | 'twigDocumentHighlightProviderDisposables';

function getProviderDisposables(key: ProviderDisposablesKey): Map<string, monaco.IDisposable> {
    if (!window[key]) {
        window[key] = new Map<string, monaco.IDisposable>();
    }
    return window[key] as Map<string, monaco.IDisposable>;
}

type EditorContext = {
    params: Record<string, unknown>;
    variables: string[];
    name: string;
    scope: string;
};

const TWIG_BLOCK_TAG_NAMES = 'if|for|block|verbatim|filter|spaceless|with|trans|autoescape|embed|macro';
const TWIG_DELIMITER_BRACKETS: [string, string][] = [['{{', '}}'], ['{%', '%}'], ['{#', '#}']];
const TWIG_DELIMITER_PAIRS: monaco.languages.IAutoClosingPair[] = [
    { open: '{{', close: '}}' }, { open: '{%', close: '%}' }, { open: '{#', close: '#}' }
];

const TWIG_ON_ENTER_RULE: monaco.languages.OnEnterRule = {
    beforeText: new RegExp(`^\\s*{%\\s*(${TWIG_BLOCK_TAG_NAMES})\\s*.*%}$`),
    afterText: /^\s*{%\s*end\w+\s*%}$/,
    action: {
        indentAction: monaco.languages.IndentAction.IndentOutdent,
        appendText: '    '
    }
};

const TWIG_FOLDING_MARKERS: { start: RegExp; end: RegExp } = {
    start: new RegExp(`^\\s*{%\\s*(${TWIG_BLOCK_TAG_NAMES})\\s.*%}`),
    end: new RegExp('^\\s*{%\\s*end\\w+\\s*%}')
};

const HTML_EMPTY_ELEMENTS = [
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'keygen',
    'link', 'menuitem', 'meta', 'param', 'source', 'track', 'wbr'
];

const HTML_LANGUAGE_CONFIGURATION: monaco.languages.LanguageConfiguration = {
    wordPattern: /(-?\d*\.\d\w*)|([^`~!@$^&*()=+\[{\]}\\|;:'",.<>/\s]+)/g,
    comments: {
        blockComment: ['<!--', '-->']
    },
    brackets: [
        ['<!--', '-->'],
        ['<', '>'],
        ['{', '}'],
        ['(', ')']
    ],
    autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
        { open: "'", close: "'" }
    ],
    surroundingPairs: [
        { open: '"', close: '"' },
        { open: "'", close: "'" },
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '<', close: '>' }
    ],
    onEnterRules: [
        {
            beforeText: new RegExp(
                `<(?!(?:${HTML_EMPTY_ELEMENTS.join('|')}))([_:\\w][_:\\w-.\\d]*)([^/>]*(?!/)>)[^<]*$`,
                'i'
            ),
            afterText: /^<\/([_:\w][_:\w-.\d]*)\s*>$/i,
            action: { indentAction: monaco.languages.IndentAction.IndentOutdent }
        },
        {
            beforeText: new RegExp(
                `<(?!(?:${HTML_EMPTY_ELEMENTS.join('|')}))(\\w[\\w\\d]*)([^/>]*(?!/)>)[^<]*$`,
                'i'
            ),
            action: { indentAction: monaco.languages.IndentAction.Indent }
        }
    ],
    folding: {
        markers: {
            start: new RegExp('^\\s*<!--\\s*#region\\b.*-->'),
            end: new RegExp('^\\s*<!--\\s*#endregion\\b.*-->')
        }
    }
};

const HTML_TWIG_LANGUAGE_CONFIGURATION: monaco.languages.LanguageConfiguration = {
    ...HTML_LANGUAGE_CONFIGURATION,
    wordPattern: /(-?\d*\.\d\w*)|([^`~!@#$%^&*()=+\[{\]}\\|;:'",.<>/\s]+)/g,
    brackets: [...HTML_LANGUAGE_CONFIGURATION.brackets!, ...TWIG_DELIMITER_BRACKETS],
    colorizedBracketPairs: [...HTML_LANGUAGE_CONFIGURATION.brackets!],
    autoClosingPairs: [...TWIG_DELIMITER_PAIRS, ...HTML_LANGUAGE_CONFIGURATION.autoClosingPairs!],
    surroundingPairs: [...TWIG_DELIMITER_PAIRS, ...HTML_LANGUAGE_CONFIGURATION.surroundingPairs!],
    onEnterRules: [TWIG_ON_ENTER_RULE, ...HTML_LANGUAGE_CONFIGURATION.onEnterRules!],
    folding: {
        markers: {
            start: new RegExp(`^\\s*(<!--\\s*#region\\b.*-->|${TWIG_FOLDING_MARKERS.start.source})`),
            end: new RegExp(`^\\s*(<!--\\s*#endregion\\b.*-->|${TWIG_FOLDING_MARKERS.end.source})`)
        }
    }
};

const JSON_LANGUAGE_CONFIGURATION: monaco.languages.LanguageConfiguration = {
    wordPattern: /(-?\d*\.\d\w*)|([^[{\]}:",\s]+)/g,
    comments: { lineComment: '//', blockComment: ['/*', '*/'] },
    brackets: [['{', '}'], ['[', ']']],
    autoClosingPairs: [
        { open: '{', close: '}', notIn: ['string'] },
        { open: '[', close: ']', notIn: ['string'] },
        { open: '"', close: '"', notIn: ['string'] }
    ]
};

const JSON_TWIG_LANGUAGE_CONFIGURATION: monaco.languages.LanguageConfiguration = {
    ...JSON_LANGUAGE_CONFIGURATION,
    wordPattern: /(-?\d*\.\d\w*)|([^[{\]}:",%#\s]+)/g,
    brackets: [...JSON_LANGUAGE_CONFIGURATION.brackets!, ...TWIG_DELIMITER_BRACKETS],
    colorizedBracketPairs: [...JSON_LANGUAGE_CONFIGURATION.brackets!],
    autoClosingPairs: [...TWIG_DELIMITER_PAIRS, ...JSON_LANGUAGE_CONFIGURATION.autoClosingPairs!],
    surroundingPairs: [...TWIG_DELIMITER_PAIRS],
    onEnterRules: [TWIG_ON_ENTER_RULE],
    folding: { markers: TWIG_FOLDING_MARKERS }
};

function buildFilterSuggestions(
    params: Record<string, unknown>,
    range: monaco.IRange
): monaco.languages.CompletionItem[] {
    const builtIn: Omit<monaco.languages.CompletionItem, 'range'>[] = [
        { label: 'upper', kind: monaco.languages.CompletionItemKind.Function, detail: 'Filter', documentation: 'Convert a value to uppercase', insertText: 'upper' },
        { label: 'lower', kind: monaco.languages.CompletionItemKind.Function, detail: 'Filter', documentation: 'Convert a value to lowercase', insertText: 'lower' },
        { label: 'capitalize', kind: monaco.languages.CompletionItemKind.Function, detail: 'Filter', documentation: 'Capitalize a value', insertText: 'capitalize' },
        { label: 'date', kind: monaco.languages.CompletionItemKind.Function, detail: 'Filter', documentation: 'Format a date', insertText: "date('${1:Y-m-d}')", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'default', kind: monaco.languages.CompletionItemKind.Function, detail: 'Filter', documentation: 'Returns the default value if the tested value is empty', insertText: 'default(${1:default_value})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'json_encode', kind: monaco.languages.CompletionItemKind.Function, detail: 'Filter', documentation: 'Returns the JSON representation of a value', insertText: 'json_encode' },
        { label: 'length', kind: monaco.languages.CompletionItemKind.Function, detail: 'Filter', documentation: 'Returns the length of a string or array', insertText: 'length' },
        { label: 'trim', kind: monaco.languages.CompletionItemKind.Function, detail: 'Filter', documentation: 'Strips whitespace from the beginning and end of a string', insertText: 'trim' },
    ];

    let filters = (Metadata.get(['twig', 'filters']) ?? {}) as Record<string, { insertText?: string }>;
    if (params.isExport) {
        filters = { ...filters, ...(Metadata.get(['app', 'twigFilters']) as Record<string, { insertText?: string }>) };
    }
    const filterTranslations = (Language.get('Global', 'twig', 'filters') ?? {}) as Record<string, string>;

    const custom: Omit<monaco.languages.CompletionItem, 'range'>[] = Object.keys(filters).map((key) => ({
        label: key,
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: filters[key].insertText ?? key,
        insertTextRules: filters[key].insertText
            ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
            : monaco.languages.CompletionItemInsertTextRule.None,
        detail: 'Filter',
        documentation: filterTranslations[key],
    }));

    return [...builtIn, ...custom].map((item) => ({ ...item, range }));
}

function collectSetVariables(documentTextBeforeCursor: string): string[] {
    const names: string[] = [];
    const regex = /\{%\s*set\s+([a-zA-Z_]\w*)/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(documentTextBeforeCursor)) !== null) {
        if (!names.includes(match[1])) {
            names.push(match[1]);
        }
    }
    return names;
}

const BUILT_IN_VARIABLE_DESCRIPTIONS: Record<string, string> = {
    _self: 'Reference to the current template, used to call locally defined macros',
    loop: 'Available inside {% for %} blocks: loop.index, loop.first, loop.last, etc.'
};

function resolveVariableDescription(
    variable: string,
    twigVariables: string[],
    localVariables: string[],
    name: string,
    scope: string
): string | null {
    if (localVariables.includes(variable)) {
        return null;
    }

    if (BUILT_IN_VARIABLE_DESCRIPTIONS[variable]) {
        return BUILT_IN_VARIABLE_DESCRIPTIONS[variable];
    }

    if (twigVariables.includes(variable) || variable === 'config') {
        const variableTranslations = (Language.get(scope, 'twigVariables', name) ?? {}) as Record<string, string>;
        return variableTranslations[variable] ?? (Language.get('Global', 'twigVariables', variable) as string) ?? null;
    }

    return null;
}

function buildVariableAndFunctionSuggestions(
    twigVariables: string[],
    name: string,
    scope: string,
    params: Record<string, unknown>,
    documentTextBeforeCursor: string,
    range: monaco.IRange
): monaco.languages.CompletionItem[] {
    let order = 100;

    const localVariables = collectSetVariables(documentTextBeforeCursor)
        .filter((variable) => !twigVariables.includes(variable) && variable !== 'config' && variable !== '_self');

    const suggestions: Omit<monaco.languages.CompletionItem, 'range'>[] = [...twigVariables, 'config', '_self', ...localVariables]
        .map((variable) => ({
            name: variable,
            isLocal: localVariables.includes(variable),
            description: resolveVariableDescription(variable, twigVariables, localVariables, name, scope)
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(({ name: varName, description, isLocal }) => ({
            label: varName,
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: varName,
            documentation: description ?? undefined,
            detail: isLocal ? 'Local variable' : 'Variable',
            sortText: String(order++)
        }));

    let functions = (Metadata.get(['twig', 'functions']) ?? {}) as Record<string, { insertText?: string; hidden?: boolean }>;
    if (params.isExport) {
        functions = { ...functions, ...(Metadata.get(['app', 'twigFunctions']) as Record<string, { insertText?: string; hidden?: boolean }>) };
    }
    const functionTranslations = (Language.get('Global', 'twig', 'functions') ?? {}) as Record<string, string>;

    Object.keys(functions).filter((key) => !functions[key].hidden).sort((a, b) => a.localeCompare(b)).forEach((key) => {
        suggestions.push({
            label: key,
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: functions[key].insertText ?? `${key}($0)`,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'Function',
            documentation: functionTranslations[key],
            sortText: String(order++)
        });
    });

    return suggestions.map((item) => ({ ...item, range }));
}

const TAG_KEYWORD_SUGGESTIONS: Omit<monaco.languages.CompletionItem, 'range'>[] = [
    { label: 'extends', kind: monaco.languages.CompletionItemKind.Property, insertText: 'extends "${1:template}" %}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'Tag', documentation: 'Extend a parent template' },
    { label: 'if', kind: monaco.languages.CompletionItemKind.Property, insertText: 'if ${1:condition} %}\n\t$0\n{% endif %}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'Tag', documentation: 'Conditional block' },
    { label: 'elseif', kind: monaco.languages.CompletionItemKind.Property, insertText: 'elseif ${1:condition} %}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'Tag', documentation: 'Additional condition of an if block' },
    { label: 'else', kind: monaco.languages.CompletionItemKind.Property, insertText: 'else %}', detail: 'Tag', documentation: 'Else branch of an if block' },
    { label: 'endif', kind: monaco.languages.CompletionItemKind.Property, insertText: 'endif %}', detail: 'Tag', documentation: 'Close an if block' },
    { label: 'for', kind: monaco.languages.CompletionItemKind.Property, insertText: 'for ${1:item} in ${2:items} %}\n\t$0\n{% endfor %}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'Tag', documentation: 'Loop over a collection' },
    { label: 'endfor', kind: monaco.languages.CompletionItemKind.Property, insertText: 'endfor %}', detail: 'Tag', documentation: 'Close a for block' },
    { label: 'set', kind: monaco.languages.CompletionItemKind.Property, insertText: 'set ${1:var} = $0 %}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'Tag', documentation: 'Declare a variable' },
    { label: 'macro', kind: monaco.languages.CompletionItemKind.Property, insertText: 'macro ${1:name}(${2:args}) %}\n\t$0\n{% endmacro %}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'Tag', documentation: 'Define a reusable macro' },
    { label: 'endmacro', kind: monaco.languages.CompletionItemKind.Property, insertText: 'endmacro %}', detail: 'Tag', documentation: 'Close a macro block' },
    { label: 'block', kind: monaco.languages.CompletionItemKind.Property, insertText: 'block ${1:name} %}\n\t$0\n{% endblock %}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'Tag', documentation: 'Define a template block' },
    { label: 'endblock', kind: monaco.languages.CompletionItemKind.Property, insertText: 'endblock %}', detail: 'Tag', documentation: 'Close a block' }
];

function buildTagKeywordSuggestions(range: monaco.IRange, needsLeadingSpace: boolean): monaco.languages.CompletionItem[] {
    return TAG_KEYWORD_SUGGESTIONS.map((item) => ({
        ...item,
        range,
        insertText: needsLeadingSpace ? ' ' + item.insertText : item.insertText
    }));
}

function isAtTagKeywordPosition(textUntilPosition: string): boolean {
    const lastTagStart = textUntilPosition.lastIndexOf('{%');
    if (lastTagStart === -1) {
        return false;
    }
    return /^\s*[a-zA-Z]*$/.test(textUntilPosition.slice(lastTagStart + 2));
}

function extendRangeOverAutoClosedTag(model: monaco.editor.ITextModel, position: monaco.Position, range: monaco.IRange): monaco.IRange {
    const textAfter = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: range.endColumn,
        endLineNumber: position.lineNumber,
        endColumn: model.getLineMaxColumn(position.lineNumber)
    });

    const autoClosedTag = textAfter.match(/^\s*-?%}/);
    if (!autoClosedTag) {
        return range;
    }

    return { ...range, endColumn: range.endColumn + autoClosedTag[0].length };
}

function registerCompletionProvider(languageId: string): void {
    const completionProviderDisposables = getProviderDisposables('twigCompletionProviderDisposables');
    completionProviderDisposables.get(languageId)?.dispose();

    const disposable = monaco.languages.registerCompletionItemProvider(languageId, {
        provideCompletionItems(model, position) {
            const editor = monaco.editor.getEditors().find((e) => e.getModel() === model);
            const opts = ((editor?.getRawOptions() ?? {}) as unknown) as EditorContext;
            const params = opts.params ?? {};
            const twigVariables = opts.variables ?? [];
            const name = opts.name ?? '';
            const scope = opts.scope ?? '';

            if (model.getLanguageId() === 'css') return { suggestions: [] };

            const wordUntilPosition = model.getWordUntilPosition(position);
            const textUntilPosition = model.getValueInRange({
                startLineNumber: position.lineNumber,
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: position.column
            });

            const isInTwigBlock = /{%[\s\S]*$/.test(textUntilPosition);
            const isInTwigExpression = /{{[\s\S]*$/.test(textUntilPosition);
            const isAfterPipe = /\|\s*\w*$/.test(textUntilPosition);

            const range: monaco.IRange = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: wordUntilPosition.startColumn,
                endColumn: wordUntilPosition.endColumn
            };

            if (isAfterPipe) {
                return { suggestions: buildFilterSuggestions(params, range) };
            }

            if (!isInTwigBlock && !isInTwigExpression) {
                return { suggestions: [] };
            }

            if (isInTwigBlock && isAtTagKeywordPosition(textUntilPosition)) {
                const tagRange = extendRangeOverAutoClosedTag(model, position, range);
                const charBeforeTag = model.getValueInRange({
                    startLineNumber: position.lineNumber,
                    startColumn: Math.max(1, tagRange.startColumn - 1),
                    endLineNumber: position.lineNumber,
                    endColumn: tagRange.startColumn
                });
                const needsLeadingSpace = charBeforeTag.length > 0 && !/\s/.test(charBeforeTag);
                return { suggestions: buildTagKeywordSuggestions(tagRange, needsLeadingSpace) };
            }

            const documentTextBeforeCursor = model.getValueInRange({
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: position.column
            });

            const finalSuggestions = buildVariableAndFunctionSuggestions(
                twigVariables, name, scope, params, documentTextBeforeCursor, range
            );

            return {
                suggestions: finalSuggestions
            };
        }
    });

    completionProviderDisposables.set(languageId, disposable);
}

function registerHoverProvider(languageId: string): void {
    const hoverProviderDisposables = getProviderDisposables('twigHoverProviderDisposables');
    hoverProviderDisposables.get(languageId)?.dispose();

    const disposable = monaco.languages.registerHoverProvider(languageId, {
        provideHover(model, position) {
            const wordInfo = model.getWordAtPosition(position);
            if (!wordInfo) return null;

            const textBeforeWord = model.getValueInRange({
                startLineNumber: position.lineNumber,
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: wordInfo.startColumn
            });

            const isInTwigBlock = /{%[\s\S]*$/.test(textBeforeWord);
            const isInTwigExpression = /{{[\s\S]*$/.test(textBeforeWord);
            if (!isInTwigBlock && !isInTwigExpression) return null;

            if (textBeforeWord.trimEnd().slice(-1) === '.' || textBeforeWord.trimEnd().slice(-1) === '|') return null;

            const textAfterWord = model.getValueInRange({
                startLineNumber: position.lineNumber,
                startColumn: wordInfo.endColumn,
                endLineNumber: position.lineNumber,
                endColumn: model.getLineMaxColumn(position.lineNumber)
            });
            if (/^\s*\(/.test(textAfterWord)) return null;

            const editor = monaco.editor.getEditors().find((e) => e.getModel() === model);
            const opts = ((editor?.getRawOptions() ?? {}) as unknown) as EditorContext;
            const twigVariables = opts.variables ?? [];
            const name = opts.name ?? '';
            const scope = opts.scope ?? '';

            const documentTextBeforeCursor = model.getValueInRange({
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: wordInfo.startColumn
            });
            const localVariables = collectSetVariables(documentTextBeforeCursor);

            const description = resolveVariableDescription(wordInfo.word, twigVariables, localVariables, name, scope);
            if (!description) return null;

            return {
                range: {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: wordInfo.startColumn,
                    endColumn: wordInfo.endColumn
                },
                contents: [{ value: description }]
            };
        }
    });

    hoverProviderDisposables.set(languageId, disposable);
}

function registerDocumentHighlightProvider(languageId: string): void {
    const disposables = getProviderDisposables('twigDocumentHighlightProviderDisposables');
    disposables.get(languageId)?.dispose();

    const disposable = monaco.languages.registerDocumentHighlightProvider(languageId, {
        provideDocumentHighlights(model, position) {
            const wordInfo = model.getWordAtPosition(position);
            if (!wordInfo) return null;

            let tokens: TwigToken[];
            try {
                tokens = new TwigLexer(3).tokenize(model.getValue()) as unknown as TwigToken[];
            } catch {
                return null;
            }

            const matches = tokens.filter((token) => token.type === 'NAME' && token.value === wordInfo.word);
            if (!matches.length) return null;

            return matches.map((token) => ({
                range: new monaco.Range(token.line, token.column, token.line, token.column + String(token.value ?? '').length),
                kind: monaco.languages.DocumentHighlightKind.Text
            }));
        }
    });

    disposables.set(languageId, disposable);
}

const SEMANTIC_TOKEN_TYPES = [
    'twig.tagDelimiter', 'twig.delimiter', 'twig.keyword', 'twig.variable',
    'twig.operator', 'twig.string', 'twig.filter', 'twig.number', 'twig.comment'
];
const SEMANTIC_TYPE_INDEX: Record<string, number> = Object.fromEntries(
    SEMANTIC_TOKEN_TYPES.map((type, index) => [type, index])
);

const TWIG_STATEMENT_KEYWORDS = new Set([
    'if', 'else', 'elseif', 'endif', 'for', 'endfor', 'set', 'macro', 'endmacro',
    'block', 'endblock', 'filter', 'endfilter', 'spaceless', 'endspaceless',
    'with', 'endwith', 'trans', 'endtrans', 'autoescape', 'endautoescape',
    'embed', 'endembed', 'verbatim', 'endverbatim', 'extends', 'true', 'false', 'null', 'none'
]);

const SEMANTIC_SKIPPABLE_TOKEN_TYPES = new Set(['WHITESPACE', 'TRIMMING_MODIFIER', 'LINE_TRIMMING_MODIFIER']);

function semanticPrevSignificant(tokens: TwigToken[], index: number): TwigToken | null {
    for (let i = index - 1; i >= 0; i--) {
        if (!SEMANTIC_SKIPPABLE_TOKEN_TYPES.has(tokens[i].type)) {
            return tokens[i];
        }
    }
    return null;
}

function classifyTwigToken(tokens: TwigToken[], index: number): { type: string; length: number } | null {
    const token = tokens[index];
    const value = String(token.value ?? '');

    switch (token.type) {
        case 'TAG_START':
        case 'TAG_END':
            return { type: 'twig.tagDelimiter', length: value.length };
        case 'VARIABLE_START':
        case 'VARIABLE_END':
            return { type: 'twig.delimiter', length: value.length };
        case 'NUMBER':
            return { type: 'twig.number', length: value.length };
        case 'STRING':
        case 'OPENING_QUOTE':
        case 'CLOSING_QUOTE':
            return { type: 'twig.string', length: value.length };
        case 'OPERATOR':
        case 'TEST_OPERATOR':
            return { type: 'twig.operator', length: value.length };
        case 'PUNCTUATION':
            if (value === '.' || value === '|') {
                return { type: 'twig.operator', length: value.length };
            }
            if (value === '(' || value === ')' || value === ',') {
                return { type: 'twig.delimiter', length: value.length };
            }
            return null;
        case 'NAME': {
            if (TWIG_STATEMENT_KEYWORDS.has(value)) {
                return { type: 'twig.keyword', length: value.length };
            }
            const prev = semanticPrevSignificant(tokens, index);
            if (prev?.type === 'PUNCTUATION' && prev.value === '|') {
                return { type: 'twig.filter', length: value.length };
            }
            return { type: 'twig.variable', length: value.length };
        }
        default:
            return null;
    }
}

type RawSemanticToken = { line: number; column: number; length: number; typeIndex: number };

function offsetFromLineColumn(source: string, line: number, column: number): number {
    const lines = source.split('\n');
    let offset = 0;
    for (let i = 0; i < line - 1 && i < lines.length; i++) {
        offset += lines[i].length + 1;
    }
    return offset + (column - 1);
}

function tokenizeTwigWithRecovery(text: string): TwigToken[] {
    let source = text;
    let partialTokens: TwigToken[] = [];

    for (let attempt = 0; attempt < 50; attempt++) {
        const lexer = new TwigLexer(3);
        try {
            return lexer.tokenize(source) as unknown as TwigToken[];
        } catch (e) {
            partialTokens = (lexer as unknown as { tokens: TwigToken[] }).tokens ?? [];

            const error = e as { line?: number; column?: number };
            if (typeof error.line !== 'number' || typeof error.column !== 'number') {
                break;
            }

            const offset = offsetFromLineColumn(source, error.line, error.column);
            if (offset < 0 || offset >= source.length) {
                break;
            }

            source = source.slice(0, offset) + ' ' + source.slice(offset + 1);
        }
    }

    return partialTokens;
}

function collectTwigSemanticTokens(text: string): RawSemanticToken[] {
    const tokens = tokenizeTwigWithRecovery(text);

    const result: RawSemanticToken[] = [];
    let insideComment = false;

    const push = (token: TwigToken, typeName: string, length: number): void => {
        result.push({ line: token.line, column: token.column, length, typeIndex: SEMANTIC_TYPE_INDEX[typeName] });
    };

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (token.type === 'COMMENT_START' || token.type === 'COMMENT_END') {
            insideComment = token.type === 'COMMENT_START';
            push(token, 'twig.comment', String(token.value ?? '').length);
            continue;
        }

        if (insideComment) {
            if (token.type === 'TEXT') {
                push(token, 'twig.comment', String(token.value ?? '').length);
            }
            continue;
        }

        const classified = classifyTwigToken(tokens, i);
        if (classified) {
            push(token, classified.type, classified.length);
        }
    }

    return result;
}

function encodeSemanticTokens(rawTokens: RawSemanticToken[]): Uint32Array {
    const sorted = [...rawTokens].sort((a, b) => (a.line - b.line) || (a.column - b.column));
    const data: number[] = [];
    let prevLine = 0;
    let prevColumn = 0;

    for (const token of sorted) {
        const line = token.line - 1;
        const column = token.column - 1;
        const deltaLine = line - prevLine;
        const deltaColumn = deltaLine === 0 ? column - prevColumn : column;

        data.push(deltaLine, deltaColumn, token.length, token.typeIndex, 0);

        prevLine = line;
        prevColumn = column;
    }

    return new Uint32Array(data);
}

function registerSemanticTokensProvider(languageId: string): void {
    const disposables = getProviderDisposables('twigSemanticTokensProviderDisposables');
    disposables.get(languageId)?.dispose();

    const disposable = monaco.languages.registerDocumentSemanticTokensProvider(languageId, {
        getLegend: () => ({ tokenTypes: SEMANTIC_TOKEN_TYPES, tokenModifiers: [] }),
        provideDocumentSemanticTokens(model) {
            try {
                return { data: encodeSemanticTokens(collectTwigSemanticTokens(model.getValue())) };
            } catch {
                return { data: new Uint32Array(0) };
            }
        },
        releaseDocumentSemanticTokens() {}
    });

    disposables.set(languageId, disposable);
}

let jsonTwigConfigArmed = false;
function prepareJsonConfiguration(): void {
    if (jsonTwigConfigArmed) {
        return;
    }
    jsonTwigConfigArmed = true;

    monaco.languages.onLanguage('json', () => {
        monaco.languages.json.getWorker().then(() => {
            monaco.languages.setLanguageConfiguration('json', JSON_TWIG_LANGUAGE_CONFIGURATION);
        });
    });
}

export function registerTwigForLanguage(languageId: string): string {
    if (languageId === 'html') {
        monaco.languages.setLanguageConfiguration('html', HTML_TWIG_LANGUAGE_CONFIGURATION);
        registerDocumentHighlightProvider(languageId);
    } else if (languageId === 'json') {
        prepareJsonConfiguration();
        monaco.languages.setLanguageConfiguration('json', JSON_TWIG_LANGUAGE_CONFIGURATION);
    }

    registerCompletionProvider(languageId);
    registerHoverProvider(languageId);
    registerSemanticTokensProvider(languageId);

    return languageId;
}
