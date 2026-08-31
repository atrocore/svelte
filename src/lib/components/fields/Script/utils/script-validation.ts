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
import { Lexer as TwigLexer, SyntaxError as TwigSyntaxError, type Token as TwigToken } from 'twig-lexer';

const JSON_ERRORS_OWNER = 'json-validation';
const UNKNOWN_VARIABLES_OWNER = 'twig-variable-validation';
const TWIG_SYNTAX_OWNER = 'twig-syntax-validation';
const DEBOUNCE_MS = 300;

const PAIRED_TAG_CLOSERS: Record<string, string> = {
    if: 'endif',
    for: 'endfor',
    block: 'endblock',
    macro: 'endmacro',
    filter: 'endfilter',
    spaceless: 'endspaceless',
    with: 'endwith',
    trans: 'endtrans',
    autoescape: 'endautoescape',
    embed: 'endembed',
    verbatim: 'endverbatim'
};
const PAIRED_TAG_CLOSER_SET = new Set(Object.values(PAIRED_TAG_CLOSERS));

const STATEMENT_KEYWORDS = new Set([
    'if', 'else', 'elseif', 'endif', 'for', 'endfor', 'set', 'macro', 'endmacro',
    'block', 'endblock', 'filter', 'endfilter', 'spaceless', 'endspaceless',
    'with', 'endwith', 'trans', 'endtrans', 'autoescape', 'endautoescape',
    'embed', 'endembed', 'verbatim', 'endverbatim', 'extends', 'true', 'false', 'null', 'none'
]);

const ALWAYS_KNOWN_VARIABLES = new Set(['loop', '_self']);

const SKIPPABLE_TOKEN_TYPES = new Set(['WHITESPACE', 'TRIMMING_MODIFIER', 'LINE_TRIMMING_MODIFIER']);

function nextSignificant(tokens: TwigToken[], index: number): TwigToken | null {
    for (let i = index + 1; i < tokens.length; i++) {
        if (!SKIPPABLE_TOKEN_TYPES.has(tokens[i].type)) {
            return tokens[i];
        }
    }
    return null;
}

function prevSignificant(tokens: TwigToken[], index: number): TwigToken | null {
    for (let i = index - 1; i >= 0; i--) {
        if (!SKIPPABLE_TOKEN_TYPES.has(tokens[i].type)) {
            return tokens[i];
        }
    }
    return null;
}

function findBlockEnd(tokens: TwigToken[], startIndex: number, endType: string): number {
    for (let i = startIndex + 1; i < tokens.length; i++) {
        if (tokens[i].type === endType) {
            return i;
        }
    }
    return -1;
}

function tagKeyword(tokens: TwigToken[], tagStartIndex: number): string | null {
    for (let i = tagStartIndex + 1; i < tokens.length; i++) {
        const token = tokens[i];
        if (token.type === 'NAME') {
            return token.value as string;
        }
        if (token.type === 'TAG_END' || !SKIPPABLE_TOKEN_TYPES.has(token.type)) {
            return null;
        }
    }
    return null;
}

type TokenizeResult =
    | { tokens: TwigToken[]; error?: undefined }
    | { tokens?: undefined; error: TwigSyntaxError };

function tokenizeDocument(text: string): TokenizeResult {
    try {
        return { tokens: new TwigLexer(3).tokenize(text) as unknown as TwigToken[] };
    } catch (e) {
        if (e instanceof TwigSyntaxError) {
            return { error: e };
        }
        throw e;
    }
}

function tokenOffset(model: monaco.editor.ITextModel, token: TwigToken): number {
    return model.getOffsetAt({ lineNumber: token.line, column: token.column });
}

function tokenEndOffset(model: monaco.editor.ITextModel, token: TwigToken): number {
    return tokenOffset(model, token) + String(token.value ?? '').length;
}

function buildValuePlaceholder(match: string): string {
    let result = '';
    let inserted = false;
    let i = 0;
    while (i < match.length) {
        const ch = match[i];
        if (ch === '\n' || ch === '\r') {
            result += ch;
            i++;
            continue;
        }
        if (!inserted && match.length - i >= 4 && !/[\n\r]/.test(match.slice(i, i + 4))) {
            result += 'null';
            inserted = true;
            i += 4;
            continue;
        }
        result += ' ';
        i++;
    }
    return result;
}

function buildVoidPlaceholder(match: string): string {
    let result = '';
    for (const ch of match) {
        result += ch === '\n' || ch === '\r' ? ch : ' ';
    }
    return result;
}

