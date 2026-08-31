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

export type MemberDefinition = {
    label: string;
    signature: string;
    insertText: string;
    documentation: string;
};

/**
 * Variable name to object type.
 *
 * The backend contract lives in the context classes, whose public properties are exactly
 * the variables an expression may use:
 *   Atro\Core\ExpressionLanguage\Compiled\ActionConditionContext
 *   Workflows\Core\ExpressionLanguage\Compiled\WorkflowConditionContext
 *
 * Variables absent from this map are not objects — uiRecord and uiRecordFrom are arrays,
 * accessed as uiRecord['field'], and uiRecordFromName and importJobId are strings.
 */
const VARIABLE_TYPES: Record<string, string> = {
    entity: 'Entity',
    user: 'Entity'
};

/**
 * Deliberately minimal: a dot compiles to a method call, so every public method of the ORM
 * entity works in an expression, but only these are worth suggesting. Mutators (set, clear),
 * ORM internals (setAsFetched, skipValidation) and introspection (getAttributeList, toArray)
 * are left out — a condition has no business calling them.
 */
const ENTITY_MEMBERS: MemberDefinition[] = [
    {
        label: 'get',
        signature: "get('field')",
        insertText: "get('${1:field}')",
        documentation: 'The value of an attribute or field'
    },
    {
        label: 'has',
        signature: "has('field')",
        insertText: "has('${1:field}')",
        documentation: 'Whether the attribute is set on the record'
    },
    {
        label: 'isAttributeChanged',
        signature: "isAttributeChanged('field')",
        insertText: "isAttributeChanged('${1:field}')",
        documentation: 'Whether the value differs from the one loaded from the database'
    },
    {
        label: 'isNew',
        signature: 'isNew()',
        insertText: 'isNew()',
        documentation: 'Whether the record is being created'
    }
];

const TYPE_MEMBERS: Record<string, MemberDefinition[]> = {
    Entity: ENTITY_MEMBERS
};

function resolveMembers(variable: string): MemberDefinition[] {
    const type = VARIABLE_TYPES[variable];

    return type ? TYPE_MEMBERS[type] ?? [] : [];
}

export function buildMemberSuggestions(variable: string, range: monaco.IRange): monaco.languages.CompletionItem[] {
    let order = 100;

    return resolveMembers(variable).map((member) => ({
        label: member.label,
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: member.insertText,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: member.signature,
        documentation: member.documentation,
        range,
        sortText: String(order++)
    }));
}

export function findMember(variable: string, member: string): MemberDefinition | null {
    return resolveMembers(variable).find((item) => item.label === member) ?? null;
}
