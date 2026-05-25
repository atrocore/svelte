import * as monaco from 'monaco-editor';
import { Metadata } from '$lib/core/metadata';
import { Language } from '$lib/core/language';

declare global {
    interface Window {
        monacoProviderRegistered: string[] | null;
    }
}

type EditorContext = {
    params: Record<string, unknown>;
    twigVariables: string[];
    name: string;
    scope: string;
};

const jsonTwigLanguageConfig = {
    defaultToken: '',
    tokenizer: {
        root: [
            [/{{/, { token: 'twig.delimiter', next: '@twigExpression' }],
            [/{%/, { token: 'twig.delimiter', next: '@twigStatement' }],
            [/[{}]/, 'delimiter.bracket'],
            [/[[]]/, 'delimiter.square'],
            [/:/, 'delimiter'],
            [/,/, 'delimiter'],
            [/"([^"\\]|\\.)*"/, 'string'],
            [/true|false|null/, 'keyword'],
            [/-?\d+\.?\d*([eE][+-]?\d+)?/, 'number']
        ],
        twigExpression: [
            [/}}/, { token: 'twig.delimiter', next: '@pop' }],
            [/[a-zA-Z_]\w*/, 'twig.variable'],
            [/\./, 'twig.operator'],
            [/\|/, 'twig.operator', '@twigFilter'],
            [/"([^"\\]|\\.)*"/, 'twig.string'],
            [/'([^'\\]|\\.)*'/, 'twig.string']
        ],
        twigStatement: [
            [/%}/, { token: 'twig.delimiter', next: '@pop' }],
            [/\s*(if|else|elseif|endif|for|endfor|set)\s*/, 'twig.keyword'],
            [/[a-zA-Z_]\w*/, 'twig.variable'],
            [/==|!=|<|>|<=|>=/, 'twig.operator'],
            [/and|or|not|in|is/, 'twig.operator'],
            [/"([^"\\]|\\.)*"/, 'twig.string'],
            [/'([^'\\]|\\.)*'/, 'twig.string'],
            [/\d+/, 'twig.number']
        ],
        twigFilter: [
            [/[a-zA-Z_]\w*/, 'twig.filter'],
            [/\(/, { token: 'twig.delimiter', next: '@twigFilterParams' }],
            [/\|/, 'twig.operator', '@twigFilter'],
            [/}}/, { token: 'twig.delimiter', next: '@pop' }]
        ],
        twigFilterParams: [
            [/\)/, { token: 'twig.delimiter', next: '@pop' }],
            [/,/, 'twig.delimiter'],
            [/"([^"\\]|\\.)*"/, 'twig.string'],
            [/'([^'\\]|\\.)*'/, 'twig.string'],
            [/\d+/, 'twig.number']
        ]
    }
} as monaco.languages.IMonarchLanguage;

function registerTheme(): void {
    if (window.monacoProviderRegistered !== null) return;

    monaco.editor.defineTheme('twig', {
        base: 'vs',
        inherit: true,
        rules: [
            { token: 'twig.keyword', foreground: '0000FF', fontStyle: 'bold' },
            { token: 'twig.variable', foreground: '267F99' },
            { token: 'twig.operator', foreground: '000000' },
            { token: 'twig.string', foreground: 'A31515' },
            { token: 'twig.delimiter', foreground: '0000FF' },
            { token: 'twig.filter', foreground: '267F99', fontStyle: 'italic' },
            { token: 'twig.number', foreground: '098658' }
        ],
        colors: {
            'editor.background': '#FFFFFE',
            'editor.foreground': '#000000',
            'editor.inactiveSelectionBackground': '#E5EBF1',
            'editorIndentGuide.background1': '#D3D3D3',
            'editorIndentGuide.activeBackground1': '#939393',
            'editor.selectionHighlightBackground': '#ADD6FF4D'
        }
    });
    window.monacoProviderRegistered = [];
}

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

