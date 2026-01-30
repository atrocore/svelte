<script lang="ts">
    import JobManagerPanel from "./JobManagerPanel/JobManagerPanel.svelte";
    import { Language } from "$lib/core/language"
    import BaseNavbarButton from "$lib/components/navbar-buttons/BaseNavbarButton/BaseNavbarButton.svelte";
    import { onMount } from "svelte";

    export let renderTable = (): void => {
        // should render table
    };

    let jmPaused = false;

    function onClosePanel(): void {
        window.dispatchEvent(new Event('jobManagerPanelClosed'));
    }

    function updateJmPaused(event: any): void {
        jmPaused = !!(event.detail.jmPaused);
    }

    onMount(() => {
        window.addEventListener('publicDataFetched', updateJmPaused);
        return () => {
            window.removeEventListener('publicDataFetched', updateJmPaused);
        }
    })
</script>

<BaseNavbarButton
        title={Language.translate('jobManager')}
        iconClass="ph ph-list-checks"
        on:close={onClosePanel}
        on:open={renderTable}
>
    <svelte:fragment slot="panel" let:isOpen let:iconElement let:close>
        <JobManagerPanel
                icon={iconElement}
                {jmPaused}
                {isOpen}
                {close}
        />
    </svelte:fragment>
    <i slot="badge-indicator" class={"ph-fill ph-pause-circle pause-icon "+(jmPaused?'':'hidden')}></i>
</BaseNavbarButton>

<style>
    .pause-icon {
        position: absolute;
        top: 5%;
        right: -5%;
        z-index: 10;
        color: #ef990e;
        font-size: 16px;
    }
</style>