function hasLiteralContent(tokens: TwigToken[], fromIndex: number, toIndex: number): boolean {
    for (let i = fromIndex; i < toIndex; i++) {
        const token = tokens[i];
        if (token.type === 'TEXT' && String(token.value).trim() !== '') {
            return true;
        }
        if (token.type === 'VARIABLE_START') {
            return true;
        }
    }
    return false;
}

type Span = { start: number; end: number; producesValue: boolean };

function collectTopLevelSpans(model: monaco.editor.ITextModel, tokens: TwigToken[]): Span[] {
    const spans: Span[] = [];
    const openStack: { start: number; contentStartIndex: number; keyword: string }[] = [];

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (token.type === 'VARIABLE_START') {
            const endIndex = findBlockEnd(tokens, i, 'VARIABLE_END');
            const end = endIndex !== -1 ? tokenEndOffset(model, tokens[endIndex]) : tokenEndOffset(model, token);
            if (openStack.length === 0) {
                spans.push({ start: tokenOffset(model, token), end, producesValue: true });
            }
            i = endIndex !== -1 ? endIndex : i;
            continue;
        }

        if (token.type === 'COMMENT_START') {
            const endIndex = findBlockEnd(tokens, i, 'COMMENT_END');
            const end = endIndex !== -1 ? tokenEndOffset(model, tokens[endIndex]) : tokenEndOffset(model, token);
            if (openStack.length === 0) {
                spans.push({ start: tokenOffset(model, token), end, producesValue: false });
            }
            i = endIndex !== -1 ? endIndex : i;
            continue;
        }

        if (token.type === 'TAG_START') {
            const endIndex = findBlockEnd(tokens, i, 'TAG_END');
            const keyword = tagKeyword(tokens, i);

            if (keyword !== null && keyword in PAIRED_TAG_CLOSERS) {
                openStack.push({ start: tokenOffset(model, token), contentStartIndex: endIndex, keyword });
                i = endIndex !== -1 ? endIndex : i;
                continue;
            }

            if (keyword !== null && PAIRED_TAG_CLOSER_SET.has(keyword)) {
                const open = openStack.pop();
                const end = endIndex !== -1 ? tokenEndOffset(model, tokens[endIndex]) : tokenEndOffset(model, token);
                if (openStack.length === 0 && open !== undefined) {
                    const producesValue = open.keyword === 'macro'
                        ? false
                        : hasLiteralContent(tokens, open.contentStartIndex + 1, i);
                    spans.push({ start: open.start, end, producesValue });
                }
                i = endIndex !== -1 ? endIndex : i;
                continue;
            }

            const end = endIndex !== -1 ? tokenEndOffset(model, tokens[endIndex]) : tokenEndOffset(model, token);
            if (openStack.length === 0) {
                spans.push({ start: tokenOffset(model, token), end, producesValue: false });
            }
            i = endIndex !== -1 ? endIndex : i;
            continue;
        }
    }

    return spans;
}

function maskTwig(model: monaco.editor.ITextModel, tokens: TwigToken[], text: string): string {
    const spans = collectTopLevelSpans(model, tokens);

    let result = '';
    let cursor = 0;
    for (const span of spans) {
        result += text.slice(cursor, span.start);
        const raw = text.slice(span.start, span.end);
        result += span.producesValue ? buildValuePlaceholder(raw) : buildVoidPlaceholder(raw);
        cursor = span.end;
    }
    result += text.slice(cursor);

    return result;
}

type JsonSyntaxError = { offset: number; message: string };

