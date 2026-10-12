<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { Language } from '$lib/core/language';
    import type { LineageRecord } from './types/lineage-record';
    import { loadLineageTree } from './utils/tree-utils';

    export let scope: string;
    export let model: any = null;

    let records: LineageRecord[] = [];

    $: recordId = model?.get('id') ?? null;
    $: if (recordId) {
        loadTree(scope, recordId);
    }

    async function loadTree(entityName: string, id: string): Promise<void> {
        const response = await loadLineageTree(entityName, id);
        if (entityName === scope && id === recordId) {
            records = response.records;
        }
    }
</script>

<ul class="lineage-tree">
    {#each records as record (`${record.scope}:${record.id}`)}
        <li class:current={record.scope === scope && record.id === recordId} class:disabled={record.disabled}>
            <span class="lineage-scope">{Language.translate(record.scope, 'scopeNames')}</span>
            {#if !record.disabled}
                <a class="lineage-name" href="#{record.scope}/view/{record.id}">{record.name}</a>
            {/if}
        </li>
    {/each}
</ul>

<style>
    .lineage-tree {
        list-style: none;
        margin: 0;
        padding: 0;
    }

    .lineage-tree li {
        display: flex;
        flex-direction: column;
        padding: 4px 0;
    }

    .lineage-scope {
        font-weight: 600;
    }

    .lineage-tree li.current .lineage-name {
        font-weight: 600;
    }

    .lineage-tree li.disabled {
        opacity: .6;
    }
</style>
