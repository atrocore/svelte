<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { createEventDispatcher, onMount, tick } from "svelte";
    import { Metadata } from '$lib/core/metadata';
    import { ApiClient } from '$lib/core/api-client';
    import { Language } from "$lib/core/language"
    import { Storage } from "$lib/core/storage";
    import { Notifier } from "$lib/dom/notifier";
    import { Acl } from "$lib/core/acl";
    import type Item from "$lib/components/EntityContextPanel/DataQualityPanel/types/item";
    import type ActiveQualityCheck from "$lib/components/EntityContextPanel/DataQualityPanel/types/active-quality-check";
    import type { CheckResult, PanelRule, RuleDefs } from "$lib/components/EntityContextPanel/DataQualityPanel/types/rule";
    import ContentFilter from "$lib/components/filters/FieldStateFilter/FieldStateFilter.svelte";
    import { buildPanelRules, getStatusStyle, getValueStyle } from "$lib/components/EntityContextPanel/DataQualityPanel/utils/data-quality-panel";

    const dispatch = createEventDispatcher();

    export let scope: string;
    export let id: string;
    export let fetchModel: () => void


    let qualityCheckSelect: HTMLSelectElement & { selectize?: any };
    let qualityChecksList: Array<Item> = [];
    let ruleDefsList: Array<RuleDefs> = Metadata.get(['scopes', scope, 'qualityCheckRules']) || [];
    let activeItem: string | null = null
    let loading: boolean = false
    // The results of every check for this record, keyed by quality check id - taken from the record meta.
    let allData: Record<string, CheckResult> | null = null
    let value: number | null = null
    let rules: Array<PanelRule> = []
    let selectedFilters: Array<string> = Storage.get('qualityCheckRuleFilters', scope) || []
    let filteredRules: Array<PanelRule> = []
    let highlightedCheckId: string | null = null

    $: {
        const reelFilers = selectedFilters.length === 0 ? ['passed', 'failed'] : selectedFilters
        filteredRules = rules.filter((rule: PanelRule) => rule.status !== null && reelFilers.includes(rule.status))
    }

    function onFilterChange(evt: CustomEvent, value: Array<string>) {
        selectedFilters = value
    }

    // The results come with the record in its meta - the record view broadcasts them every time the record is
    // loaded, so the panel makes no request of its own.
    function onQualityChecksDataLoaded(evt: Event) {
        const detail = (evt as CustomEvent).detail
        if (detail.entityName !== scope || detail.entityId !== id) {
            return
        }

        allData = detail.data || {}
        showActiveItem()
        loading = false
    }

    function showActiveItem() {
        const result: CheckResult | null = activeItem ? (allData?.[activeItem] || null) : null
        value = result ? result.value : null
        rules = activeItem ? buildPanelRules(activeItem, ruleDefsList, result) : []
    }

    // The record is fetched anew, and its meta brings the actual results.
    function reloadQualityChecksData() {
        loading = true
        fetchModel()
    }

    function getErrorMessage(rule: PanelRule): string | null {
        if (rule.status !== 'failed') {
            return null
        }

        const number = String(rule.number)
        const message = Language.translate(number, 'QualityCheckErrors', scope)

        return message && message !== number ? message : null
    }

    function selectActiveItem(value: string) {
        activeItem = value;
        showActiveItem()
    }

    function onRecordSave() {
        reloadQualityChecksData()
    }

    async function recalculateCheck() {
        if (!Acl.check(scope, 'edit')) {
            return;
        }

        Notifier.notify('Please wait...')
        try {
            const result = await ApiClient.post<CheckResult>(`/QualityCheck/${activeItem}/recalculate`, {
                entityId: id,
            });
            Notifier.notify('Done', 'success')
            // the record view puts the fresh result into the record meta and broadcasts it back
            window.dispatchEvent(new CustomEvent('record:quality-check-recalculated', {
                detail: {entityName: scope, entityId: id, checkId: activeItem, result: result}
            }))
        } catch {
            Notifier.notify('Error occurred', 'error')
        }
    }

    function onShowDetails(evt: Event) {
        const checkId = (evt as CustomEvent).detail.checkId
        const item = qualityChecksList.find(item => item.value === checkId)
        if (item) {
            activeItem = item.value
            qualityCheckSelect.selectize.setValue(activeItem)
            dispatch('show')
        }
    }

    function highlightCheck() {
        const el: HTMLSelectElement | null = document.querySelector(`.quality-check-highlighter[data-quality-check-id="${activeItem}"]`)
        if (el) {
            el.click()
        }
    }

    function onCheckHighlighted(evt: Event) {
        highlightedCheckId = (evt as CustomEvent).detail.checkId
    }

    function openQualityCheckPage(): void {
        window.open(`/#QualityCheck/view/${activeItem}`, "_blank");
    }

    onMount(() => {
        const checks: Record<string, ActiveQualityCheck> = Metadata.get(['scopes', scope, 'activeQualityChecks']) || {};

        for (const [checkId, check] of Object.entries(checks)) {
            qualityChecksList.push({
                value: checkId,
                text: check.name,
            });
        }

        if (qualityChecksList.length === 0) {
            return
        }

        window.addEventListener('record:quality-checks-data-loaded', onQualityChecksDataLoaded)
        window.addEventListener('record:save', onRecordSave);
        window.addEventListener('record:show-qc-details', onShowDetails)
        window.addEventListener('record:check-highlighted', onCheckHighlighted)

        activeItem = qualityChecksList[0].value;

        // the record may have been loaded before the panel got mounted
        loading = true
        window.dispatchEvent(new CustomEvent('record:quality-checks-data-request', {
            detail: {entityName: scope, entityId: id}
        }))

        tick().then(() => {
            window.$(qualityCheckSelect).selectize({
                valueField: 'value',
                labelField: 'text',
                searchField: ['text'],
                onChange: function (value: string) {
                    selectActiveItem(value)
                }
            });
        })

        return () => {
            window.removeEventListener('record:quality-checks-data-loaded', onQualityChecksDataLoaded)
            window.removeEventListener('record:save', onRecordSave)
            window.removeEventListener('record:show-qc-details', onShowDetails)
            window.removeEventListener('record:check-highlighted', onCheckHighlighted)
        }
    })

