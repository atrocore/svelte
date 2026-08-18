<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { Language } from "$lib/core/language";

    export let current: number = 1;
    export let total: number = 0;
    export let onPrev: () => void;
    export let onNext: () => void;
    export let onSaveAll: () => void;
    export let onCancelAll: () => void;
</script>

<div class="inline-edit-multi-toolbar">
    <div class="nav-group">
        <button type="button" class="small" on:click={onPrev} title={Language.translate('Previous Field')}>
            <i class="ph ph-caret-up"></i>
        </button>
        <div class="counter">{current} / {total}</div>
        <button type="button" class="small" on:click={onNext} title={Language.translate('Next Field')}>
            <i class="ph ph-caret-down"></i>
        </button>
    </div>

<!--    <div class="divider"></div>-->

    <div class="actions">
        <button type="button" class="small" on:click={onSaveAll}>
            <i class="ph ph-check"></i>
            <span>{Language.translate('Save')}</span>
        </button>
        <button type="button" class="small" on:click={onCancelAll}>
            <i class="ph ph-x"></i>
            <span>{Language.translate('Cancel')}</span>
        </button>
    </div>
</div>

<style>
    button {
        border: 0;
        background-color: transparent;
    }

    button.small > i {
        font-size: 14px;
    }

    .inline-edit-multi-toolbar {
        position: fixed;
        top: 66px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 2600;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 5px;
        background: rgb(218 233 247 / 90%);
        border: 1px solid #8cc7ff;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgb(15 23 42 / 15%);
    }

    .nav-group {
        display: flex;
        align-items: center;
        gap: 5px;
    }

    .counter {
        font-size: 12px;
        font-weight: 500;
        color: #333;
    }

    .actions {
        display: flex;
        align-items: stretch;
        margin: 2px 0;
    }

    .actions button {
        color: #000;
        border-left: 1px solid #8cc7ff;
        border-radius: 0;
        display: flex;
        padding-left: 12px;
        padding-right: 12px;
    }
</style>