function findJsonSyntaxError(text: string): JsonSyntaxError | null {
    let i = 0;

    const isWhitespace = (ch: string): boolean => ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r';
    const skipWhitespace = (): void => {
        while (i < text.length && isWhitespace(text[i])) i++;
    };
    const fail = (offset: number, message: string): never => {
        throw { offset, message } as JsonSyntaxError;
    };

    const parseString = (): void => {
        const start = i;
        i++;
        while (true) {
            if (i >= text.length) fail(start, 'Unterminated string');
            const ch = text[i];
            if (ch === '"') { i++; return; }
            if (ch === '\\') { i += 2; continue; }
            if (ch === '\n') fail(i, 'Unexpected line break in string');
            i++;
        }
    };

    const parseNumber = (): void => {
        const start = i;
        if (text[i] === '-') i++;
        if (!/[0-9]/.test(text[i] ?? '')) fail(start, 'Invalid number');
        while (/[0-9]/.test(text[i] ?? '')) i++;
        if (text[i] === '.') {
            i++;
            if (!/[0-9]/.test(text[i] ?? '')) fail(i, 'Invalid number');
            while (/[0-9]/.test(text[i] ?? '')) i++;
        }
        if (text[i] === 'e' || text[i] === 'E') {
            i++;
            if (text[i] === '+' || text[i] === '-') i++;
            if (!/[0-9]/.test(text[i] ?? '')) fail(i, 'Invalid number');
            while (/[0-9]/.test(text[i] ?? '')) i++;
        }
    };

    const parseValue = (): void => {
        skipWhitespace();
        if (i >= text.length) fail(i, 'Unexpected end of JSON input');
        const ch = text[i];
        if (ch === '"') return parseString();
        if (ch === '{') return parseObject();
        if (ch === '[') return parseArray();
        if (ch === '-' || (ch >= '0' && ch <= '9')) return parseNumber();
        if (text.startsWith('true', i)) { i += 4; return; }
        if (text.startsWith('false', i)) { i += 5; return; }
        if (text.startsWith('null', i)) { i += 4; return; }
        fail(i, `Unexpected token "${ch}"`);
    };

    function parseObject(): void {
        i++;
        skipWhitespace();
        if (text[i] === '}') { i++; return; }
        while (true) {
            skipWhitespace();
            if (text[i] !== '"') fail(i, 'Expected property name in double quotes');
            parseString();
            skipWhitespace();
            if (text[i] !== ':') fail(i, "Expected ':' after property name");
            i++;
            parseValue();
            skipWhitespace();
            if (text[i] === ',') { i++; continue; }
            if (text[i] === '}') { i++; return; }
            fail(i, "Expected ',' or '}' after property value");
        }
    }

    function parseArray(): void {
        i++;
        skipWhitespace();
        if (text[i] === ']') { i++; return; }
        while (true) {
            parseValue();
            skipWhitespace();
            if (text[i] === ',') { i++; continue; }
            if (text[i] === ']') { i++; return; }
            fail(i, "Expected ',' or ']' after array element");
        }
    }

    try {
        parseValue();
        skipWhitespace();
        if (i < text.length) {
            fail(i, 'Unexpected non-whitespace character after JSON');
        }
        return null;
    } catch (e) {
        return e as JsonSyntaxError;
    }
}

function jsonSyntaxErrorToMarker(model: monaco.editor.ITextModel, error: JsonSyntaxError): monaco.editor.IMarkerData {
    const position = model.getPositionAt(Math.min(error.offset, model.getValueLength()));

    return {
        severity: monaco.MarkerSeverity.Error,
        message: error.message,
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: position.lineNumber,
        endColumn: position.column + 1
    };
}

function collectJsonErrorMarkers(model: monaco.editor.ITextModel, tokens: TwigToken[]): monaco.editor.IMarkerData[] {
    const masked = maskTwig(model, tokens, model.getValue());

    if (masked.trim() === '') {
        return [];
    }

    const error = findJsonSyntaxError(masked);
    return error ? [jsonSyntaxErrorToMarker(model, error)] : [];
}

function collectPlainJsonErrorMarkers(model: monaco.editor.ITextModel): monaco.editor.IMarkerData[] {
    const text = model.getValue();
    if (text.trim() === '') {
        return [];
    }

    const error = findJsonSyntaxError(text);
    return error ? [jsonSyntaxErrorToMarker(model, error)] : [];
}

function findMatchingParenIndex(tokens: TwigToken[], openIndex: number): number {
    let depth = 0;
    for (let i = openIndex; i < tokens.length; i++) {
        const token = tokens[i];
        if (token.type !== 'PUNCTUATION') {
            continue;
        }
        if (token.value === '(') {
            depth++;
        } else if (token.value === ')') {
            depth--;
            if (depth === 0) {
                return i;
            }
        }
    }
    return -1;
}

