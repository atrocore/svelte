<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { afterUpdate } from "svelte";

    import SpinnerIcon from "$lib/components/loaders/SpinnerIcon/SpinnerIcon.svelte";

    export let applicationName: string = 'AtroCore';
    export let logoPath: string | null = null;
    export let logFilePath: string;
    export let restoreLink: string | null = null;

    let showLogs: boolean = false;
    let updateStarted: boolean = false;
    let seconds: number = 0;
    let autoScroll: boolean = true;
    let fullLogs: string = '';
    let lastLine: string;
    let logsContainer: Element;

    $: if (fullLogs) {
        const lines = fullLogs.trim().split('\n');
        lastLine = formatLogLine(lines.pop() || '');
    } else if (!updateStarted) {
        lastLine = 'Starting...';
    } else {
        lastLine = '';
    }

    afterUpdate(() => {
        if (logsContainer && autoScroll) {
            logsContainer.scrollTo(0, logsContainer.scrollHeight)
        }
    });

    function showLogsButtonHandler(): void {
        showLogs = !showLogs;
        if (!showLogs) {
            autoScroll = true;
        }
    }

    function logsScrollHandler(e: Event): void {
        const target = e.currentTarget as Element;
        autoScroll = target.scrollHeight - target.scrollTop === target.clientHeight;
    }

    function formatLogLine(line: string): string {
        return line
            .replace(/^\d{2,4}.\d{2}.\d{2,4} \d{2}:\d{2}:\d{2}/g, '')
            .replace(/^[\-\|\s]+/, '');
    }

    setInterval(async () => {
        try {
            const response = await fetch(logFilePath, {cache: "no-store"});
            seconds += 1;

            if (response.ok) {
                fullLogs = (await response.text()).trim();

                if (fullLogs.search("composer") >= 0) {
                    updateStarted = true;
                }

                if (seconds > 65 && !updateStarted) {
                    fullLogs = 'Something wrong. Please, reboot the server.';
                }
            } else {
                if (updateStarted) {
                    setTimeout(() => {
                        location.reload();
                    }, 2000);
                } else if (seconds > 65) {
                    fullLogs = 'Something wrong. Please, reboot the server.';
                }
            }
        } catch (error) {
            console.error('Error: ', error);
        }
    }, 1000);
</script>

<div id="login" class="panel panel-default panel-updating">
    <div class="panel-heading">
        <div class="logo-container">
            {#if logoPath}
                <img src={logoPath} class="logo" alt={applicationName}>
            {/if}
        </div>
    </div>
    <div class="panel-body">
        <div class="form-group"><h3>System is updating...</h3>
            <section class="progress-section">
                <SpinnerIcon size={40} thickness={5}/>
                <h5>{lastLine}</h5>
            </section>
            <section class="logs-section">
                <div class="buttons">
                    <button disabled={!fullLogs} on:click={showLogsButtonHandler}>
                        <i class="ph ph-list"></i><span>{showLogs ? 'Hide' : 'Show'} logs</span>
                    </button>
                    {#if restoreLink}
                        <a href={restoreLink} target="_blank" role="button"
                           style="float: right;"><i class="ph ph-clock-counter-clockwise"></i> <span>Recovery Instructions</span></a>
                    {/if}
                </div>
                {#if showLogs && fullLogs}
                    <hr>
                    <pre class="logs-container" bind:this={logsContainer} on:scroll={logsScrollHandler}>{fullLogs}</pre>
                {/if}
            </section>
        </div>
    </div>
</div>

<style>
    .progress-section {
        margin: 4em 0 3em;
        text-align: center;
    }

    h5 {
        font-weight: 400;
    }

    button > i {
        margin-right: .3em;
    }

    .logs-container {
        max-height: 300px;
        overflow: auto;
    }
</style>