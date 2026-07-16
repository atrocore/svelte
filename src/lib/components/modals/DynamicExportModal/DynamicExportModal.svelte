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
    import Modal from '$lib/components/modals/Modal/Modal.svelte';
    import PartSelect from '$lib/components/fields/PartSelect/PartSelect.svelte';

    export let onExport: (contentLanguageId: string | null, localeId: string | null) => void = () => {};
    export let onClose: () => void = () => {};

    let contentLanguageId: string | null = null;
    let localeId: string | null = null;
    let languageOptions: Array<{ id: string; label: string }> = [];
    let localeOptions: Array<{ id: string; label: string }> = [];
    let loadingLanguages = true;
    let loadingLocales = true;

    $: loading = loadingLanguages || loadingLocales;

    const buttons = [
        {
            name: 'export',
            label: Language.translate('Export', 'labels', 'ExportFeed'),
            style: 'danger'
        },
        {
            name: 'cancel',
            label: Language.translate('Cancel', 'labels')
        }
    ];

    onMount(() => {
        ApiClient.get<{ list: Array<{ id: string; name: string }> }>('Language', {
            select: 'id,name',
            maxSize: 200,
            sortBy: 'name',
            asc: true
        }).then(res => {
            languageOptions = (res?.list ?? []).map(l => ({ id: l.id, label: l.name }));
        }).catch(() => {}).finally(() => { loadingLanguages = false; });

        ApiClient.get<{ list: Array<{ id: string; name: string }> }>('Locale', {
            select: 'id,name',
            maxSize: 200,
            sortBy: 'name',
            asc: true
        }).then(res => {
            localeOptions = (res?.list ?? []).map(l => ({ id: l.id, label: l.name }));
        }).catch(() => {}).finally(() => { loadingLocales = false; });
    });

    function handleButton(name: string): void {
        if (name === 'export') {
            if (loading) {
                return;
            }
            if (!contentLanguageId) {
                Notifier.notify(
                    Language.translate('contentLanguageRequired', 'messages', 'ExportFeed'),
                    'error'
                );
                return;
            }
            onExport(contentLanguageId, localeId);
        }
        onClose();
    }
</script>

<Modal
    header={Language.translate('exportParameters', 'labels', 'ExportFeed')}
    {buttons}
    onButtonClick={handleButton}
    {onClose}
    fitHeight={true}
>
    {#if loading}
        <div class="text-center" style="padding: 1em;">
            <span class="fas fa-spinner fa-spin"></span>
            {Language.translate('pleaseWait', 'messages')}
        </div>
    {:else}
        <div class="row">
            <div class="cell col-sm-6 form-group">
                <label class="control-label">
                    {Language.translate('contentLanguage', 'labels', 'ExportFeed')}
                </label>
                <PartSelect
                    name="contentLanguage"
                    value={contentLanguageId}
                    options={languageOptions}
                    on:change={e => { contentLanguageId = e.detail; }}
                />
            </div>
            <div class="cell col-sm-6 form-group">
                <label class="control-label">
                    {Language.translate('locale', 'fields', 'ExportFeed')}
                </label>
                <PartSelect
                    name="locale"
                    value={localeId}
                    options={localeOptions}
                    on:change={e => { localeId = e.detail; }}
                />
            </div>
        </div>
    {/if}
</Modal>