function collectUnknownVariableMarkers(
    tokens: TwigToken[],
    twigVariables: string[]
): monaco.editor.IMarkerData[] {
    const known = new Set([...twigVariables, ...ALWAYS_KNOWN_VARIABLES, 'config']);
    const markers: monaco.editor.IMarkerData[] = [];

    let insideTwig = 0;
    let forDeclaring = false;
    let forSawIn = false;
    let macroNamePending = false;
    let macroParamsPending = false;
    let insideMacroParams = false;

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (token.type === 'TAG_START' || token.type === 'VARIABLE_START') {
            insideTwig++;
            if (token.type === 'TAG_START') {
                forDeclaring = false;
                forSawIn = false;
                macroNamePending = false;
                macroParamsPending = false;
                insideMacroParams = false;
            }
            continue;
        }

        if (token.type === 'TAG_END' || token.type === 'VARIABLE_END') {
            insideTwig--;
            continue;
        }

        if (token.type === 'COMMENT_START' || token.type === 'COMMENT_END') {
            continue;
        }

        if (insideTwig === 0) {
            continue;
        }

        if (token.type === 'PUNCTUATION' && token.value === '(' && macroParamsPending) {
            insideMacroParams = true;
            macroParamsPending = false;
            continue;
        }

        if (token.type === 'PUNCTUATION' && token.value === '(') {
            const closeIndex = findMatchingParenIndex(tokens, i);
            if (closeIndex !== -1 && nextSignificant(tokens, closeIndex)?.type === 'ARROW') {
                for (let j = i + 1; j < closeIndex; j++) {
                    if (tokens[j].type === 'NAME') {
                        known.add(tokens[j].value as string);
                    }
                }
            }
        }

        if (token.type === 'PUNCTUATION' && token.value === ')' && insideMacroParams) {
            insideMacroParams = false;
            continue;
        }

        if (token.type === 'OPERATOR' && token.value === 'in' && forDeclaring) {
            forSawIn = true;
            continue;
        }

        if (token.type !== 'NAME') {
            continue;
        }

        const value = token.value as string;

        if (STATEMENT_KEYWORDS.has(value)) {
            if (value === 'for') {
                forDeclaring = true;
                forSawIn = false;
            }
            if (value === 'macro') {
                macroNamePending = true;
            }
            continue;
        }

        const prev = prevSignificant(tokens, i);
        const next = nextSignificant(tokens, i);

        if (prev?.type === 'TEST_OPERATOR') {
            continue;
        }

        if (macroNamePending) {
            macroNamePending = false;
            macroParamsPending = true;
            continue;
        }

        if (insideMacroParams) {
            known.add(value);
            continue;
        }

        if (prev?.type === 'PUNCTUATION' && (prev.value === '.' || prev.value === '|')) {
            continue;
        }

        if (next?.type === 'PUNCTUATION' && next.value === '(') {
            continue;
        }

        if (next?.type === 'PUNCTUATION' && next.value === ':'
            && prev?.type === 'PUNCTUATION' && (prev.value === '(' || prev.value === '{' || prev.value === ',')) {
            continue;
        }

        if (next?.type === 'ARROW') {
            known.add(value);
            continue;
        }

        if (forDeclaring && !forSawIn) {
            known.add(value);
            continue;
        }

        if (prev?.type === 'NAME' && prev.value === 'set') {
            known.add(value);
            continue;
        }

        if (!known.has(value)) {
            markers.push({
                severity: monaco.MarkerSeverity.Warning,
                message: `Unknown variable "${value}"`,
                startLineNumber: token.line,
                startColumn: token.column,
                endLineNumber: token.line,
                endColumn: token.column + value.length
            });
        }
    }

    return markers;
}

function makeSyntaxMarker(startToken: TwigToken, endToken: TwigToken, message: string): monaco.editor.IMarkerData {
    const endColumn = endToken.column + String(endToken.value ?? '').length;

    return {
        severity: monaco.MarkerSeverity.Error,
        message,
        startLineNumber: startToken.line,
        startColumn: startToken.column,
        endLineNumber: endToken.line,
        endColumn
    };
}

