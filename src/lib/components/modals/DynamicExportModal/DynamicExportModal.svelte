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

    export let onExport: (contentLanguageId: string | null) => void = () => {};
    export let onClose: () => void = () => {};

    let contentLanguageId: string | null = null;
    let languageOptions: Array<{ id: string; label: string }> = [];

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
        }).catch(() => {});
    });

    function handleButton(name: string): void {
        if (name === 'export') {
            if (!contentLanguageId) {
                Notifier.notify(
                    Language.translate('contentLanguageRequired', 'messages', 'ExportFeed'),
                    'error'
                );
                return;
            }
            onExport(contentLanguageId);
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
    </div>
</Modal>
