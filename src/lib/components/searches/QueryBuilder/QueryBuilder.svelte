<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { onMount, tick } from "svelte";
    import { Metadata } from '$lib/core/metadata';
    import { Storage } from "$lib/core/storage";
    import type Rule from "./types/rule";
    import { Acl } from "$lib/core/acl";
    import { Language } from "$lib/core/language"
    import { Notifier } from "$lib/dom/notifier";
    import { UserData } from "$lib/core/user-data";
    import { ApiClient } from '$lib/core/api-client';
    import SavedSearch from "$lib/components/filters/SavedSearch/SavedSearch.svelte";
    import GeneralFilter from "$lib/components/filters/GeneralFilter/GeneralFilter.svelte";
    import { getSavedSearchStore } from "$lib/stores/saved-search.store";
    import { getGeneralFilterStore } from '$lib/stores/general-filter.store'
    import { Config } from '$lib/core/config';
    import Collapser from "$lib/components/collapsers/Collapser/Collapser.svelte";
    import { get } from "svelte/store";

    export let scope: string;
    export let searchManager: any;
    export let createView: (name: string, view: string, options: Record<string, any>, callback: (view: any) => void) => void;
    export let uniqueKey: string = 'default';

    let filters: Array<any> = [];
    let deletedFilterIds = new Set<string>();

    let queryBuilderElement: HTMLElement

    let model = new searchManager.collection.model();

    let advancedFilterChecked = false;

    let generalFilterOpened: boolean = false;

    let savedFiltersOpened: boolean = true;

    let queryBuilderOpened: boolean = true;

    let editingSavedSearch: any = null;

    let oldAdvancedFilter: any = null;

    let showUnsetAll: boolean = false;

    let advancedFilterDisabled: boolean;

    let queryBuilderRulesChanged: boolean = false;

    let hideRowAction: boolean = false;

    let hasQbRules: boolean = false;
    let syncingFromStore: boolean = false;

    let isQbValid: boolean = false;

    let defaultValue = "-1";

    let generalFilterStore = getGeneralFilterStore(uniqueKey);

    const treeNodeRulesStore = generalFilterStore.treeNodeRules;
    let applicableTreeRulesCount: number = 0;
    $: hasTreeNodeRules = applicableTreeRulesCount > 0;

    let savedSearchStore = getSavedSearchStore(scope, uniqueKey, {
        items: searchManager.savedSearchList || [],
        selectedItems: searchManager.getSavedFilters().map((v: any) => v.id)
    });

    generalFilterStore.advancedFilterChecked.set(searchManager.isQueryBuilderApplied());

    const selectSavedSub = savedSearchStore.selectedSavedItemIds.subscribe(_ => {
        refreshShowUnsetAll();
    });

    const selectBoolSub = generalFilterStore.selectBoolFilters.subscribe(_ => {
        refreshShowUnsetAll();
    });

    const advancedFilterCheckedSub = generalFilterStore.advancedFilterChecked.subscribe((value) => {
        advancedFilterChecked = value;
        refreshShowUnsetAll();
    });

    function updateSearchManager(data: any) {
        searchManager.update((window as any).Espo.utils.cloneDeep(data));
        refreshAdvancedFilterDisabled();
    }

    function camelCaseToHyphen(str: string) {
        return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    }

    function hyphenToCamelCase(str: string): string {
        if (str === null || str === undefined) {
            return "";
        }
        return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    }

    function underscoreToCamelCase(str: string) {
        if (str === null || str === undefined) {
            return "";
        }
        return str.replace(/[-_]([a-z])/g, (_, letter) => letter.toUpperCase());
    }

    function getRulesIds(rules: Rule[]) {
        let ids: string[] = [];
        rules.forEach(rule => {
            if (rule.rules) {
                getRulesIds(rule.rules).forEach(innerId => {
                    ids.push(innerId);
                });
            } else if (rule.id) {
                ids.push(rule.id);
            }
        })

        return ids;
    }

    function initQueryBuilderFilter() {
        const $queryBuilder = window.$(queryBuilderElement)
        let rules = searchManager.getQueryBuilder() || [];

        if (typeof rules === 'object' && !rules.condition) {
            rules = [];
        }

        const emptyAttribute = 'emptyAttributeRule';

        let filterPerGroups: Record<string, any[]> = {};
        for (const filter of filters) {
            let group = filter.optgroup ?? 'default'
            filterPerGroups[group] = filterPerGroups[group] ?? [];
            filterPerGroups[group].push(filter);
        }

        for (const filterPerGroupsKey in filterPerGroups) {
            filterPerGroups[filterPerGroupsKey].sort(function (v1: any, v2: any) {
                return v1.label.localeCompare(v2.label);
            });
        }

        if (hasAttribute()) {
            let attributeButton = {
                id: emptyAttribute,
                label: `[ ${Language.translate('addAttribute')} ]`,
                type: 'boolean',
                optgroup: Language.translate('Attributes'),
                operators: ['equal',],
                input: 'radio',
                values: {
                    0: 'false'
                }
            };
            if (!filterPerGroups[Language.translate('Attributes')]) {
                filterPerGroups[Language.translate('Attributes')] = [attributeButton]
            } else {
                filterPerGroups[Language.translate('Attributes')] = filterPerGroups[Language.translate('Attributes')].filter((v: any) => v.id !== attributeButton.id)
                filterPerGroups[Language.translate('Attributes')].unshift(attributeButton);
            }
        }


        filters = [
            ...(filterPerGroups[Language.translate('Attributes')] ?? []),
            ...(filterPerGroups['default'] ?? []),
            ...(filterPerGroups[Language.translate('Fields')] ?? []),
        ]

        if (filters.length === 0) {
            return;
        }

        $queryBuilder.on('afterCreateRuleInput.queryBuilder', function (e: any, rule: any) {
            if (rule.data?.disabled) {
                rule.$el.find('.rule-toggle').removeClass('active');
                rule.$el.find('.rule-toggle i').removeClass('ph-toggle-right').addClass('ph-toggle-left');
            }
        });

        $queryBuilder.on('afterCreateRuleGroup.queryBuilder', function (e: any, group: any) {
            if (group.data?.disabled) {
                group.$el.find('.rule-toggle').removeClass('active');
                group.$el.find('.rule-toggle i').removeClass('ph-toggle-right').addClass('ph-toggle-left');
            }
        });

        $queryBuilder.on('click', '.rule-toggle', function (e: any) {
            if (window.$(e.currentTarget).hasClass('disabled')) return;
            const $el = window.$(e.currentTarget)
            let disabled

            if ($el.hasClass('active')) {
                $el.removeClass('active').find('i').removeClass('ph-toggle-right').addClass('ph-toggle-left')
                disabled = true;
            } else {
                $el.addClass('active').find('i').removeClass('ph-toggle-left').addClass('ph-toggle-right')
                disabled = false;
            }

            let rule = window.$(queryBuilderElement).queryBuilder('getModel', document.getElementById($el.data('id')));
            if (rule) {
                if (!rule.data) {
                    rule.data = {}
                }
                if (disabled) {
                    rule.data.disabled = disabled
                } else {
                    delete rule.data.disabled;
                    tick().then(() => markDeletedFieldRules($queryBuilder));
                }
                queryBuilderRulesChanged = true;
            }
        })

        $queryBuilder.queryBuilder({
            uniqueKey: uniqueKey,
            allow_empty: true,
            select_placeholder: Language.translate('filterPlaceHolder'),
            operators: [
                {type: 'contains'},
                {type: 'not_contains'},
                {type: 'begins_with'},
                {type: 'ends_with'},
                {type: 'equal'},
                {type: 'not_equal'},
                {type: 'less'},
                {type: 'less_or_equal'},
                {type: 'greater'},
                {type: 'greater_or_equal'},
                {type: 'between'},
                {type: 'in'},
                {type: 'not_in'},
                {type: 'is_null'},
                {type: 'is_not_null'},
                {type: 'is_me', nb_inputs: 0, apply_to: ['string']},
                {type: 'is_not_me', nb_inputs: 0, apply_to: ['string']},
                {type: 'is_team_member', nb_inputs: 0, apply_to: ['string']},
                {type: 'include_me', nb_inputs: 0, apply_to: ['string']},
                {type: 'exclude_me', nb_inputs: 0, apply_to: ['string']},
                {type: 'is_my_team', nb_inputs: 0, apply_to: ['string']},
                {type: 'is_not_my_team', nb_inputs: 0, apply_to: ['string']},
                {type: 'linked_with', nb_inputs: 1, multiple: true, apply_to: ['string']},
                {type: 'not_linked_with', nb_inputs: 1, multiple: true, apply_to: ['string']},
                {type: 'array_any_of', nb_inputs: 1, multiple: true, apply_to: ['string']},
                {type: 'array_none_of', nb_inputs: 1, multiple: true, apply_to: ['string']},
                {type: 'is_linked', nb_inputs: 0, apply_to: ['string']},
                {type: 'is_not_linked', nb_inputs: 0, apply_to: ['string']},
                {type: 'is_attribute_linked', nb_inputs: 0, apply_to: ['string']},
                {type: 'is_attribute_not_linked', nb_inputs: 0, apply_to: ['string']},
                {type: 'last_x_days', nb_inputs: 1, apply_to: ['date', 'datetime', 'number']},
                {type: 'next_x_days', nb_inputs: 1, apply_to: ['date', 'datetime']},
                {type: 'older_than_x_days', nb_inputs: 1, apply_to: ['date', 'datetime']},
                {type: 'after_x_days', nb_inputs: 1, apply_to: ['date', 'datetime']},
                {type: 'current_month', nb_inputs: 0, apply_to: ['date', 'datetime']},
                {type: 'last_month', nb_inputs: 0, apply_to: ['date', 'datetime']},
                {type: 'next_month', nb_inputs: 0, apply_to: ['date', 'datetime']},
                {type: 'current_year', nb_inputs: 0, apply_to: ['date', 'datetime']},
                {type: 'last_year', nb_inputs: 0, apply_to: ['date', 'datetime']},
                {type: 'future', nb_inputs: 0, apply_to: ['date', 'datetime']},
                {type: 'past', nb_inputs: 0, apply_to: ['date', 'datetime']},
                {type: 'today', nb_inputs: 0, apply_to: ['date', 'datetime']},
                {type: 'similar', nb_inputs: 1, apply_to: ['string']},
                {type: 'word_similar', nb_inputs: 1, apply_to: ['string']},
                ...(Metadata.get(['app', 'queryBuilderOperators']) || []),
            ],
            rules: rules,
            filters: filters,
            plugins: {
                sortable: {
                    disable_template: true
                },
            },
            icons: {
                error: 'ph ph-warning-circle',
                remove_rule: 'ph ph-x',
                remove_group: 'ph ph-x',
            },
            templates: {
                group: ({group_id, level, conditions, icons, settings, translate, builder}: any) => `
                    <div id="${group_id}" class="rules-group-container">
                      <div class="rules-group-header">
                        ${level > 1 ? `
                          <div class="group-header-top drag-handle">
                            <span class="rule-toggle active" data-id="${group_id}"><i class="ph-fill ph-toggle-right"></i></span>
                            <div class="rule-header-right">
                              ${settings.display_errors ? `<div class="error-container"><i class="${icons.error}"></i></div>` : ''}
                              <button type="button" class="btn rule-delete" data-delete="group">
                                <i class="${icons.remove_group}"></i>
                              </button>
                            </div>
                          </div>
                        ` : ''}
                        <div class="group-header-center">
                          <div class="btn-group group-conditions">
                            ${conditions.map((condition: any) => `
                              <label class="btn btn-sm btn-default">
                                <input type="radio" name="${group_id}_cond" value="${condition}"> ${translate("conditions", condition)}
                              </label>
                            `).join('\n')}
                          </div>
                          <div class="button-group group-actions">
                            <button type="button" class="small" title="${translate("add_rule")}" data-add="rule">
                              <i class="ph ph-plus"></i>
                            </button>
                            ${settings.allow_groups === -1 || settings.allow_groups >= level ? `
                              <button type="button" class="small" title="${translate("add_group")}" data-add="group">
                                <i class="ph ph-brackets-square"></i>
                              </button>
                            ` : ''}
                          </div>
                        </div>
                      </div>
                      <div class=rules-group-body>
                        <div class=rules-list></div>
                      </div>
                    </div>
                `,
                rule: ({rule_id, icons, settings, translate, builder}: any) => `
                    <div id="${rule_id}" class="rule-container">
                      <div class="rule-header drag-handle">
                        <span class="rule-toggle active" data-id="${rule_id}"><i class="ph-fill ph-toggle-right"></i></span>
                        <div class="rule-header-right">
                          ${settings.display_errors ? `<div class="error-container"><i class="${icons.error}"></i></div>` : ''}
                          <button type="button" class="btn rule-delete" data-delete="rule">
                            <i class="${icons.remove_rule}"></i>
                          </button>
                        </div>
                      </div>
                      <div class="rule-container-group">
                        <div class="rule-filter-container"></div>
                        <div class="rule-operator-container"></div>
                        <div class="rule-value-container"></div>
                      </div>
                    </div>
                `
            }

        });

        const rulesObj = $queryBuilder[0].queryBuilder.getRules({allow_invalid: true});

        if (rulesObj && rulesObj.rules) {
            hasQbRules = rulesObj.rules.length > 0;
            isQbValid = rulesObj.valid;

            if (!hasQbRules) {
                handleEmptyRules();
            }

            if (rulesObj.rules.length < 2) {
                $queryBuilder.children('.rules-group-container').children('.rules-group-header').find('.group-conditions .btn').addClass('disabled');
            }
        }

        markTreeNodeRuleToggles();
        tick().then(() => markDeletedFieldRules($queryBuilder));
        model.trigger('afterInitQueryBuilder');

        $queryBuilder.on('rulesChanged.queryBuilder', async (e: any, rule: any) => {
            try {
                $queryBuilder.queryBuilder('validate');
            } catch (e) {
            }

            queryBuilderRulesChanged = true;

            await tick();

            $queryBuilder.find('.rule-filter-container select:not(.selectized)').selectize({
                onFocus: function () {
                    if (this.getValue() === defaultValue) {
                        this.clear();
                    }
                },

                onBlur: function () {
                    if (!this.getValue()) {
                        this.setValue("-1")
                    }
                }
            });
            $queryBuilder.find('.rule-operator-container select:not(.selectized)').selectize();

            const rulesObj = $queryBuilder[0].queryBuilder.getRules({allow_invalid: true});
            if (rulesObj) {
                hasQbRules = rulesObj.rules && rulesObj.rules.length > 0;
                isQbValid = rulesObj.valid;

                if (!hasQbRules) {
                    handleEmptyRules();
                }
            }

            model.trigger('rulesChanged', rule);
        });

        $queryBuilder.on('afterUpdateRuleOperator.queryBuilder', (e: any, rule: any) => {
            model.trigger('afterUpdateRuleOperator', rule);
            if (['array'].includes(rule?.filter?.realType)) {
                let operator = rule.operator?.type;
                if (!rule.data) {
                    rule.data = {};
                }
                if (operator === 'is_null') {
                    rule.data['operatorType'] = 'arrayIsEmpty'
                }

                if (operator === 'is_not_null') {
                    rule.data['operatorType'] = 'arrayIsNotEmpty'
                }
            }
        });

        $queryBuilder.on('beforeUpdateRuleFilter.queryBuilder', function (this: any, e: any, rule: any, previousFilter: any) {
            let qb = window.$(this)[0].queryBuilder;
            if (qb.settings.uniqueKey !== uniqueKey) {
                e.preventDefault();
            }

            if (rule.filter && rule.filter.id === 'emptyAttributeRule') {
                e.preventDefault();
                addAttributeFilter((pushed, newFilters) => {
                    if (pushed) {
                        qb.setFilters(filters);
                    }
                    if (newFilters) {
                        rule.filter = newFilters[0];
                        if (newFilters.length > 1) {
                            for (const newFilter of newFilters) {
                                if (newFilter.id === rule.filter.id) {
                                    continue;
                                }

                                let r = qb.addRule(rule.parent);
                                r.filter = newFilter;
                            }
                        }
                    }
                    if (!rule.filter || rule.filter.id === 'emptyAttributeRule') {
                        rule.filter = previousFilter;
                        previousFilter = null
                        qb.updateRuleFilter(rule, previousFilter);
                        rule.$el.find('.rule-filter-container select')[0].selectize.setValue(rule.filter ? rule.filter.id : null);
                    } else {
                        qb.updateRuleFilter(rule, previousFilter);
                    }
                })
            } else {
                model.trigger('beforeUpdateRuleFilter', rule);
            }
        });

        $queryBuilder.on('afterUpdateRuleFilter.queryBuilder', async (e: any, rule: any) => {
            await tick();
            if (rule.$el) {
                rule.$el.find('.rule-operator-container select:not(.selectized)').selectize();
            }

            model.trigger('afterUpdateRuleFilter', rule);
        });

        $queryBuilder.on('afterSetRules.queryBuilder', (e: any, rule: any) => {
            model.trigger('afterInitQueryBuilder');
            markTreeNodeRuleToggles();
            tick().then(() => markDeletedFieldRules($queryBuilder));
        });

        $queryBuilder.on('afterAddGroup.queryBuilder', (e: any, rule: any) => {
            model.trigger('afterAddGroup', rule);
        });

        $queryBuilder.on('afterAddRule.queryBuilder', async (e: any, rule: any) => {
            await tick();
            if (rule.$el) {
                if (isTreeNodeRule(rule)) {
                    rule.$el.addClass('tree-node-rule');
                    rule.$el.find('.rule-header').removeClass('drag-handle');
                }
                rule.$el.find('.rule-filter-container select:not(.selectized)').selectize({
                    onFocus: function () {
                        if (this.getValue() === defaultValue) {
                            this.clear();
                        }
                    },
                    onBlur: function () {
                        if (!this.getValue()) {
                            this.setValue("-1")
                        }
                    }
                });

            }

            model.trigger('afterAddRule', rule);
        });
    }

    function getFieldOrAttributeId(field: string) {
        let id = field;
        let parts = field.split('_')
        if (parts.length >= 2 && ['attr', 'unitattr'].includes(parts[0])) {
            id = parts[1];
            const endings = ["From", "To", "UnitId", "PrefixId", "Id"];
            for (const ending of endings) {
                if (id.endsWith(ending)) {
                    id = id.slice(0, -ending.length);
                    break;
                }
            }
        }
        return id;
    }

    function prepareFilters(callback: () => void): void {

        filters = filters.filter(item => item.id.includes('attr_'));
        deletedFilterIds.clear();

        let promiseList: Promise<void>[] = [];

        Object.entries(Metadata.get(['entityDefs', scope, 'fields'])).forEach(([field, fieldDefs]: [string, any]) => {
            if (fieldDefs.filterDisabled || fieldDefs.virtualField) {
                return;
            }

            const fieldType = camelCaseToHyphen(fieldDefs.type);
            let view = fieldDefs.view || Metadata.get(['fields', fieldDefs.type, 'view']) || `views/fields/${fieldType}`;
            if (fieldDefs.filterType) {
                view = Metadata.get(['fields', fieldDefs.filterType, 'view']) || `views/fields/${fieldDefs.filterType}`;
            }

            promiseList.push(new Promise(resolve => {
                createView('qb_' + field, view, {
                    name: field,
                    model: model,
                    defs: {
                        name: field,
                        params: {
                            attribute: null
                        }
                    },
                }, view => {
                    let filter = view.createQueryBuilderFilter(fieldDefs.filterType || fieldDefs.type);
                    if (filter) {
                        filters.push(filter);
                    }
                    resolve();
                });
            }));

        });


        const rules = searchManager.getQueryBuilder();

        /**
         * Load attributes filters
         */
        if (rules.rules) {
            promiseList.push(new Promise(resolve => {
                let attributesIds: string[] = [];
                getRulesIds(rules.rules).forEach(id => {
                    if (id.includes('attr_')) {
                        attributesIds.push(getFieldOrAttributeId(id));
                    }
                });

                if (attributesIds.length > 0) {
                    const where = [{attribute: 'id', type: 'in', value: attributesIds}];
                    const queryString = window.$.param({where});
                    ApiClient.get<any>(`Attribute?${queryString}`).then((attrs: any) => {
                        getRulesIds(rules.rules).forEach((id: string) => {
                            if (id.includes('attr_')) {
                                const attrId = getFieldOrAttributeId(id);
                                if (!attrs.list.find((v: any) => v.id === attrId) && !filters.find((f: any) => f.id === id)) {
                                    filters.push(makeDeletedFilter(id));
                                }
                            }
                        });

                        if (attrs.list.length) {
                            let resolved: string[] = []
                            attrs.list.forEach((attribute: any) => {
                                pushAttributeFilter(attribute, (pushed, filter) => {
                                    resolved.push(attribute.id);
                                    if (resolved.length === attrs.list.length) {
                                        resolve();
                                    }
                                })
                            });
                        } else {
                            resolve();
                        }
                    });
                } else {
                    resolve();
                }
            }));
        }

        Promise.all(promiseList).then(() => {
            const savedRules = searchManager.getQueryBuilder();
            if (savedRules.rules) {
                getRulesIds(savedRules.rules).forEach((id: string) => {
                    if (!filters.find((f: any) => f.id === id)) {
                        filters.push(makeDeletedFilter(id));
                    }
                });
            }

            callback();

            const $queryBuilder = window.$(queryBuilderElement);
            $queryBuilder.find('.rule-filter-container select').selectize({
                onFocus: function () {
                    if (this.getValue() === defaultValue) {
                        this.clear();
                    }
                },
                onBlur: function () {
                    if (!this.getValue()) {
                        this.setValue("-1")
                    }
                }
            });
            $queryBuilder.find('.rule-operator-container select').selectize();
            tick().then(() => markDeletedFieldRules($queryBuilder));
        });
    }


    function clearScopeTreeRules() {
        const current = get(treeNodeRulesStore);
        generalFilterStore.treeNodeRules.set(current.filter((r: any) => r.data?._scope && r.data._scope !== scope));
    }

    function resetFilter() {
        if (advancedFilterDisabled) {
            return;
        }
        advancedFilterChecked = false;
        handleAdvancedFilterChecked(false)
        updateSearchManager({
            queryBuilder: [],
            advanced: []
        });
        window.$(queryBuilderElement).queryBuilder('setRules', []);
        updateCollection();
        queryBuilderRulesChanged = false;
        clearScopeTreeRules();
    }

    function updateCollection() {
        Notifier.notify(Language.translate('loading', 'messages'));
        searchManager.fetchCollection();
    }

    function pushAttributeFilter(attribute: any, callback: (pushed: boolean, filters?: any[]) => void): void {
        let promises: Promise<any>[] = []
        let filterChanged = false;
        const fieldType = camelCaseToHyphen(attribute.type);
        const name = `attr_${attribute.id}`;
        const label = attribute.name;
        const params: any = {
            attribute
        }

        let createFieldView = (name: string, fieldType: string, label: string, params = {}, order = 0) => {
            return new Promise((resolve) => {
                let view = Metadata.get(['fields', attribute.type, 'view']) ?? `views/fields/${fieldType}`;
                if (attribute.type === 'script') {
                    view = `views/fields/${attribute.outputType}`
                }
                let exitingFilter = filters.find(f => f.id === name);
                if (exitingFilter) {
                    resolve(exitingFilter);
                } else {
                    createView(name, view, {
                        name: name,
                        model: model,
                        defs: {
                            name: name,
                            params: params
                        },
                    }, view => {
                        let filter = view.createQueryBuilderFilter(attribute.type);
                        if (filter) {
                            filter.label = label;
                            if (attribute.channelId) {
                                filter.label += ' / ' + attribute.channelName;
                            }
                            filter.optgroup = Language.translate('Attributes');
                            filter.order = order;
                            filter.operators.unshift('is_attribute_not_linked');
                            filter.operators.unshift('is_attribute_linked');
                            if (!filters.find(f => f.id === name)) {
                                filters.push(filter);
                                filterChanged = true;
                                resolve(filter)
                            }
                        }
                    });
                }
            });
        };

        if (['rangeInt', 'rangeFloat'].includes(attribute.type)) {
            let type = attribute.type === 'rangeInt' ? 'int' : 'float';
            ['From', 'To'].forEach((v, key) => {
                let customLabel = label + ' ' + Language.translate(v);
                if (attribute.measureId) {
                    promises.push(createFieldView(name + v, type, customLabel + ' ' + Language.translate(`${type}Part`), params, key));
                } else {
                    promises.push(createFieldView(name + v, type, customLabel, params, key + 10));
                }
            })
        } else if (attribute.isMultilang && (Config.get('inputLanguageList') ?? []).length > 0) {
            let referenceData = Config.get('referenceData');
            if (referenceData && referenceData['Language']) {
                let languages = referenceData['Language'] || {};
                let i = 0;
                Object.keys(languages || {}).forEach((lang) => {
                    i++;
                    let currentLabel = label;
                    let currentName = name + '_' + underscoreToCamelCase(lang.toLowerCase());
                    if (languages[lang]['role'] !== 'main') {
                        currentLabel = currentLabel + ' / ' + languages[lang]['name']
                    }
                    promises.push(createFieldView(currentName, fieldType, currentLabel, params, i));
                });
            }
        } else {
            if (['int', 'float', 'varchar'].includes(attribute.type) && (attribute.measureId || attribute.prefixEnabled)) {
                promises.push(createFieldView(name, fieldType, label + ' ' + Language.translate(`${fieldType}Part`), params, 1));
            } else {
                promises.push(createFieldView(name, fieldType, label, params));
            }
        }

        if (attribute.measureId) {
            promises.push(createFieldView(name + 'UnitId', 'unit-link', label + ' (' + Language.translate('Unit') + ')', {
                ...params,
                type: 'unit',
                measureId: attribute.measureId
            }, 2));
        }

        if (attribute.prefixEnabled) {
            promises.push(createFieldView(name + 'PrefixId', 'link', label + ' (' + Language.translate('Prefix') + ')', {
                ...params,
                type: 'link',
                foreignScope: 'Prefix'
            }, 3));
        }

        Promise.all(promises).then(newFilters => {
            newFilters.sort((a, b) => a.order - b.order);
            (window as any).currentFilters = filters;
            if (attribute.isMultilang) {
                callback(filterChanged, [newFilters[0]]);
            } else {
                callback(filterChanged, newFilters);
            }
        })

    }

    function hasAttribute() {
        return (Acl.check('Attribute', 'read') && scope === 'Product' && Metadata.get(['scopes', 'Product', 'module']) === 'Pim')
            || Metadata.get(['scopes', scope, 'hasAttribute']);
    }

    function addAttributeFilter(callback: (pushed: boolean, filters?: any[]) => void): void {
        const attributeScope = 'Attribute';
        const viewName = Metadata.get(['clientDefs', attributeScope, 'modalViews', 'select']) || 'views/modals/select-records';
        Notifier.notify('Loading...');
        createView('dialog', viewName, {
            scope: attributeScope,
            multiple: false,
            createButton: false,
            massRelateEnabled: false,
            allowSelectAllResult: false,
            boolFilterList: ['onlyForEntity'],
            mandatorySelectAttributeList: ['name', 'type', 'measureId', 'prefixEnabled'],
            boolFilterData: {
                onlyForEntity: scope
            }
        }, dialog => {
            dialog.render();
            Notifier.clearRegular();
            dialog.dialog.$el.on('hidden.bs.modal', (e: any) => {
                if (callback) {
                    callback(false)
                }
            });
            dialog.listenTo(dialog, 'cancel, close', () => {
                if (callback) {
                    callback(false)
                }
            })
            dialog.once('select', (attribute: any) => {
                pushAttributeFilter(attribute.attributes, (pushed, filter) => {
                    if (callback) {
                        callback(pushed, filter);
                    }
                })

            });
        });
    }

    function unsetAll() {
        if (!showUnsetAll) {
            return;
        }
        searchManager.update({
            bool: {},
            savedFilters: [],
            queryBuilderApplied: false,
            advanced: []
        });
        advancedFilterChecked = false;
        handleAdvancedFilterChecked(false);
        savedSearchStore.selectedSavedItemIds.set([]);
        generalFilterStore.selectBoolFilters.set([]);
        refreshShowUnsetAll();
        updateCollection();
        window.dispatchEvent(new CustomEvent('filter:unset-all'));
        clearScopeTreeRules();
    }

    function handleAdvancedFilterChecked(refresh = true) {
        generalFilterStore.advancedFilterChecked.set(advancedFilterChecked);

        updateSearchManager({
            queryBuilderApplied: advancedFilterChecked
        });

        if (refresh) {
            updateCollection();
        }

        refreshShowUnsetAll();
    }

    async function saveSaveSearch(data: Record<string, any>, id: string | null = null): Promise<void> {
        Notifier.notify(Language.translate('pleaseWait', 'messages'));
        savedSearchStore.saveSavedSearch(data, id).then(data => {
            if (id !== null) {
                cancelEditSearchQuery()
            }
            Notifier.notify(Language.translate('Done'), 'success');
            updateCollection();
        }).catch(e => {
            console.error('Error on saving saveSearch', e);
            Notifier.clearRegular()
        })
    }

    function saveFilter() {
        if (advancedFilterDisabled) {
            return;
        }
        let validation = window.$(queryBuilderElement).queryBuilder('validate');
        if (!validation) {
            Notifier.notify(Language.translate('youHaveErrorsInFilter', 'messages'), 'error');
            return;
        }

        if (editingSavedSearch !== null) {
            saveSaveSearch({
                data: window.$(queryBuilderElement).queryBuilder('getRules')
            }, editingSavedSearch.id);
            return;
        }

        createView('savePreset', 'views/modals/save-filters', {}, function (view) {
            view.render();
            view.listenToOnce(view, 'save', (params: any) => {
                saveSaveSearch({
                    entityType: scope,
                    name: params.name,
                    data: searchManager.getQueryBuilder(),
                    isPublic: params.isPublic
                });
                view.close();
            });
        });
    }

    function renameSaveSearch(item: any): void {
        createView('savePreset', 'views/modals/save-filters', {
            name: item.name,
            isPublic: item.isPublic
        }, function (view) {
            view.render();
            view.listenToOnce(view, 'save', (params: any) => {
                saveSaveSearch({
                    name: params.name,
                    isPublic: params.isPublic
                }, item.id)
                view.close();
            });
        });
    }

    async function removeSaveSearch(item: any): Promise<void> {
        const userData = UserData.get();
        if (!userData) {
            return;
        }
        Notifier.notify(Language.translate('pleaseWait', 'messages'));
        savedSearchStore.removeSavedSearch(item.id).then(_ => {
            Notifier.notify(Language.translate('Done'), 'success');
        }).catch(e => {
            console.error('Error on deleting saveSearch', e);
            Notifier.clearRegular()
        });
    }

    function editSaveSearchQuery(item: any): void {
        oldAdvancedFilter = oldAdvancedFilter ?? searchManager.getQueryBuilder();
        searchManager.update({queryBuilder: item.data, queryBuilderApplied: false});
        prepareFilters(() => {
            const $queryBuilder = window.$(queryBuilderElement)
            try {
                $queryBuilder.queryBuilder('destroy');
                initQueryBuilderFilter();
                editingSavedSearch = item;
                advancedFilterChecked = false;
            } catch (e) {
                console.error(e);
                Notifier.notify(Language.translate('theSavedFilterMightBeCorrupt', 'messages'), 'error')
                $queryBuilder.queryBuilder('destroy');
                searchManager.update({
                    queryBuilder: oldAdvancedFilter
                })
                initQueryBuilderFilter();
            }
        });
    }

    function addItemToQueryBuilder(event: CustomEvent) {
        let rules = window.$(queryBuilderElement).queryBuilder('getRules');
        if (rules['condition'] === 'AND') {
            rules['rules'].push(event.detail);
        } else {
            rules = {condition: 'AND', rules: [rules, event.detail], valid: true};
        }
        window.$(queryBuilderElement).queryBuilder('setRules', rules);
        applyFilter()
    }

    function isTreeNodeRule(rule: any): boolean {
        return !!rule.data?._treeNodeKey;
    }

    function makeDeletedFilter(id: string): any {
        deletedFilterIds.add(id);
        return {
            id,
            label: Language.translate(id, 'fields', scope),
            type: 'string',
            __deleted: true,
            validation: {callback: () => Language.translate('deletedFilterTooltip', 'messages').replace('%s', id)}
        };
    }

    function markDeletedFieldRules(qbEl: any): void {
        const qb = qbEl[0]?.queryBuilder;
        if (!qb) return;
        qbEl.find('.rule-container').each(function (_: any, el: HTMLElement) {
            const rule = qb.getModel(el);
            const id: string = rule?.filter?.id;
            if (id && deletedFilterIds.has(id)) {
                window.$(el).addClass('has-error');
                const msg = Language.translate('deletedFilterTooltip', 'messages').replace('%s', id);
                window.$(el).find('.error-container').attr('title', msg);
            }
        });
    }

    function markTreeNodeRuleToggles(): void {
        const $queryBuilder = window.$(queryBuilderElement);
        const qb = $queryBuilder[0]?.queryBuilder;
        if (!qb) return;

        let found = false;
        $queryBuilder.find('.rule-container').each(function (_: any, el: HTMLElement) {
            const rule = qb.getModel(el);
            if (rule && isTreeNodeRule(rule)) {
                found = true;
                window.$(el).addClass('tree-node-rule');
                window.$(el).find('.rule-header').removeClass('drag-handle');
            }
        });
    }

    function syncTreeNodesToQB(treeRules: any[]): void {
        // Skip if this QB's DOM element has been detached (e.g. after navigating to a different entity)
        if (!queryBuilderElement?.isConnected) return;

        // FIXME: _scope filtering is needed because the shared treeNodeRules store is never cleared on navigation.
        // When the user switches between entities, the previous list view is not destroyed --
        // NavigationSidebar and QueryBuilder instances remain in memory and stay subscribed to the store.
        // Without the scope check, rules from entity A would leak into entity B's QB
        // if both happen to have a filter with the same field ID.
        const applicableRules = treeRules.filter((r: any) =>
            (!r.data?._scope || r.data._scope === scope) &&
            filters.some((f: any) => f.id === r.id)
        );

        applicableTreeRulesCount = applicableRules.length;

        let rules = window.$(queryBuilderElement).queryBuilder('getRules', {allow_invalid: true}) || {
            condition: 'AND',
            rules: []
        };

        const currentTreeRules = Array.isArray(rules.rules) ? rules.rules.filter((r: any) => isTreeNodeRule(r)) : [];
        const storeKeys = applicableRules.map((r: any) => r.data._treeNodeKey).sort().join(',');
        const qbKeys = currentTreeRules.map((r: any) => r.data._treeNodeKey).sort().join(',');
        if (storeKeys === qbKeys) {
            return;
        }

        if (Array.isArray(rules.rules)) {
            if (rules.condition !== 'AND') {
                rules = {condition: 'AND', rules: [rules], valid: true};
            }
            rules.rules = rules.rules.filter((r: any) => !isTreeNodeRule(r));
        } else {
            rules = {condition: 'AND', rules: []};
        }

        rules.rules.unshift(...applicableRules);

        syncingFromStore = true;
        window.$(queryBuilderElement).queryBuilder('setRules', rules);
        applyFilter();
        syncingFromStore = false;
    }

    function copySaveSearch(item: any): void {
        searchManager.update({queryBuilder: item.data, queryBuilderApplied: false});
        prepareFilters(() => {
            const $queryBuilder = window.$(queryBuilderElement)
            try {
                $queryBuilder.queryBuilder('destroy');
                initQueryBuilderFilter();
                advancedFilterChecked = false;
                let checked = get(savedSearchStore.selectedSavedItemIds);
                if (checked.includes(item.id)) {
                    savedSearchStore.toggleSavedItemSelection(item.id);
                    checked = get(savedSearchStore.selectedSavedItemIds);
                    searchManager.update({
                        savedFilters: get(savedSearchStore.savedSearchItems).filter(item => checked.includes(item.id))
                    });
                }
                updateCollection();
            } catch (e) {
                console.error(e);
                Notifier.notify(Language.translate('theSavedFilterMightBeCorrupt', 'messages'), 'error')
            }
        });
    }

    function cancelEditSearchQuery() {
        searchManager.update({queryBuilder: oldAdvancedFilter, queryBuilderApplied: false});
        prepareFilters(() => {
            const $queryBuilder = window.$(queryBuilderElement)
            try {
                $queryBuilder.queryBuilder('destroy');
                initQueryBuilderFilter();
                advancedFilterChecked = false;
                oldAdvancedFilter = null;
                editingSavedSearch = null;
                updateCollection();
            } catch (e) {
                console.error(e);
                Notifier.notify(Language.translate('theSavedFilterMightBeCorrupt', 'messages'), 'error')
            }
        });
    }

    function refreshAdvancedFilterDisabled() {
        let rules = searchManager.getQueryBuilder();
        advancedFilterDisabled = true;

        if (typeof rules === 'object' && rules.condition) {
            advancedFilterDisabled = isRuleEmpty(rules);
        }

        // Only write to shared stores when this QB is the active one (element connected to DOM).
        // Detached QB instances must not override the active QB's filter state.
        if (!queryBuilderElement?.isConnected) {
            return;
        }

        generalFilterStore.advancedFilterDisabled.set(advancedFilterDisabled);

        if (advancedFilterDisabled) {
            generalFilterStore.advancedFilterChecked.set(false);
            advancedFilterChecked = false;
        }
    }

    function cleanUpSavedRule(exists: (field: string) => boolean): boolean {
        // we clean up to remove  fields that do not exist anymore
        let hasChanged = false;
        let cleanUpRule = (rule: Rule) => {
            if (rule.rules) {
                let newRules: Rule[] | null = null;
                for (const rulesKey in rule.rules) {
                    if (rule.rules[rulesKey].id) {
                        if (!exists(rule.rules[rulesKey].id)) {
                            hasChanged = true;
                            newRules = rule.rules.filter(v => v.id !== rule.rules[rulesKey].id);
                        }
                    }
                    if (rule.rules[rulesKey] && rule.rules[rulesKey].rules) {
                        cleanUpRule(rule.rules[rulesKey]);
                    }
                }
                if (hasChanged && newRules && newRules.length !== rule.rules.length) {
                    rule.rules = newRules;
                }
            }
        }

        let rule = searchManager.getQueryBuilder();

        cleanUpRule(rule);
        if (hasChanged) {
            searchManager.update({queryBuilder: rule})
        }

        return hasChanged
    }

    function refreshShowUnsetAll() {
        refreshAdvancedFilterDisabled();
        showUnsetAll = searchManager.isFilterSet();
    }

    function isRuleEmpty(rule: Rule): boolean {
        if (rule.operator) {
            return false;
        }

        if (!rule.rules) {
            return true;
        }

        return rule.rules.length === 0;
    }

    function collapseAll(e: MouseEvent): void {
        savedFiltersOpened = false;
        generalFilterOpened = false;
        queryBuilderOpened = false;
    }

    function expandAll(e: MouseEvent): void {
        savedFiltersOpened = true;
        generalFilterOpened = true;
        queryBuilderOpened = true;
    }

    function handleFilterToggle(e: MouseEvent): void {
        if (advancedFilterDisabled || (hasTreeNodeRules && hasQbRules)) {
            return;
        }

        advancedFilterChecked = !advancedFilterChecked;

        if (!advancedFilterChecked && !hasQbRules) {
            handleEmptyRules();
            clearScopeTreeRules();
            handleAdvancedFilterChecked();
            return;
        }

        if (advancedFilterChecked && queryBuilderRulesChanged) {
            const rules = searchManager.getQueryBuilder();
            const $queryBuilder = window.$(queryBuilderElement);
            $queryBuilder.queryBuilder('setRules', rules ?? []);
        }

        handleAdvancedFilterChecked();
    }

    function applyFilter(e?: MouseEvent): void {
        const $queryBuilder = window.$(queryBuilderElement);
        let validation = $queryBuilder.queryBuilder('validate');
        if (!validation) {
            Notifier.notify(Language.translate('youHaveErrorsInFilter', 'messages'), 'error');
            return;
        }

        advancedFilterChecked = true;

        try {
            const rules = $queryBuilder.queryBuilder('getRules');
            if (rules) {
                const rulesToSave = JSON.parse(JSON.stringify(rules));
                (rulesToSave.rules || []).forEach((r: any) => {
                    if (isTreeNodeRule(r) && r.data?.nameHash) {
                        delete r.data.nameHash;
                    }
                });
                updateSearchManager({
                    queryBuilder: rulesToSave,
                    advanced: []
                });
                handleAdvancedFilterChecked(false);
                if (rules.rules.length === 0) {
                    updateCollection();
                }

                if (!syncingFromStore) {
                    const remainingKeys = new Set(
                        (rules.rules || []).filter((r: any) => isTreeNodeRule(r)).map((r: any) => r.data._treeNodeKey)
                    );
                    const currentTreeRules = get(treeNodeRulesStore);
                    const filteredRules = currentTreeRules.filter((r: any) => remainingKeys.has(r.data._treeNodeKey));
                    if (filteredRules.length !== currentTreeRules.length) {
                        generalFilterStore.treeNodeRules.set(filteredRules);
                    }
                }
            }
            queryBuilderRulesChanged = false;
        } catch (err) {
        }

        handleAdvancedFilterChecked();
    }

    function handleEmptyRules(): void {
        if (!advancedFilterChecked) {
            searchManager.update({queryBuilder: []});
        }
    }

    onMount(() => {
        // load where params
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('where')) {
            const where = JSON.parse(urlParams.get('where')!);
            if (where) {
                Storage.set('queryBuilderRules', scope, where);
                window.history.replaceState({}, document.title, window.location.origin + '#' + scope);
                updateCollection();
            }
        }

        // set translates
        window.$.fn.queryBuilder.regional['main'] = Language.getData().Global?.queryBuilderFilter ?? {};
        window.$.fn.queryBuilder.defaults({lang_code: 'main'});


        // we override only if it is a new page
        if (!window.$.fn.queryBuilder.prototype.overridden) {
            window.$.extend(window.$.fn.queryBuilder.prototype, {
                overridden: true
            });
            let originalUpdateRuleFilter = window.$.fn.queryBuilder.constructor.prototype.updateRuleFilter;

            window.$.fn.queryBuilder.constructor.prototype.updateRuleFilter = function (rule: any, previousFilter: any) {
                let e = this.trigger('beforeUpdateRuleFilter', rule, previousFilter);
                if (e.isDefaultPrevented()) {
                    return null;
                }
                originalUpdateRuleFilter.call(this, rule, previousFilter);
            }

            let originalGetFilterById = window.$.fn.queryBuilder.constructor.prototype.getFilterById;
            window.$.fn.queryBuilder.constructor.prototype.getFilterById = function (id: any, doThrow: any) {
                if (id === '') {
                    return null;
                }

                if (deletedFilterIds.has(id)) {
                    return makeDeletedFilter(id);
                }

                const found = this.filters.find((f: any) => f.id === id);
                if (!found && id && id !== '-1') {
                    return makeDeletedFilter(id);
                }

                return originalGetFilterById.call(this, id, doThrow);
            };

            const originalClearErrors = window.$.fn.queryBuilder.constructor.prototype.clearErrors;
            window.$.fn.queryBuilder.constructor.prototype.clearErrors = function (group?: any) {
                originalClearErrors.call(this, group);
                this.$el.find('.rule-container').each((_: any, el: HTMLElement) => {
                    const rule = this.getModel(el);
                    const id: string = rule?.filter?.id;
                    if (id && deletedFilterIds.has(id)) {
                        window.$(el).addClass('has-error');
                        const msg = Language.translate('deletedFilterTooltip', 'messages').replace('%s', id);
                        window.$(el).find('.error-container').attr('title', msg);
                    }
                });
            };
        }


        advancedFilterChecked = searchManager.isQueryBuilderApplied();

        // show unset all
        refreshShowUnsetAll();
        searchManager.collection.on('filter-state:changed', (value: any) => showUnsetAll = !!value);

        let unsubTreeNodes: (() => void) | null = null;
        prepareFilters(() => {
            initQueryBuilderFilter();
            unsubTreeNodes = generalFilterStore.treeNodeRules.subscribe(rules => {
                syncTreeNodesToQB(rules);
            });
        });

        window.addEventListener('add-item-to-query-builder', addItemToQueryBuilder as EventListener);

        return () => {
            searchManager.collection.off('filter-state:changed');
            selectBoolSub();
            selectSavedSub();
            advancedFilterCheckedSub();
            unsubTreeNodes?.();
            window.removeEventListener('add-item-to-query-builder', addItemToQueryBuilder as EventListener);
        }
    })
