<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    export let label: string = 'Show more';
    export let visible: boolean = true;
    export let loading: boolean = false;
    export let onClick: () => void = () => {
    };

    function handleClick() {
        if (loading) {
            return;
        }
        onClick();
    }
</script>

{#if visible}
    <div class="show-more" class:loading on:click={handleClick}>
        <i class="ph" class:ph-arrow-down={!loading} class:ph-spin={loading} class:ph-circle-notch={loading}></i>
        <span>{label}</span>
    </div>
{/if}

<style>
    .show-more {
        width: 100%;
        padding: 8px;
        border-top: 1px solid var(--secondary-border-color);
        text-align: center;
        color: #06C;
        cursor: pointer;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        font-weight: 500;
        background: #F0F6FC;
        /*border-top: 1px solid rgba(0, 102, 204, 0.25);*/
        /*border-top: 1px solid var(--secondary-border-color);*/
        /*border-bottom: 1px solid rgba(0, 102, 204, 0.25);*/
        /*background: rgba(0, 102, 204, 0.04);*/
    }

    .show-more.loading {
        cursor: default;
        opacity: 0.75;
    }

    .show-more i {
        font-size: 18px;
    }

    .show-more:not(.loading):hover {
        background-color: rgba(0, 102, 204, 0.1);
    }
</style>