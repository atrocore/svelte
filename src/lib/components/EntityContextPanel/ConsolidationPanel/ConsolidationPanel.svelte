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

    export let clusterId: string = '';
    export let masterEntity: string = '';
    export let previewActive: boolean = false;
    export let scriptChanged: boolean = false;
    export let loadConsolidationEditor: ((element: HTMLElement, consolidation: Record<string, any>) => void) | null = null;
    export let getScript: (() => string | null) | null = null;
    export let onPreviewLoaded: ((masterRecord: Record<string, any>) => void) | null = null;
    export let onPreviewDiscarded: (() => void) | null = null;
    export let onResetScript: (() => void) | null = null;
    export let onScriptSaved: ((script: string) => void) | null = null;

    let consolidation: any = null;
    let loading = false;
    let loadedFor: string = '';
    let saving = false;
    let applying = false;
    let previewError = '';

    $: if (masterEntity && masterEntity !== loadedFor) {
        load();
    }

    async function load(): Promise<void> {
        loadedFor = masterEntity;
        consolidation = null;

        if (!masterEntity) {
            return;
        }

        loading = true;

        try {
            const result: any = await ApiClient.get('/Consolidation', {
                maxSize: 1,
                where: JSON.stringify([
                    { type: 'equals', attribute: 'entityId', value: masterEntity }
                ])
            });

            consolidation = (result?.list ?? [])[0] ?? null;

            if (consolidation) {
                dispatch(
                    'title-change',
                    `<a href="#Consolidation/view/${consolidation.id}" target="_blank" class="sidebar-title-link">`
                    + `${Language.translate('Consolidation', 'scopeNames')} ${consolidation.number ?? ''}`.trim()
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

        if (!consolidation || script === null || saving) {
            return;
        }

        saving = true;

        try {
            await ApiClient.patch(`/Consolidation/${consolidation.id}`, { consolidationScript: script });
            consolidation = { ...consolidation, consolidationScript: script };
            onScriptSaved?.(script);
        } catch (e) {
            previewError = describeError(e);
        } finally {
            saving = false;
        }
    }

    async function apply(): Promise<void> {
        if (applying) {
            return;
        }

        applying = true;
        previewError = '';

        const payload: Record<string, any> = {};

        const script = getScript?.() ?? null;
        if (script !== null) {
            payload.consolidationScript = script;
        }

        try {
            const masterRecord: any = await ApiClient.post(`/Cluster/${clusterId}/consolidationPreview`, payload);
            onPreviewLoaded?.(masterRecord);
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
        element.id = 'consolidation-script-editor-' + consolidation.id;
        loadConsolidationEditor?.(element, consolidation);
        return {};
    }
</script>

{#if loading}
    <div class="loader-wrapper">
        <Preloader/>
    </div>
{:else if !consolidation}
    <div class="no-consolidation">{Language.translate('noConsolidationConfigured', 'labels', 'Cluster')}</div>
{:else}
    <div class="consolidation-script">
        <p class="hint">{Language.translate('consolidationPreviewHint', 'labels', 'Cluster')}</p>

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
                    <span>{Language.translate('discard', 'labels', 'Cluster')}</span>
                </button>

                <button class="small" on:click={apply} disabled={saving || applying}>
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

    .no-consolidation {
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
