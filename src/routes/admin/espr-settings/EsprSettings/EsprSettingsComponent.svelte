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

    let esprUseDeclarationOfConformityUrl: boolean = false;
    let field: Bool;
    let saving: boolean = false;
    let loaded: boolean = false;

    onMount(async () => {
        const settings = await ApiClient.get<Record<string, any>>('settings');
        esprUseDeclarationOfConformityUrl = !!settings.esprUseDeclarationOfConformityUrl;
        loaded = true;
    });

    async function save() {
        saving = true;
        try {
            const data = field.fetch();
            const changed = !!data.esprUseDeclarationOfConformityUrl !== esprUseDeclarationOfConformityUrl;
            await ApiClient.patch('settings', data);
            esprUseDeclarationOfConformityUrl = !!data.esprUseDeclarationOfConformityUrl;
            Notifier.notify(Language.translate('Saved'), 'success');
            if (changed) {
                // the metadata and the layouts of the passport and the deactivated entity are loaded once at start
                setTimeout(() => window.location.reload(), 800);
            }
        } catch (e) {
            Notifier.notify(Language.translate('Error occurred'), 'danger');
        } finally {
            saving = false;
        }
    }

    const breadcrumbs = [
        {url: '#Admin', label: Language.translate('Administration')},
        {url: '#', label: Language.translate('esprSettings', 'labels', 'Admin'), className: 'header-title'}
    ];
</script>

<div class="page-header">
    <BaseHeader {breadcrumbs} scope="Admin" id="esprSettings">
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
            <h4 style="margin-bottom: 15px">{Language.translate('declarationOfConformity', 'labels', 'Admin')}</h4>
            <div class="row">
                <div class="col-xs-12 cell form-group">
                    <label class="control-label" for="esprUseDeclarationOfConformityUrl">
                        <span
                                class="label-text"
                                title={Language.translate('esprUseDeclarationOfConformityUrl', 'tooltips', 'Settings')}
                        >{Language.translate('esprUseDeclarationOfConformityUrl', 'fields', 'Settings')}</span>
                    </label>
                    <div class="field">
                        <Bool
                                bind:this={field}
                                name="esprUseDeclarationOfConformityUrl"
                                mode="edit"
                                value={esprUseDeclarationOfConformityUrl}
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}
