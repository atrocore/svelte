<script lang="ts">
    import { createEventDispatcher, onMount, tick } from "svelte";
    import { Metadata } from '$lib/core/metadata';
    import { Config } from '$lib/core/config';
    import { ApiClient } from '$lib/core/api-client';
    import { Language } from "$lib/core/language"
    import { Storage } from "$lib/core/storage";
    import { Notifier } from "$lib/core/notifier";
    import { Acl } from "$lib/core/acl";
    import type Item from "$lib/components/EntityContextPanel/DataQualityPanel/types/item";
    import ContentFilter from "$lib/components/filters/FieldStateFilter/FieldStateFilter.svelte";
    import { getStatusStyle, getValueStyle } from "$lib/components/EntityContextPanel/DataQualityPanel/utils/data-quality-panel";

    const dispatch = createEventDispatcher();

    export let scope: string;
    export let id: string;
    export let fetchModel: () => void


    let qualityCheckSelect: HTMLSelectElement & { selectize?: any };
    let qualityChecksList: Array<Item> = [];
    let activeItem: string | null = null
    let loading: boolean = false
    let data: any = null
    let selectedFilters: Array<string> = Storage.get('qualityCheckRuleFilters', scope) || []
    let filteredRules: Array<any> = []
    let highlightedCheckId: string | null = null

    $: {
        const reelFilers = selectedFilters.length === 0 ? ['passed', 'failed'] : selectedFilters
        filteredRules = (data?.rules || []).filter((rule: any) => reelFilers.includes(rule.status))
    }

    function onFilterChange(evt: CustomEvent, value: Array<string>) {
        selectedFilters = value
    }

    async function loadQualityCheckData(reload = false) {
        loading = true
        if (!reload) {
            data = null
        }

        try {
            data = await ApiClient.get(`/QualityCheck/${activeItem}/entityData`, {
                entityName: scope,
                entityId: id
            });
        } catch {
            data = null;
            Notifier.notify('Error occurred', 'error');
        }

        loading = false
    }

    function onRecordSave(evt: any) {
        loadQualityCheckData(true)
    }

    async function recalculateCheck() {
        if (!Acl.check(scope, 'edit')) {
            return;
        }

        Notifier.notify('Please wait...')
        try {
            await ApiClient.post(`/QualityCheck/${activeItem}/recalculate`, {
                entityId: id,
            });
            Notifier.notify('Done', 'success')
            fetchModel()
            await loadQualityCheckData(true)
        } catch {
            Notifier.notify('Error occurred', 'error')
        }
    }

    function onCheckRecalculated(evt: Event) {
        if ((evt as CustomEvent).detail.field === qualityChecksList.find(item => item.value === activeItem)?.field) {
            loadQualityCheckData()
        }
    }

    function onShowDetails(evt: Event) {
        const item = qualityChecksList.find(item => item.field === (evt as CustomEvent).detail.field)
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
        const forbiddenFields: Array<string> = Acl.getScopeForbiddenFieldList(scope, 'read') || [];

        Object.entries(Metadata.get(['entityDefs', scope, 'fields'])).forEach(([field, defs]: [string, any]) => {
            if (defs.dataQualityCheck) {
                let text: string = '';
                Object.entries(Config.get('referenceData').QualityCheck).forEach(([key, check]: [string, any]) => {
                    if (check.id === defs.qualityCheckId) {
                        text = check.name;
                    }
                });

                if (!forbiddenFields.includes(field)) {
                    qualityChecksList.push({
                        value: defs.qualityCheckId,
                        text: text,
                        field: field,
                    });
                }
            }
        });

        if (qualityChecksList.length === 0) {
            return
        }

        window.addEventListener('record:save', onRecordSave);
        window.addEventListener('record:check-recalculated', onCheckRecalculated)
        window.addEventListener('record:show-qc-details', onShowDetails)
        window.addEventListener('record:check-highlighted', onCheckHighlighted)

        activeItem = qualityChecksList[0].value;

        loadQualityCheckData()

        tick().then(() => {
            window.$(qualityCheckSelect).selectize({
                valueField: 'value',
                labelField: 'text',
                searchField: ['text'],
                onChange: function (value: string) {
                    activeItem = value
                    loadQualityCheckData()
                }
            });
        })

        return () => {
            window.removeEventListener('record:save', onRecordSave)
            window.removeEventListener('record:check-recalculated', onCheckRecalculated)
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

    {#if data }
         <span style="{getValueStyle(data.value)}" on:click={recalculateCheck}
               class="colored-enum label" title="{Language.translate('recalculate','labels','QualityCheck')}"
               aria-expanded="false">{data.value === null ? '...' : (data.value === -1 ? Language.translate('N/A') : (data.value + '%'))}</span>
    {/if}

    {#if loading}
        <div style="text-align: center;margin-top: 10px">
            <img style="width: 40px; " class="preloader" src="client/img/atro-loader.svg" alt="loader">
        </div>
    {:else if data}
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
                        <i class="{'ph ph-highlighter '+ (highlightedCheckId===activeItem ? 'ph-fill highlight-active': '')}"></i>
                    </button>
                    <button class="small refresh" on:click={()=>loadQualityCheckData(true)}
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
                    <div class="rule-status" style="{getStatusStyle(rule.status)}"></div>
                    <div style="flex-grow: 1">
                        <div>
                            <label class="control-label">
                                <span class="label-text">{rule.code}</span>
                            </label>
                            {#if Acl.check('QualityCheckRule', 'edit')}
                                <a class="rule-edit-icon pull-right" href="{`/#QualityCheckRule/view/${rule.id}`}"
                                   target="_blank" style="color: #333"
                                   title="{Language.translate('Edit')}">
                                    <i class="ph ph-pencil-simple"></i>
                                </a>
                            {/if}
                        </div>
                        <p>{rule.name}</p>
                        {#if rule.error}
                            <p class="rule-error">{rule.error}</p>
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

    .control-label {
        color: var(--label-color);
        font-size: 12px;
        font-weight: normal;
    }

    .rule-error {
        background: #ffeded;
        padding: 5px;
        border-radius: 3px;
        border: 1px solid #e9c8c8;
    }

    .highlight-active {
        color: #06c;
    }
</style>