<script lang="ts">
    import { onMount } from 'svelte';

    import { Language } from "$lib/core/language"
    import { startStopJm } from "./utils/job-manager";

    export let isOpen = false;
    export let close: any;
    export let icon: any;
    export let jmPaused;

    let panel: any;

    function handleClickOutside(event: any) {
        if (panel && !panel.contains(event.target) && icon && !icon.contains(event.target) && isOpen === true) {
            close();
        }
    }

    onMount(() => {
        document.addEventListener('click', handleClickOutside);

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    });
</script>

{#if isOpen}
    <div bind:this={panel} class="queue-panel-container">
        <div class="panel panel-default">
            <div class="panel-heading clearfix">
                <span class="panel-heading-title">{Language.translate('jobManager')}</span>
                <span class="pull-right">
                    <a href="/" class="close" on:click={event=>{event.preventDefault();close();}}><span
                            aria-hidden="true">×</span></a>
               </span>
            </div>
            <div class="panel-body">
                <div class="btn-container">
                    <button title="{Language.translate('View List')}"
                            on:click={e => {window.location.href = '#Job'; close();}}
                            class="primary outline"><i
                            class="ph ph-list"></i><span>{Language.translate('View List')}</span></button>
                    {#if jmPaused}
                        <button title="{Language.translate('Start')}" class="primary outline"
                                on:click={event=>{event.preventDefault();startStopJm(false);}}><i
                                class="ph ph-play"></i><span>{Language.translate('Start')}</span></button>
                    {:else}
                        <button title="{Language.translate('Pause')}" class="primary outline"
                                on:click={event=>{event.preventDefault();startStopJm(true);}}><i
                                class="ph ph-pause"></i><span>{Language.translate('Pause')}</span></button>
                    {/if}
                </div>
                <div class="list-container">{Language.translate('Loading...')}</div>
            </div>
        </div>
    </div>
{/if}

<style>
    .close {
        margin-left: 10px;
    }
</style>
