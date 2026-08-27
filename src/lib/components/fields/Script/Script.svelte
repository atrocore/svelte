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
    import { registerExpressionLanguage } from './utils/expression-language';
    import { registerEditorTheme } from './utils/editor-theme';
    import { computeEditorHeight } from './utils/editor-height';
    import { initFullScreenIcon } from './utils/fullscreen-icon';
    import { registerEditorActions } from './utils/editor-actions';
    import { setupMonacoWorker } from './utils/monaco-worker';
    import { registerScriptValidation } from './utils/script-validation';
    import { registerExpressionValidation } from './utils/expression-validation';
    import ProblemsBadge from './ProblemsBadge/ProblemsBadge.svelte';
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
    const engine: string = (params.engine as string)
        || (Metadata.get(['entityDefs', scope, 'fields', name, 'engine']) as string)
        || '';
    const variables: string[] = (params.variables as string[])
        || (Metadata.get(['entityDefs', scope, 'fields', name, 'variables']) as string[])
        || (params.twigVariables as string[])
        || (Metadata.get(['entityDefs', scope, 'fields', name, 'twigVariables']) as string[])
        || [];
    const editorActions: EditorActionsConfig = (params.editorActions as EditorActionsConfig)
        || (Metadata.get(['entityDefs', scope, 'fields', name, 'editorActions']) as EditorActionsConfig)
        || {};

    params = { ...params, seeMoreDisabled: true };

    let containerElement: HTMLDivElement;
    let rootElement: HTMLDivElement;
    let codeContainerWrapper: HTMLDivElement;
    let editor: monaco.editor.IStandaloneCodeEditor | undefined;
    let fullScreen: boolean = false;
    const readOnly: boolean = mode !== 'edit';

    $: height = computeEditorHeight(value, fullScreen);

    export function fetch(): FieldFetchResult {
        return { [name]: value };
    }

    onMount(() => {
        registerEditorTheme();

        let newLanguage;
        if (engine === 'ExpressionLanguage') {
            newLanguage = registerExpressionLanguage();
        } else if (engine === 'Twig') {
            newLanguage = registerTwigForLanguage(language);
        } else {
            newLanguage = language;
        }

        setupMonacoWorker();

        const editorOptions = {
            value: value ?? undefined,
            language: newLanguage,
            automaticLayout: true,
            minimap: { enabled: false },
            theme: 'twig',
            readOnly,
            renderValidationDecorations: 'on',
            fixedOverflowWidgets: true,
            wordBasedSuggestions: 'off',
            'semanticHighlighting.enabled': true,
            params,
            name,
            scope,
            variables,
            ...(language === 'json' ? { bracketPairColorization: { enabled: true } } : {}),
        };

        const localEditor = monaco.editor.create(
            containerElement,
            editorOptions as monaco.editor.IStandaloneEditorConstructionOptions
        );
        editor = localEditor;

        const fullScreenContainer = document.createElement('div');
        fullScreenContainer.classList.add('fullscreen-monaco-editor');
        document.body.appendChild(fullScreenContainer);

        localEditor.addAction({
            id: 'fullscreen',
            label: 'Toggle Fullscreen',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF],
            run() {
                if (!document.fullscreenElement) {
                    fullScreen = true;
                    fullScreenContainer.appendChild(codeContainerWrapper);
                    fullScreenContainer.requestFullscreen();
                } else {
                    document.exitFullscreen();
                }
                localEditor.layout();
            }
        });

        registerEditorActions(localEditor, editorActions, scriptFieldView);

        const handleFullscreen = (evt: Event): void => {
            if (!document.fullscreenElement && evt.target === fullScreenContainer) {
                fullScreen = false;
                rootElement.appendChild(codeContainerWrapper);
                localEditor.layout();
            }
        };
        document.addEventListener('fullscreenchange', handleFullscreen);

        localEditor.onDidChangeModelContent(() => {
            value = localEditor.getValue();
        });

        const cleanupIcon = initFullScreenIcon(rootElement.closest('.cell'), localEditor);
        const cleanupValidation = registerScriptValidation(localEditor, newLanguage, engine);
        const cleanupExpressionValidation = registerExpressionValidation(localEditor, engine);

        let sizeAtMouseDown: { width: number; height: number } | null = null;
        const handleResizeMouseDown = (): void => {
            sizeAtMouseDown = { width: containerElement.offsetWidth, height: containerElement.offsetHeight };
        };
        const handleResizeClickCapture = (evt: MouseEvent): void => {
            const resized = sizeAtMouseDown !== null
                && (sizeAtMouseDown.width !== containerElement.offsetWidth || sizeAtMouseDown.height !== containerElement.offsetHeight);

            sizeAtMouseDown = null;

            if (resized) {
                evt.stopPropagation();
            }
        };
        containerElement.addEventListener('mousedown', handleResizeMouseDown);
        containerElement.addEventListener('click', handleResizeClickCapture, true);

        return () => {
            editor = undefined;
            localEditor.dispose();
            fullScreenContainer.remove();
            document.removeEventListener('fullscreenchange', handleFullscreen);
            containerElement.removeEventListener('mousedown', handleResizeMouseDown);
            containerElement.removeEventListener('click', handleResizeClickCapture, true);
            cleanupIcon();
            cleanupValidation();
            cleanupExpressionValidation();
        };
    });
</script>

<Text {name} value={value ?? ''} {mode} {params}>
    <div bind:this={rootElement}>
        <div class="code-container-wrapper" bind:this={codeContainerWrapper}>
            <div
                class={`code-container ${readOnly ? 'read-only' : ''}`}
                style={`height: ${height}`}
                bind:this={containerElement}
            ></div>
            {#if editor}
                <ProblemsBadge {editor} />
            {/if}
        </div>
    </div>
</Text>

<style>
    .code-container-wrapper {
        position: relative;
    }

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

    :global(.monaco-editor .codicon),
    :global(.monaco-hover .codicon),
    :global(.monaco-action-bar .codicon) {
        font-family: codicon !important;
    }

    :global(.monaco-hover a[role='button']),
    :global(.monaco-action-bar a[role='button']),
    :global(.monaco-editor-hover a[role='button']) {
        display: inline-block !important;
        width: auto !important;
        height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        background: none !important;
        border: none !important;
        border-radius: 0 !important;
        color: inherit !important;
        font-size: inherit !important;
        line-height: inherit !important;
        text-decoration: none !important;
    }
</style>
