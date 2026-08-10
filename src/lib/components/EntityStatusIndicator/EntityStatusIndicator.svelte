<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { onMount } from 'svelte';
    import { ApiClient } from '$lib/core/api-client';
    import { Metadata } from '$lib/core/metadata';
    import type ListStatus from '$lib/components/EntityStatusIndicator/types/list-status';

    export let scope: string;

    export async function reload(): Promise<void> {
        await load();
    }

    let status: ListStatus | null = null;

    async function load(): Promise<void> {
        const url = scope ? Metadata.get(['clientDefs', scope, 'listStatus', 'url']) : null;
        if (!url) {
            return;
        }

        try {
            status = await ApiClient.get<ListStatus>(url);
        } catch {
            status = null;
        }
    }

    onMount(load);
</script>

{#if status && status.value}
    <span class="entity-status"
          class:style-success={status.style === 'success'}
          class:style-danger={status.style === 'danger'}
          class:style-warning={status.style === 'warning'}
          class:style-info={!status.style || status.style === 'info'}>
        <span class="status-label">{status.label}</span>: <span class="status-value">{status.value}</span>
    </span>
{/if}

<style>
    .status-value {
        font-weight: bold;
    }

    /* The shades are taken from stream/notes/composer-update.tpl and from the usage field optionColors */
    .style-success .status-value {
        color: #08cc08;
    }

    .style-danger .status-value {
        color: #ff8080;
    }

    .style-warning .status-value {
        color: #ffbb3d;
    }

    .style-info .status-value {
        color: #6fb8ff;
    }
</style>