function collectTwigSyntaxMarkers(tokens: TwigToken[]): monaco.editor.IMarkerData[] {
    const markers: monaco.editor.IMarkerData[] = [];
    const openStack: { keyword: string; startToken: TwigToken; endToken: TwigToken }[] = [];

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (token.type !== 'TAG_START') {
            continue;
        }

        const endIndex = findBlockEnd(tokens, i, 'TAG_END');
        const endToken = endIndex !== -1 ? tokens[endIndex] : token;
        const keyword = tagKeyword(tokens, i);

        if (keyword === null) {
            markers.push(makeSyntaxMarker(token, endToken, 'Empty tag "{% %}" — expected a statement keyword (if, for, set, ...)'));
            i = endIndex !== -1 ? endIndex : i;
            continue;
        }

        if (keyword in PAIRED_TAG_CLOSERS) {
            openStack.push({ keyword, startToken: token, endToken });
            i = endIndex !== -1 ? endIndex : i;
            continue;
        }

        if (PAIRED_TAG_CLOSER_SET.has(keyword)) {
            const top = openStack.pop();

            if (!top) {
                markers.push(makeSyntaxMarker(token, endToken, `Unexpected "{% ${keyword} %}" — no matching opening tag`));
            } else {
                const expectedCloser = PAIRED_TAG_CLOSERS[top.keyword];
                if (expectedCloser !== keyword) {
                    markers.push(makeSyntaxMarker(
                        token, endToken,
                        `Unexpected "{% ${keyword} %}" — expected "{% ${expectedCloser} %}" to close "{% ${top.keyword} %}" (line ${top.startToken.line})`
                    ));
                }
            }
        }

        i = endIndex !== -1 ? endIndex : i;
    }

    for (const unclosed of openStack) {
        markers.push(makeSyntaxMarker(
            unclosed.startToken, unclosed.endToken,
            `Tag "{% ${unclosed.keyword} %}" is not closed — missing "{% ${PAIRED_TAG_CLOSERS[unclosed.keyword]} %}"`
        ));
    }

    return markers;
}

type EditorContext = { variables?: string[] };

function validate(editor: monaco.editor.IStandaloneCodeEditor, languageId: string, engine: string): void {
    const model = editor.getModel();
    if (!model) {
        return;
    }

    if (engine !== 'Twig') {
        monaco.editor.setModelMarkers(model, JSON_ERRORS_OWNER, languageId === 'json' ? collectPlainJsonErrorMarkers(model) : []);
        monaco.editor.setModelMarkers(model, UNKNOWN_VARIABLES_OWNER, []);
        monaco.editor.setModelMarkers(model, TWIG_SYNTAX_OWNER, []);
        return;
    }

    const twigVariables = ((editor.getRawOptions() as unknown) as EditorContext).variables ?? [];
    const result = tokenizeDocument(model.getValue());

    if (result.error) {
        monaco.editor.setModelMarkers(model, TWIG_SYNTAX_OWNER, [{
            severity: monaco.MarkerSeverity.Error,
            message: result.error.message,
            startLineNumber: result.error.line,
            startColumn: result.error.column,
            endLineNumber: result.error.line,
            endColumn: result.error.column + 1
        }]);
        monaco.editor.setModelMarkers(model, JSON_ERRORS_OWNER, []);
        monaco.editor.setModelMarkers(model, UNKNOWN_VARIABLES_OWNER, []);
        return;
    }

    monaco.editor.setModelMarkers(model, JSON_ERRORS_OWNER, languageId === 'json' ? collectJsonErrorMarkers(model, result.tokens) : []);
    monaco.editor.setModelMarkers(model, UNKNOWN_VARIABLES_OWNER, collectUnknownVariableMarkers(result.tokens, twigVariables));
    monaco.editor.setModelMarkers(model, TWIG_SYNTAX_OWNER, collectTwigSyntaxMarkers(result.tokens));
}

let jsonFeaturesDisabled = false;

function disableJsonFeatures(): void {
    if (jsonFeaturesDisabled) {
        return;
    }

    jsonFeaturesDisabled = true;
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({ validate: false });
    monaco.languages.json.jsonDefaults.setModeConfiguration({
        ...monaco.languages.json.jsonDefaults.modeConfiguration,
        documentFormattingEdits: false,
        documentRangeFormattingEdits: false,
        completionItems: false
    });
}

export function registerScriptValidation(
    editor: monaco.editor.IStandaloneCodeEditor,
    languageId: string,
    engine: string
): () => void {
    if (engine !== 'Twig' && languageId !== 'json') {
        return () => {};
    }

    if (languageId === 'json') {
        disableJsonFeatures();
    }

    const model = editor.getModel();
    if (!model) {
        return () => {};
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    const scheduleValidate = (): void => {
        clearTimeout(timer);
        timer = setTimeout(() => validate(editor, languageId, engine), DEBOUNCE_MS);
    };

    scheduleValidate();
    const subscription = model.onDidChangeContent(scheduleValidate);

    return () => {
        clearTimeout(timer);
        subscription.dispose();
        monaco.editor.setModelMarkers(model, JSON_ERRORS_OWNER, []);
        monaco.editor.setModelMarkers(model, UNKNOWN_VARIABLES_OWNER, []);
        monaco.editor.setModelMarkers(model, TWIG_SYNTAX_OWNER, []);
    };
}
