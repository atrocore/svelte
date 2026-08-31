<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import * as monaco from 'monaco-editor';
    import { onMount, onDestroy } from 'svelte';

    import { Language } from '$lib/core/language';

    export let editor: monaco.editor.IStandaloneCodeEditor;

    let markers: monaco.editor.IMarker[] = [];
    let open: boolean = false;
    let markersSubscription: monaco.IDisposable | undefined;

    $: errors = markers
        .filter((marker) => marker.severity === monaco.MarkerSeverity.Error)
        .sort((a, b) => a.startLineNumber - b.startLineNumber);
    $: warnings = markers
        .filter((marker) => marker.severity !== monaco.MarkerSeverity.Error)
        .sort((a, b) => a.startLineNumber - b.startLineNumber);

    function refresh(): void {
        const model = editor.getModel();
        markers = model ? monaco.editor.getModelMarkers({ resource: model.uri }) : [];
    }

    function toggle(): void {
        open = !open;
    }

    function goToMarker(marker: monaco.editor.IMarker): void {
        editor.revealLineInCenter(marker.startLineNumber);
        editor.setPosition({ lineNumber: marker.startLineNumber, column: marker.startColumn });
        editor.focus();
        open = false;
    }

    function handleWindowClick(event: MouseEvent): void {
        if (!(event.target as Element)?.closest('.script-problems-badge')) {
            open = false;
        }
    }

    onMount(() => {
        refresh();

        markersSubscription = monaco.editor.onDidChangeMarkers((uris) => {
            const model = editor.getModel();
            if (model && uris.some((uri) => uri.toString() === model.uri.toString())) {
                refresh();
            }
        });

        window.addEventListener('click', handleWindowClick);
    });

    onDestroy(() => {
        markersSubscription?.dispose();
        window.removeEventListener('click', handleWindowClick);
    });
</script>

{#if markers.length > 0}
    <div class="script-problems-badge">
        <button
            type="button"
            class="toggle"
            class:is-warning={errors.length === 0}
            title={Language.translate('problems', 'labels')}
            on:mousedown|preventDefault
            on:click|stopPropagation={toggle}
        >
            <i class="ph {errors.length > 0 ? 'ph-x-circle' : 'ph-warning-circle'}"></i>
            <span>{markers.length}</span>
        </button>

        {#if open}
            <ul class="list">
                {#if errors.length > 0}
                    <li class="group-title">
                        {Language.translate('errors', 'labels')} ({errors.length})
                    </li>
                    {#each errors as marker}
                        <li>
                            <button
                                type="button"
                                class="is-error"
                                on:mousedown|preventDefault
                                on:click|stopPropagation={() => goToMarker(marker)}
                            >
                                <span class="line">{marker.startLineNumber}</span>
                                <span class="message">{marker.message}</span>
                            </button>
                        </li>
                    {/each}
                {/if}

                {#if warnings.length > 0}
                    <li class="group-title">
                        {Language.translate('warnings', 'labels')} ({warnings.length})
                    </li>
                    {#each warnings as marker}
                        <li>
                            <button
                                type="button"
                                class="is-warning"
                                on:mousedown|preventDefault
                                on:click|stopPropagation={() => goToMarker(marker)}
                            >
                                <span class="line">{marker.startLineNumber}</span>
                                <span class="message">{marker.message}</span>
                            </button>
                        </li>
                    {/each}
                {/if}
            </ul>
        {/if}
    </div>
{/if}

<style>
    .script-problems-badge {
        position: absolute;
        right: 6px;
        bottom: 6px;
        z-index: 5;
    }

    .toggle {
        display: flex;
        align-items: center;
        gap: 2px;
        background: #ffffff;
        border: 1px solid #d9363e;
        color: #d9363e;
        border-radius: 12px;
        padding: 2px 8px;
        font-size: 12px;
        line-height: 1;
        cursor: pointer;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    }

    .toggle.is-warning {
        border-color: #b58900;
        color: #b58900;
    }

    .toggle i {
        font-size: 14px;
    }

    .list {
        position: absolute;
        right: 0;
        bottom: 26px;
        max-height: 260px;
        min-width: 260px;
        max-width: 420px;
        overflow-y: auto;
        margin: 0;
        padding: 4px 0;
        list-style: none;
        background: #ffffff;
        border: 1px solid #ced4da;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        scrollbar-width: thin;
    }

    .group-title {
        padding: 4px 10px;
        font-size: 11px;
        font-weight: bold;
        text-transform: uppercase;
        color: #6c757d;
    }

    .group-title:not(:first-child) {
        margin-top: 4px;
        border-top: 1px solid #ecebeb;
    }

    .list li button {
        display: flex;
        gap: 8px;
        width: 100%;
        padding: 4px 10px;
        border: none;
        background: none;
        text-align: left;
        cursor: pointer;
        font-size: 12px;
    }

    .list li button:hover {
        background: #f5f5f5;
    }

    .line {
        flex-shrink: 0;
        color: #6c757d;
    }

    .message {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .list button.is-error .message {
        color: #d9363e;
    }

    .list button.is-warning .message {
        color: #b58900;
    }
</style>
