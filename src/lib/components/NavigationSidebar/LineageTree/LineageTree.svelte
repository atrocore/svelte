<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { Language } from '$lib/core/language';
    import { selectize } from '$lib/dom/selectize';
    import type { LineageEndpoint } from './types/lineage-endpoint';
    import type { LineageLink } from './types/lineage-link';
    import type { LineageRow } from './types/lineage-row';
    import { buildLineageRows, loadLineageTree } from './utils/tree-utils';

    export let scope: string;
    export let model: any = null;

    let endpoints: LineageEndpoint[] = [];
    let selectedEndpointKey: string = '';
    let rows: LineageRow[] = [];

    const kindIcons: Record<LineageRow['kind'], string | null> = {
        master: 'ph-crown',
        contributor: 'ph-signpost',
        pipeline: 'ph-cube'
    };

    $: endpointOptions = endpoints.map(endpoint => ({
        value: `${endpoint.scope}:${endpoint.id}`,
        text: `${Language.translate(endpoint.scope, 'scopeNames')}`
    }));
    $: recordId = model?.get('id') ?? null;
    $: if (recordId) {
        loadTree(scope, recordId);
    }

    async function loadTree(entityName: string, id: string): Promise<void> {
        const endpoint = endpoints.find(item => `${item.scope}:${item.id}` === selectedEndpointKey) ?? null;
        const tree = await loadLineageTree(entityName, id, endpoint);
        if (entityName !== scope || id !== recordId) {
            return;
        }

        endpoints = tree.endpoints;
        selectedEndpointKey = `${tree.endpoint.scope}:${tree.endpoint.id}`;
        rows = buildLineageRows(tree, entityName, id);
    }

    function onEndpointChange(value: string): void {
        if (value === selectedEndpointKey) {
            return;
        }

        selectedEndpointKey = value;
        loadTree(scope, recordId);
    }

    function getLinkUrl(link: LineageLink | null): string | null {
        if (!link?.id) {
            return null;
        }

        return `#${link.type === 'consolidation' ? 'Consolidation' : 'DataPipeline'}/view/${link.id}`;
    }

    function getLinkTitle(link: LineageLink | null): string {
        if (!link) {
            return '';
        }

        return Language.translate(link.type === 'consolidation' ? 'Consolidation' : 'DataPipeline', 'scopeNames');
    }
</script>

