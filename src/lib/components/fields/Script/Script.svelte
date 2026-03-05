<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import * as monaco from 'monaco-editor';
    import { onMount } from 'svelte';

    import { Metadata } from '$lib/core/metadata';
    import Text from '$lib/components/fields/Text/Text.svelte';
    import type { FieldMode, FieldFetchResult } from '$lib/types/ui/field';

    import { registerTwigForLanguage } from './utils/twig-language';
    import { computeEditorHeight } from './utils/editor-height';
    import { initFullScreenIcon } from './utils/fullscreen-icon';
    import { registerEditorActions } from './utils/editor-actions';
    import { setupMonacoWorker } from './utils/monaco-worker';
    import type { EditorActionsConfig } from './utils/editor-actions';

    export let mode: FieldMode = 'detail';
    export let name: string = '';
    export let scope: string = '';
    export let params: Record<string, unknown> = {};
    export let value: string | null = null;
    export let scriptFieldView: unknown = null;

    const language: string = (params.language as string)
        || (Metadata.get(['entityDefs', scope, 'fields', name, 'language']) as string)
        || 'twig';
    const twigVariables: string[] = (params.twigVariables as string[])
        || (Metadata.get(['entityDefs', scope, 'fields', name, 'twigVariables']) as string[])
        || [];
    const editorActions: EditorActionsConfig = (params.editorActions as EditorActionsConfig)
        || (Metadata.get(['entityDefs', scope, 'fields', name, 'editorActions']) as EditorActionsConfig)
        || {};

    params = { ...params, seeMoreDisabled: true };

    let containerElement: HTMLDivElement;
    let rootElement: HTMLDivElement;
    let fullScreen: boolean = false;
    const readOnly: boolean = mode !== 'edit';

    $: height = computeEditorHeight(value, fullScreen);

    export function fetch(): FieldFetchResult {
        return { [name]: value };
    }

    onMount(() => {
        const newLanguage = registerTwigForLanguage(language);
        setupMonacoWorker();

        const editorOptions = {
            value: value ?? undefined,
            language: newLanguage,
            automaticLayout: true,
            minimap: { enabled: false },
            theme: 'twig',
            readOnly,
            params,
            name,
            scope,
            twigVariables,
            ...(language === 'json' ? { bracketPairColorization: { enabled: true } } : {}),
        };

        const editor = monaco.editor.create(
            containerElement,
            editorOptions as monaco.editor.IStandaloneEditorConstructionOptions
        );

        const fullScreenContainer = document.createElement('div');
        fullScreenContainer.classList.add('fullscreen-monaco-editor');
        document.body.appendChild(fullScreenContainer);

        editor.addAction({
            id: 'fullscreen',
            label: 'Toggle Fullscreen',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF],
            run() {
                if (!document.fullscreenElement) {
                    fullScreen = true;
                    fullScreenContainer.appendChild(containerElement);
                    fullScreenContainer.requestFullscreen();
                } else {
                    document.exitFullscreen();
                }
                editor.layout();
            }
        });

        registerEditorActions(editor, editorActions, scriptFieldView);

        const handleFullscreen = (evt: Event): void => {
            if (!document.fullscreenElement && evt.target === fullScreenContainer) {
                fullScreen = false;
                rootElement.appendChild(containerElement);
                editor.layout();
            }
        };
        document.addEventListener('fullscreenchange', handleFullscreen);

        editor.onDidChangeModelContent(() => {
            value = editor.getValue();
        });

        const cleanupIcon = initFullScreenIcon(rootElement.closest('.cell'), editor);

        return () => {
            editor.dispose();
            fullScreenContainer.remove();
            document.removeEventListener('fullscreenchange', handleFullscreen);
            cleanupIcon();
        };
    });
</script>

<Text {name} value={value ?? ''} {mode} {params}>
    <div bind:this={rootElement}>
        <div
            class={`code-container ${readOnly ? 'read-only' : ''}`}
            style={`height: ${height}`}
            bind:this={containerElement}
        ></div>
    </div>
</Text>

<style>
    :global(.code-container) {
        border: 1px solid #ced4da;
        resize: vertical;
        overflow: auto;
    }

    :global(.fullscreen-monaco-editor .code-container) {
        resize: none;
        overflow: unset;
    }

    :global(.code-container .monaco-editor) {
        outline: none;
    }

    :global(.monaco-editor .margin) {
        margin: 0 !important;
    }

    :global(.code-container.read-only .monaco-editor) {
        --vscode-editor-background: #efefef;
    }
</style>
