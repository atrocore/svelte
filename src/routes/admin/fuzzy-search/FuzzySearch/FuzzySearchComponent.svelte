<script lang="ts">
    import { onMount } from 'svelte';
    import { Language } from '$lib/core/language';
    import { Config } from '$lib/core/config';
    import { ApiClient } from '$lib/core/api-client';
    import { Notifier } from '$lib/dom/notifier';
    import BaseHeader from '$lib/components/headers/BaseHeader/BaseHeader.svelte';

    let similarityThreshold: number = 1;
    let fuzzySearchAvailable: boolean = false;
    let saving: boolean = false;
    let loaded: boolean = false;

    onMount(async () => {
        fuzzySearchAvailable = Config.get('fuzzySearchAvailable') ?? false;
        const settings = await ApiClient.get<Record<string, any>>('settings');
        similarityThreshold = settings.similarityThreshold ?? 1;
        loaded = true;
    });

    async function save() {
        saving = true;
        try {
            await ApiClient.patch('settings', {similarityThreshold});
            Notifier.notify(Language.translate('Saved'), 'success');
        } catch (e) {
            Notifier.notify(Language.translate('Error occurred'), 'danger');
        } finally {
            saving = false;
        }
    }

    const breadcrumbs = [
        {url: '#Admin', label: Language.translate('Administration')},
        {url: '#', label: Language.translate('fuzzySearch', 'labels', 'Admin'), className: 'header-title'}
    ];
</script>

<div class="page-header">
    <BaseHeader {breadcrumbs} scope="Admin" id="fuzzySearch"/>

    <button
            on:click={save}
            disabled={!loaded || saving}
            style="margin: 10px 7px 0 5px"
            class="primary action"
            type="button"
    >{Language.translate('Save')}</button>
</div>

{#if loaded}
    <div class="row" style="margin-top: 20px; margin-left: 5px;">
        <div class="col-sm-6">
            <div class="row">
                <div class="col-xs-12 cell form-group">
                    <label class="control-label" for="">
                        {Language.translate('fuzzySearchAvailable', 'fields', 'Settings')}
                    </label>
                    <div class="field">
                        <span style="color: {fuzzySearchAvailable ? '#28a745' : '#dc3545'}; font-weight: 500;">
                            {fuzzySearchAvailable
                                ? Language.translate('available', 'labels', 'Settings')
                                : Language.translate('notAvailable', 'labels', 'Settings')}
                        </span>
                    </div>
                </div>
            </div>
            {#if fuzzySearchAvailable}
                <div class="row">
                    <div class="col-xs-12 cell form-group">
                        <label class="control-label" for="similarityThreshold">
                            {Language.translate('similarityThreshold', 'fields', 'Settings')}
                        </label>
                        <div class="field">
                            <input
                                    name="similarityThreshold"
                                    type="number"
                                    class="form-control"
                                    min="0.1"
                                    max="1.0"
                                    step="0.01"
                                    bind:value={similarityThreshold}
                            />
                        </div>
                    </div>
                </div>
            {/if}
        </div>
    </div>
{/if}
