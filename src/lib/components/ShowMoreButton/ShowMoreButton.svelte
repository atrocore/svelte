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
        onClick();
    }
</script>

{#if visible}
    <div class="show-more" on:click={handleClick}>
        <i class="ph ph-arrows-clockwise" class:ph-spin={loading}></i>
        <span>{label}</span>
    </div>
{/if}

<style>
    .show-more {
        width: 100%;
        padding: 15px;
        border-top: 1px solid var(--secondary-border-color);
        text-align: center;
        color: var(--primary-font-color);
        cursor: pointer;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
    }

    .show-more i {
        font-size: 18px;
    }

    .show-more:hover {
        background-color: var(--hover-color, rgba(0, 0, 0, 0.03));
    }
</style>