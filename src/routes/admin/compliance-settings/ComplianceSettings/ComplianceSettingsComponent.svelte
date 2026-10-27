<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { onMount } from 'svelte';
    import { Language } from '$lib/core/language';
    import { ApiClient } from '$lib/core/api-client';
    import { Notifier } from '$lib/dom/notifier';
    import BaseHeader from '$lib/components/headers/BaseHeader/BaseHeader.svelte';
    import Bool from '$lib/components/fields/Bool/Bool.svelte';

    let complianceMultipleDocsPerLanguage: boolean = false;
    let saving: boolean = false;
    let loaded: boolean = false;

    onMount(async () => {
        const settings = await ApiClient.get<Record<string, any>>('settings');
        complianceMultipleDocsPerLanguage = !!settings.complianceMultipleDocsPerLanguage;
        loaded = true;
    });

    async function save() {
        saving = true;
        try {
            await ApiClient.patch('settings', {complianceMultipleDocsPerLanguage});
            Notifier.notify(Language.translate('Saved'), 'success');
        } catch (e) {
            Notifier.notify(Language.translate('Error occurred'), 'danger');
        } finally {
            saving = false;
        }
    }

    const breadcrumbs = [
        {url: '#Admin', label: Language.translate('Administration')},
        {url: '#', label: Language.translate('complianceSettings', 'labels', 'Admin'), className: 'header-title'}
    ];
</script>

<div class="page-header">
    <BaseHeader {breadcrumbs} scope="Admin" id="complianceSettings">
        <button
                on:click={save}
                disabled={!loaded || saving}
                style="margin-top: 10px"
                class="primary action"
                type="button"
        >{Language.translate('Save')}</button>
    </BaseHeader>
</div>

{#if loaded}
    <div class="row" style="margin-top: 20px; margin-left: 5px;">
        <div class="col-sm-6">
            <div class="row">
                <div class="col-xs-12 cell form-group">
                    <label class="control-label" for="complianceMultipleDocsPerLanguage">
                        <span
                                class="label-text"
                                title={Language.translate('complianceMultipleDocsPerLanguage', 'tooltips', 'Settings')}
                        >{Language.translate('complianceMultipleDocsPerLanguage', 'fields', 'Settings')}</span>
                    </label>
                    <div class="field">
                        <Bool
                                name="complianceMultipleDocsPerLanguage"
                                mode="edit"
                                bind:value={complianceMultipleDocsPerLanguage}
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}
