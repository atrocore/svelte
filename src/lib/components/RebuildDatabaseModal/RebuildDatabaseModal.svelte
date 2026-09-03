<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { Language } from "$lib/core/language"
    import { onMount, tick } from "svelte";
    import { ApiClient } from '$lib/core/api-client';
    import { Notifier } from '$lib/dom/notifier';

    import Modal from '$lib/components/modals/Modal/Modal.svelte';
    import SpinnerIcon from "$lib/components/loaders/SpinnerIcon/SpinnerIcon.svelte";

    export let onClose: () => void;

    let data: string | null = null;
    let loading: boolean = false;
    let applying: boolean = false;

    $: buttons = [
        {
            name: 'apply',
            label: Language.translate('Apply'),
            style: 'danger',
            disabled: loading || applying || !data
        },
        {
            name: 'cancel',
            label: Language.translate('Cancel'),
            disabled: applying
        }
    ];

    onMount(() => {
        loading = true;
        ApiClient.request('GET', 'getSchemaDiff')
            .then(response => response.text())
            .then(text => {
                data = text;
            })
            .catch(() => {})
            .finally(() => loading = false);
    });

    function applyRebuild(): void {
        applying = true;
        Notifier.notify(Language.translate('pleaseWait', 'messages'));

        ApiClient.request('POST', 'rebuildDb')
            .then(async () => {
                onClose();
                await tick();
                Notifier.notify(Language.translate('Done'), 'success');
            })
            .catch(() => {
                applying = false;
            });
    }

    function handleButton(name: string): void {
        if (name === 'apply') {
            applyRebuild();
            return;
        }
        onClose();
    }
</script>

<Modal
    header={Language.translate('rebuildDb', 'labels', 'Admin')}
    {buttons}
    onButtonClick={handleButton}
    {onClose}
    closeOnEscape={true}
    closeOnBackdrop={true}
    fullHeight={true}
    position="right"
>
    <div class="body-inner">
        <div class="message">{Language.translate('rebuildDb', 'messages', 'Admin')}</div>
        <div class="details">
            {#if !loading}
                <pre>{data || 'No database changes were detected'}</pre>
            {:else}
                <SpinnerIcon size={50} thickness={5}/>
            {/if}
        </div>
    </div>
</Modal>

<style>
    .body-inner {
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    .details {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: 20px;
        min-height: 200px;
        flex: 1;
    }

    .details > pre {
        width: 100%;
        height: 100%;
        overflow-y: auto;
    }
</style>