</script>

<div>
    <div style="margin-bottom: 10px">
        <select name="qualityChecks" bind:this={qualityCheckSelect}>
            {#each qualityChecksList as check}
                <option value="{check.value}">{check.text}</option>
            {/each}
        </select>
    </div>

    {#if allData}
         <span style="{getValueStyle(value)}" on:click={recalculateCheck}
               class="colored-enum label" title="{Language.translate('recalculate','labels','QualityCheck')}"
               aria-expanded="false">{value === null ? '...' : (value + '%')}</span>
    {/if}

    {#if loading}
        <div style="text-align: center;margin-top: 10px">
            <img style="width: 40px; " class="preloader" src="client/img/atro-loader.svg" alt="loader">
        </div>
    {:else if allData}
        <div style="margin-top: 10px;">
            <div style="margin-bottom: 10px; overflow: hidden; padding-left: 1px; padding-right: 1px;">
                <ContentFilter allFilters="{['passed','failed','skipped']}" scope="{scope}"
                               storageKey="qualityCheckRuleFilters" buttonClass="small"
                               translationScope="QualityCheckRule" translationField="status"
                               titleLabel="" onExecute="{onFilterChange}"
                               style="padding-bottom: 10px; display: inline-block"/>

                <div style="float: right; display: flex; gap: 10px">
                    <button on:click={highlightCheck} class="small"
                            title="{Language.translate('highlight', 'labels', 'QualityCheck')}">
                        <i class="ph ph-highlighter" class:ph-fill={highlightedCheckId === activeItem}
                           class:highlight-active={highlightedCheckId === activeItem}></i>
                    </button>
                    <button class="small refresh" on:click={reloadQualityChecksData}
                            title="{Language.translate('Refresh')}">
                        <i class="ph ph-arrows-clockwise"></i>
                    </button>
                    {#if Acl.check('QualityCheck', 'edit')}
                        <button class="small refresh" on:click={openQualityCheckPage}
                                title="{Language.translate('Edit')}">
                            <i class="ph ph-pencil-simple"></i>
                        </button>
                    {/if}
                </div>
            </div>
            {#each filteredRules as rule}
                <div class="rule-container">
                    <div class="rule-status" style="{getStatusStyle(rule.status, rule.score)}"></div>
                    <div style="flex-grow: 1">
                        <div>
                            {#if Acl.check('QualityCheckRule', 'edit')}
                                <a class="rule-edit-icon pull-right" href="{`/#QualityCheckRule/view/${rule.id}`}"
                                   target="_blank" style="color: #333"
                                   title="{Language.translate('Edit')}">
                                    <i class="ph ph-pencil-simple"></i>
                                </a>
                            {/if}
                        </div>
                        <p style="{rule.details?.length ? 'font-weight: bold' : ''}"
                           title="{rule.score !== null ? (Math.round(rule.score * rule.ruleScore * 100) / 100) + ' / ' + rule.ruleScore : ''}">{rule.name}</p>
                        {#if rule.details?.length}
                            <div class="rule-children">
                                {#each rule.details as child}
                                    <div class="rule-container rule-child">
                                        <div class="rule-status"
                                             style="{getStatusStyle(child.passed ? 'passed' : 'failed', child.passed ? 1 : 0)}"></div>
                                        <p>{child.label || Language.translate(child.field, 'fields', scope) || child.field}</p>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                        {#if getErrorMessage(rule)}
                            <p class="rule-error">{getErrorMessage(rule)}</p>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    {/if}

</div>

<style>
    .rule-container {
        margin-bottom: 10px;
        display: flex;
    }

    .rule-container .rule-edit-icon {
        visibility: hidden;
    }

    .rule-container:hover .rule-edit-icon {
        visibility: visible;
    }

    .rule-status {
        width: 11px;
        height: 11px;
        border-radius: 50%;
        flex-shrink: 0;
        margin: 5px 10px 0 0;
    }

    .rule-error {
        background: #ffeded;
        padding: 5px;
        border-radius: 3px;
        border: 1px solid #e9c8c8;
        overflow-wrap: break-word;
        word-break: break-word;
    }

    .rule-children {
        margin-top: 4px;
    }

    .rule-child p {
        font-weight: normal;
    }

    .rule-child .rule-status {
        width: 8px;
        height: 8px;
    }

    .highlight-active {
        color: #06c;
    }
</style>