<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { ApiClient, ApiError } from '$lib/core/api-client';
    import { Language } from "$lib/core/language";
    import Preloader from "$lib/components/loaders/Preloader/Preloader.svelte";

    const dispatch = createEventDispatcher<{ 'title-change': string }>();

    export let sourceEntity: string = '';
    export let targetEntity: string = '';
    export let sourceRecordId: string = '';
    export let previewActive: boolean = false;
    export let scriptChanged: boolean = false;
    export let loadDataPipelineEditor: ((element: HTMLElement, dataPipeline: Record<string, any>) => void) | null = null;
    export let getScript: (() => string | null) | null = null;
    export let onPreviewLoaded: ((targetRecord: Record<string, any>) => void) | null = null;
    export let onPreviewDiscarded: (() => void) | null = null;
    export let onResetScript: (() => void) | null = null;
    export let onScriptSaved: ((script: string) => void) | null = null;

    let dataPipeline: any = null;
    let loading = false;
    let loadedFor: string = '';
    let saving = false;
    let applying = false;
    let previewError = '';

    $: entityPair = sourceEntity && targetEntity ? `${sourceEntity}|${targetEntity}` : '';

    $: if (entityPair && entityPair !== loadedFor) {
        load();
    }

    async function load(): Promise<void> {
        loadedFor = entityPair;
        dataPipeline = null;

        if (!entityPair) {
            return;
        }

        loading = true;

        try {
            const result: any = await ApiClient.get('/DataPipeline', {
                maxSize: 1,
                where: JSON.stringify([
                    { type: 'equals', attribute: 'sourceEntityId', value: sourceEntity },
                    { type: 'equals', attribute: 'targetEntityId', value: targetEntity }
                ])
            });

            dataPipeline = (result?.list ?? [])[0] ?? null;

            if (dataPipeline) {
                dispatch(
                    'title-change',
                    `<a href="#DataPipeline/view/${dataPipeline.id}" target="_blank" class="sidebar-title-link">`
                    + `${Language.translate('DataPipeline', 'scopeNames')} ${dataPipeline.number ?? ''}`.trim()
                    + `</a>`
                );
            }
        } finally {
            loading = false;
        }
    }

    function describeError(e: unknown): string {
        if (e instanceof ApiError) {
            return e.getReason();
        }

        return e instanceof Error ? e.message : String(e);
    }

    async function save(): Promise<void> {
        const script = getScript?.() ?? null;

        if (!dataPipeline || script === null || saving) {
            return;
        }

        saving = true;

        try {
            await ApiClient.patch(`/DataPipeline/${dataPipeline.id}`, { transformationScript: script });
            dataPipeline = { ...dataPipeline, transformationScript: script };
            onScriptSaved?.(script);
        } catch (e) {
            previewError = describeError(e);
        } finally {
            saving = false;
        }
    }

    async function apply(): Promise<void> {
        if (!dataPipeline || !sourceRecordId || applying) {
            return;
        }

        applying = true;
        previewError = '';

        const payload: Record<string, any> = { sourceRecordId };

        const script = getScript?.() ?? null;
        if (script !== null) {
            payload.transformationScript = script;
        }

        try {
            const targetRecord: any = await ApiClient.post(`/DataPipeline/${dataPipeline.id}/transformationPreview`, payload);
            onPreviewLoaded?.(targetRecord);
        } catch (e) {
            previewError = describeError(e);
            onPreviewDiscarded?.();
        } finally {
            applying = false;
        }
    }

    function discard(): void {
        previewError = '';
        onResetScript?.();
        onPreviewDiscarded?.();
    }

    function mountEditor(element: HTMLElement) {
        element.id = 'data-pipeline-script-editor-' + dataPipeline.id;
        loadDataPipelineEditor?.(element, dataPipeline);
        return {};
    }
</script>

{#if loading}
    <div class="loader-wrapper">
        <Preloader/>
    </div>
{:else if !dataPipeline}
    <div class="no-data-pipeline">{Language.translate('noDataPipelineConfigured', 'labels', 'DataPipeline')}</div>
{:else}
    <div class="data-pipeline-script">
        <p class="hint">{Language.translate('targetRecordPreviewHint', 'labels', 'DataPipeline')}</p>

        <div class="script-editor" use:mountEditor></div>

        <div class="body">
            <div class="actions">
                <button class="small primary"
                        on:click={save}
                        disabled={saving || applying || !scriptChanged}>
                    <i class="ph {saving ? 'ph-circle-notch ph-spin' : 'ph-floppy-disk-back'}"></i>
                    <span>{Language.translate('Save')}</span>
                </button>

                <button class="small"
                        on:click={discard}
                        disabled={saving || applying || (!scriptChanged && !previewActive)}>
                    <i class="ph ph-arrow-counter-clockwise"></i>
                    <span>{Language.translate('discard', 'labels', 'DataPipeline')}</span>
                </button>

                <button class="small" on:click={apply} disabled={saving || applying || !sourceRecordId}>
                    <i class="ph {applying ? 'ph-circle-notch ph-spin' : 'ph-eye'}"></i>
                    <span>{Language.translate('Preview')}</span>
                </button>
            </div>

            {#if previewError}
                <p class="error">{previewError}</p>
            {/if}
        </div>
    </div>
{/if}

<style>
    .loader-wrapper {
        text-align: center;
        margin-top: 10px;
    }

    .no-data-pipeline {
        color: #999;
        font-style: italic;
        margin-top: 10px;
    }

    .body {
        padding: 0;
    }

    .script-editor {
        margin-bottom: 10px;
    }

    .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
    }

    .actions button {
        flex: 1 1 auto;
    }

    .actions button i {
        font-size: 14px;
    }

    .hint {
        color: #777;
        margin: 0 0 10px;
    }

    .error {
        margin: 15px 0 0;
        color: #a94442;
        word-break: break-word;
    }
</style>