</script>

<div class="query-builder-container">
    <div class="filters-top-buttons">
        <div class="button-group">
            <button class="small filter-button" data-action="collapseAll"
                    title={Language.translate('collapseAll')} on:click={collapseAll}>
                <i class="ph ph-caret-line-up"></i>
            </button>
            <button class="small filter-button" data-action="expandAll"
                    title={Language.translate('expandAll')} on:click={expandAll}>
                <i class="ph ph-caret-line-down"></i>
            </button>
        </div>
        {#if showUnsetAll}
            <button class="small filter-button" data-action="filter" on:click={unsetAll}>
                <i class="ph ph-x"></i>
                {Language.translate('Unset All')}
            </button>
        {/if}
    </div>
    <GeneralFilter scope={scope} searchManager={searchManager} uniqueKey={uniqueKey} bind:opened={generalFilterOpened}/>
    {#if Acl.check('SavedSearch', 'read')}
        <SavedSearch
                scope={scope}
                searchManager={searchManager}
                editingItem={editingSavedSearch}
                rename={renameSaveSearch}
                remove={removeSaveSearch}
                edit={editSaveSearchQuery}
                cancel={cancelEditSearchQuery}
                copy={copySaveSearch}
                uniqueKey={uniqueKey}
                hideRowAction={hideRowAction}
                bind:opened={savedFiltersOpened}
        />
    {/if}

    <div class="advanced-filters">
        <Collapser title={editingSavedSearch ? editingSavedSearch.name : Language.translate('Advanced Filter')}
                   bind:opened={queryBuilderOpened}>
            <span class="icons-wrapper" slot="icons">
                {#if !editingSavedSearch}
                <span class="toggle" class:disabled={advancedFilterDisabled || (hasTreeNodeRules && hasQbRules)}
                      class:active={advancedFilterChecked}
                      on:click|stopPropagation|preventDefault={handleFilterToggle}
                >
                    {#if advancedFilterChecked}
                        <i class="ph-fill ph-toggle-right"></i>
                    {:else}
                        <i class="ph-fill ph-toggle-left"></i>
                    {/if}
                </span>
                {/if}
            </span>

            <div class="query-builder" bind:this={queryBuilderElement}></div>
            {#if hasQbRules}
                <div class="filter-action">
                    <div style="display:flex; align-items:center; gap: 10px;">
                        {#if Acl.check('SavedSearch', 'create')  }
                            <button class="small filter-button" on:click={saveFilter}
                                    disabled={advancedFilterDisabled || queryBuilderRulesChanged}
                                    title={Language.translate('Save')}
                            >
                                <i class="ph ph-floppy-disk-back"></i>
                            </button>
                        {/if}

                        <button class="small filter-button" on:click={resetFilter}
                                disabled={advancedFilterDisabled} title={Language.translate('Clear')}
                        >
                            <i class="ph-fill ph-eraser"></i>
                        </button>
                    </div>

                    <button class="small filter-button" disabled={!queryBuilderRulesChanged || !isQbValid}
                            on:click={applyFilter}>
                        <i class="ph ph-check"></i><span>{Language.translate('Apply')}</span>
                    </button>
                </div>
            {/if}
        </Collapser>
    </div>
</div>

<style>
    .query-builder-container :global(.checkboxes-filter) {
        margin-bottom: 10px;
    }

    .filters-top-buttons {
        margin-bottom: 5px;
        min-height: 25px;
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
    }

    .filter-action {
        background-color: var(--sidebar-color);
        margin-top: 10px;
        padding-top: 10px;
        padding-bottom: 20px;
        margin-bottom: -20px;
        position: sticky;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 2;
        display: flex;
        justify-content: space-between;
    }

    .advanced-filters {
        margin-top: 20px;
        position: relative;
    }

    .advanced-filters .icons-wrapper .toggle.disabled {
        opacity: .6;
        cursor: not-allowed;
    }

    :global(.advanced-filters .icons-wrapper .toggle.active, .advanced-filters .rule-toggle.active) {
        color: #06c;
    }

    :global(.query-builder .rule-container.tree-node-rule .rule-filter-container),
    :global(.query-builder .rule-container.tree-node-rule .rule-operator-container),
    :global(.query-builder .rule-container.tree-node-rule .rule-value-container),
    :global(.query-builder .rule-container.tree-node-rule .drag-handle) {
        pointer-events: none;
        cursor: not-allowed;
    }

    :global(.query-builder .rule-container.tree-node-rule .rule-toggle) {
        pointer-events: none;
        opacity: .6;
        cursor: not-allowed;
    }

    :global(.advanced-filters .icons-wrapper .toggle i) {
        font-size: 20px;
    }

    :global(.query-builder .drag-handle) {
        user-select: none;
    }

    :global(.query-builder .rule-toggle) {
        cursor: pointer;
        line-height: 1;
    }

    :global(.query-builder .rule-toggle i) {
        font-size: 22px;
    }

    :global(.query-builder .btn.rule-delete) {
        border: 0;
        padding: 0;
        background-color: transparent;
        line-height: 1;
        color: var(--danger-color, #dc3545);
    }

    :global(.query-builder .error-container) {
        font-size: 16px;
        line-height: 1;
    }

    :global(.query-builder .has-error .form-control),
    :global(.query-builder .has-error .input-group-btn > .btn),
    :global(.query-builder .has-error .input-group-btn > button) {
        border-color: #a94442 !important;
    }

    .query-builder :global(.rule-container .rule-header) {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin: 0 5px 6px;
    }

    .query-builder :global(.rule-container .rule-header .rule-header-right) {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .query-builder :global(.rules-group-header) {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 10px;
    }

    .query-builder :global(.rules-group-header .group-header-top) {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .query-builder :global(.rules-group-header .group-header-top .rule-header-right) {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .query-builder :global(.rules-group-header .group-header-center) {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
    }

    .query-builder :global(.rules-group-header .group-actions > .btn-primary:not(:first-child)) {
        border-left-color: #0057ad;
    }

    .query-builder :global(.rule-container-group) {
        display: flex;
        flex-wrap: wrap;
        column-gap: 10px;
        min-width: 100%;
        margin-left: 0;
        margin-right: -5px;
        container-type: inline-size;
    }

    .query-builder :global(.rule-container-group .rule-operator-container),
    .query-builder :global(.rule-container-group .rule-filter-container),
    .query-builder :global(.rule-container-group .rule-value-container) {
        flex-basis: 100%;
        min-width: 0;
    }

    @container (min-width: 400px) {
        .query-builder :global(.rule-container-group .rule-filter-container) {
            flex: 1 1 0;
        }

        .query-builder :global(.rule-container-group .rule-operator-container) {
            flex-basis: 170px;
            flex-grow: 0;
            flex-shrink: 0;
        }
    }
</style>
