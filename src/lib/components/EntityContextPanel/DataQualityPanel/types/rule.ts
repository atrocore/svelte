/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

export type RuleDetail = {
    field: string,
    passed: boolean,
    label?: string | null,
}

/**
 * An active rule, as the metadata describes it in scopes.<Entity>.qualityCheckRules.
 */
export type RuleDefs = {
    id: string,
    name: string,
    number: number | string,
    scoreFactor: number,
    qualityCheckId: string,
}

/**
 * The stored result of a rule, as the record meta holds it in _meta.dataQuality.<checkId>.rules.
 */
export type RuleResult = {
    id: string,
    status: string | null,
    score: number | null,
    details: Array<RuleDetail>,
}

/**
 * The result of a check for the record, as the record meta holds it in _meta.dataQuality.<checkId>.
 */
export type CheckResult = {
    value: number,
    calculatedAt: string | null,
    rules: Array<RuleResult>,
}

/**
 * A rule the panel shows: its definition along with its result for the record, if it has one.
 */
export type PanelRule = {
    id: string,
    name: string,
    number: number | string,
    ruleScore: number,
    status: string | null,
    score: number | null,
    details: Array<RuleDetail>,
}