<div class="lineage-tree">
    {#if endpoints.length > 0}
        <div class="lineage-endpoint">
            <select use:selectize={{ options: endpointOptions, value: selectedEndpointKey, disabled: endpoints.length === 1, onChange: onEndpointChange }}></select>
        </div>
    {/if}

    {#each rows as row (`${row.record.scope}:${row.record.id}`)}
        <div class="lineage-row" class:current={row.isCurrent} class:disabled={row.record.disabled}>
            {#each row.guides as continues, level}
                {@const isBranch = level === row.depth - 1 && row.link?.type === 'consolidation'}
                <span class="lineage-guide" class:continues class:branch={isBranch}>
                    {#if isBranch && getLinkUrl(row.link)}
                        <a class="lineage-connector horizontal" href={getLinkUrl(row.link)} title={getLinkTitle(row.link)}></a>
                    {/if}
                </span>
            {/each}

            <span class="lineage-icon-cell"
                  class:pipeline-above={row.link?.type === 'dataPipeline'}
                  class:pipeline-below={row.hasPipelineChild}
                  class:consolidation-below={row.hasConsolidationChildren}>
                <span class="lineage-icon">
                    {#if kindIcons[row.kind]}
                        <i class="ph {kindIcons[row.kind]}"></i>
                    {/if}
                </span>
                {#if row.hasPipelineChild && getLinkUrl(row.pipelineChildLink)}
                    <a class="lineage-connector vertical" href={getLinkUrl(row.pipelineChildLink)} title={getLinkTitle(row.pipelineChildLink)}></a>
                {/if}
            </span>

            <span class="lineage-text">
                <small class="lineage-scope">{Language.translate(row.record.scope, 'scopeNames')}</small>
                {#if !row.record.disabled}
                    <a class="lineage-name" href="#{row.record.scope}/view/{row.record.id}">{row.record.name}</a>
                {/if}
            </span>
        </div>
    {/each}
</div>

<style>
    .lineage-tree {
        margin-left: -2px;
        --lineage-cell-width: 28px;
        --lineage-icon-size: 20px;
        --lineage-row-gap: 12px;
        --lineage-icon-center: calc(50% - var(--lineage-row-gap) / 2);
        --lineage-icon-top: calc(var(--lineage-icon-center) - var(--lineage-icon-size) / 2);
        --lineage-icon-bottom: calc(var(--lineage-icon-center) + var(--lineage-icon-size) / 2);
        --lineage-line-color: var(--primary-border-color, #ccc);
    }

    .lineage-endpoint {
        margin-bottom: 20px;
    }

    .lineage-row {
        display: flex;
        align-items: stretch;
    }

    .lineage-guide,
    .lineage-icon-cell {
        position: relative;
        flex: 0 0 var(--lineage-cell-width);
    }

    .lineage-guide.continues::before,
    .lineage-guide.branch::before {
        content: '';
        position: absolute;
        left: 50%;
        top: 0;
        bottom: 0;
        border-left: 1px solid var(--lineage-line-color);
    }

    .lineage-guide.branch:not(.continues)::before {
        bottom: auto;
        height: var(--lineage-icon-center);
    }

    .lineage-guide.branch::after {
        content: '';
        position: absolute;
        left: 50%;
        right: 0;
        top: var(--lineage-icon-center);
        border-top: 1px solid var(--lineage-line-color);
    }

    .lineage-icon-cell.pipeline-above::before {
        content: '';
        position: absolute;
        left: 50%;
        top: 0;
        height: var(--lineage-icon-top);
        border-left: 1px dotted var(--lineage-line-color);
    }

    .lineage-icon-cell.pipeline-below::after,
    .lineage-icon-cell.consolidation-below::after {
        content: '';
        position: absolute;
        left: 50%;
        top: var(--lineage-icon-bottom);
        bottom: 0;
        border-left: 1px solid var(--lineage-line-color);
    }

    .lineage-icon-cell.pipeline-below::after {
        border-left-style: dotted;
    }

    .lineage-icon {
        position: absolute;
        z-index: 1;
        top: var(--lineage-icon-top);
        left: calc((var(--lineage-cell-width) - var(--lineage-icon-size)) / 2);
        width: var(--lineage-icon-size);
        height: var(--lineage-icon-size);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--lineage-line-color, #ccc);
        border-radius: 50%;
        background-color: #fff;
        font-size: 14px;
    }

    .lineage-row.current .lineage-icon {
        border-color: #000;
        color: #000;
    }

    .lineage-icon i {
        font-size: inherit;
        color: inherit;
    }

    .lineage-connector {
        position: absolute;
        z-index: 2;
        cursor: pointer;
        border-radius: 4px;
    }

    .lineage-connector.horizontal {
        left: 50%;
        right: 0;
        top: calc(var(--lineage-icon-center) - 4px);
        height: 8px;
    }

    .lineage-connector.vertical {
        left: calc(50% - 4px);
        width: 8px;
        top: var(--lineage-icon-bottom);
        bottom: 0;
    }

    .lineage-connector:hover {
        background: var(--link-color, #06c);
        opacity: .25;
    }

    .lineage-text {
        display: flex;
        flex-direction: column;
        justify-content: center;
        min-width: 0;
        min-height: calc(var(--lineage-icon-size) + var(--lineage-row-gap));
        padding: 0 0 var(--lineage-row-gap) 6px;
    }

    .lineage-scope {
        font-weight: 600;
        color: #666;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .lineage-name {
        color: var(--primary-font-color, #000);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .lineage-row.current .lineage-name {
        font-weight: 600;
    }

    .lineage-row.disabled .lineage-text {
        opacity: .6;
    }
</style>
