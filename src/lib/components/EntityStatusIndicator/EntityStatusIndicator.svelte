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
    import { Language } from '$lib/core/language';
    import { Metadata } from '$lib/core/metadata';
    import StatusDetailsModal from '$lib/components/EntityStatusIndicator/StatusDetailsModal/StatusDetailsModal.svelte';
    import type ListStatus from '$lib/components/EntityStatusIndicator/types/list-status';

    export let scope: string;

    export async function reload(): Promise<void> {
        await load();
    }

    let status: ListStatus | null = null;
    let showDetails: boolean = false;

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

{#if status}
    <span class="entity-status">
        <span class="status-label">{status.label}</span>: <span
            class="status-value style-{status.style ?? 'info'}">{status.value}</span>

        {#if status.details}
            <a href="javascript:" class="status-details" on:click={() => showDetails = true}>
                {Language.translate('viewDetails')}
            </a>
        {/if}
    </span>
{/if}

{#if showDetails && status?.details}
    <StatusDetailsModal header={status.label} details={status.details} onClose={() => showDetails = false}/>
{/if}

<style>
    .status-value {
        font-weight: bold;
    }

    /* The shades are taken from stream/notes/composer-update.tpl and from the usage field optionColors */
    .style-success {
        color: #08cc08;
    }

    .style-danger {
        color: #ff8080;
    }

    .style-warning {
        color: #ffbb3d;
    }

    .style-info {
        color: #6fb8ff;
    }

    .status-details {
        margin-left: 5px;
    }
</style>
