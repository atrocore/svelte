/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

import { getBorder, getFontColor } from '$lib/helpers/color';
import type { CheckResult, PanelRule, RuleDefs, RuleResult } from '$lib/components/EntityContextPanel/DataQualityPanel/types/rule';

/**
 * Every active rule of the check, along with its stored result for the record. A rule without a result - the check
 * is not calculated yet, or the rule has been added since - gets no status.
 */
export function buildPanelRules(checkId: string, ruleDefsList: Array<RuleDefs>, result: CheckResult | null): Array<PanelRule> {
    const resultsById: Record<string, RuleResult> = {};
    for (const ruleResult of result?.rules || []) {
        resultsById[ruleResult.id] = ruleResult;
    }

    const rules: Array<PanelRule> = [];
    for (const ruleDefs of ruleDefsList) {
        if (ruleDefs.qualityCheckId !== checkId) {
            continue;
        }

        const ruleResult = resultsById[ruleDefs.id] || null;

        rules.push({
            id: ruleDefs.id,
            name: ruleDefs.name,
            number: ruleDefs.number,
            ruleScore: ruleDefs.scoreFactor,
            status: ruleResult?.status ?? null,
            score: ruleResult?.score ?? null,
            details: ruleResult?.details || [],
        });
    }

    return rules;
}

export function getValueStyle(value: number | null) {
    let backgroundColor = '#FFD6C9';
    if (value === null) {
        value = 0;
    }
    if (value > 0) {
        backgroundColor = '#FFE7D1';
    }
    if (value > 24) {
        backgroundColor = '#FEFFD6';
    }
    if (value > 49) {
        backgroundColor = '#FFF8B8';
    }
    if (value > 74) {
        backgroundColor = '#E0FFCC';
    }
    if (value === 100) {
        backgroundColor = '#CAF2C2';
    }

    let data: Record<string, any> = {
        cursor: 'pointer',
        'font-weight': 'normal',
        'background-color': backgroundColor,
        color: getFontColor(backgroundColor),
        border: getBorder(backgroundColor),
        padding: '4px 10px',
        fontSize: '100%'
    };

    if (value > 24) {
        data.display = 'block';
        data.width = `${value}%`;
    }

    return Object.entries(data).map(([k, v]) => `${k}: ${v}`).join('; ')
}

export function getStatusStyle(status: string | null, score: number | null = null) {
    let backgroundColor: string;
    if (score === null) {
        backgroundColor = status === 'passed' ? '#CAF2C2' : (status === 'failed' ? '#FFD6C9' : '#CCCCCC');
    } else if (score === 1) {
        backgroundColor = '#CAF2C2'; // green
    } else if (score === 0) {
        backgroundColor = '#FFD6C9'; // red
    } else {
        backgroundColor = '#FFF8B8'; // amber - same hex as the 50-74% tier in getValueStyle() above
    }
    return `background-color: ${backgroundColor};`
}