function buildVariableAndFunctionSuggestions(
    twigVariables: string[],
    name: string,
    scope: string,
    params: Record<string, unknown>,
    textUntilPosition: string,
    range: monaco.IRange
): monaco.languages.CompletionItem[] {
    let order = 100;

    const variableTranslations = (Language.get(scope, 'twigVariables', name) ?? {}) as Record<string, string>;
    const suggestions: Omit<monaco.languages.CompletionItem, 'range'>[] = [...twigVariables, 'config']
        .map((variable) => ({
            name: variable,
            description: variableTranslations[variable] ?? (Language.get('Global', 'twigVariables', variable) as string)
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(({ name: varName, description }) => ({
            label: varName,
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: varName,
            documentation: description,
            detail: 'Variable',
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

    const snippets: Omit<monaco.languages.CompletionItem, 'range'>[] = [
        { label: 'set', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'set ${1:var} = $0 %}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'Set a variable' },
        { label: 'block', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'block ${1:name} %}\n\t$0\n{% endblock %}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'Create a new block' },
        { label: 'for', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'for ${1:item} in ${2:items} %}\n\t$0\n{% endfor %}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'Create a for loop' },
        { label: 'if', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'if ${1:condition} %}\n\t$0\n{% endif %}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'Create an if statement' },
    ];

    if (/{%\s*$/.test(textUntilPosition)) {
        snippets.forEach((snippet) => suggestions.push(snippet));
    }

    return suggestions.map((item) => ({ ...item, range }));
}

function registerCompletionProvider(languageId: string): void {
    if (window.monacoProviderRegistered?.includes(languageId)) return;

    monaco.languages.registerCompletionItemProvider(languageId, {
        provideCompletionItems(model, position) {
            const editor = monaco.editor.getEditors().find((e) => e.getModel() === model);
            const opts = ((editor?.getRawOptions() ?? {}) as unknown) as EditorContext;
            const params = opts.params ?? {};
            const twigVariables = opts.twigVariables ?? [];
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

            return {
                suggestions: buildVariableAndFunctionSuggestions(
                    twigVariables, name, scope, params, textUntilPosition, range
                )
            };
        }
    });

    window.monacoProviderRegistered = [...(window.monacoProviderRegistered ?? []), languageId];
}

export function registerTwigForLanguage(languageId: string): string {
    let effectiveLanguageId = languageId;

    if (languageId === 'json') {
        effectiveLanguageId = 'json-twig';
        monaco.languages.register({ id: effectiveLanguageId });
        monaco.languages.setLanguageConfiguration(effectiveLanguageId, {
            autoClosingPairs: [
                { open: '{', close: '}' }, { open: '[', close: ']' }, { open: '(', close: ')' },
                { open: '"', close: '"' }, { open: "'", close: "'" },
                { open: '{{', close: '}}' }, { open: '{%', close: '%}' }, { open: '{#', close: '#}' }
            ],
            surroundingPairs: [
                { open: '{', close: '}' }, { open: '[', close: ']' }, { open: '(', close: ')' },
                { open: '"', close: '"' }, { open: "'", close: "'" },
                { open: '{{', close: '}}' }, { open: '{%', close: '%}' }, { open: '{#', close: '#}' }
            ],
            brackets: [['{', '}'], ['[', ']'], ['(', ')'], ['{{', '}}'], ['{%', '%}'], ['{#', '#}']],
            wordPattern: /(-?\d*\.\d\w*)|([^`~!@#$%^&*()=+\[{\]}\\|;:'",.\/< >?\s]+)/g,
            comments: { blockComment: ['{#', '#}'] },
            onEnterRules: [
                {
                    beforeText: /^\s*{%\s*(if|for|block|verbatim|filter|spaceless|with|trans|autoescape|embed|macro)\s*.*%}$/,
                    afterText: /^\s*{%\s*end\w+\s*%}$/,
                    action: {
                        indentAction: monaco.languages.IndentAction.IndentOutdent,
                        appendText: '    '
                    }
                }
            ],
            folding: {
                markers: {
                    start: new RegExp('^\\s*{%\\s*(if|for|block|verbatim|filter|spaceless|with|trans|autoescape|embed|macro)\\s.*%}'),
                    end: new RegExp('^\\s*{%\\s*end\\w+\\s*%}')
                }
            }
        });
        monaco.languages.setMonarchTokensProvider(effectiveLanguageId, jsonTwigLanguageConfig);
    }

    registerTheme();
    registerCompletionProvider(effectiveLanguageId);

    return effectiveLanguageId;
}
