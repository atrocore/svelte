<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    export let label: string;
    export let id: string;
    export let name: string = id;
    export let type: 'text' | 'password' = 'text';
    export let value: string = '';
    export let invalid: boolean = false;
    export let error: string | null = null;
    export let hint: string | null = null;
    export let autocomplete: string | undefined = undefined;
    export let autocapitalize: string | undefined = undefined;

    let showPassword = false;
    let inputEl: HTMLInputElement;

    export function focus(): void {
        inputEl?.focus();
    }
</script>

<div class="form-group" class:has-error={invalid}>
    <label for={id}>{label}</label>

    {#if type === 'password'}
        <div class="password-input">
            {#if showPassword}
                <input
                    type="text"
                    {id}
                    {name}
                    bind:value
                    bind:this={inputEl}
                    {autocomplete}
                    {autocapitalize}
                    on:input
                >
            {:else}
                <input
                    type="password"
                    {id}
                    {name}
                    bind:value
                    bind:this={inputEl}
                    {autocomplete}
                    {autocapitalize}
                    on:input
                >
            {/if}
            <button
                type="button"
                class="toggle-password"
                on:click={() => showPassword = !showPassword}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
                <i class="ph {showPassword ? 'ph-eye-slash' : 'ph-eye'}"></i>
            </button>
        </div>
    {:else}
        <input
            type="text"
            {id}
            {name}
            bind:value
            bind:this={inputEl}
            {autocomplete}
            {autocapitalize}
            on:input
        >
    {/if}

    {#if error}
        <div class="field-error">{error}</div>
    {:else if hint}
        <div class="field-hint">{hint}</div>
    {/if}
</div>

<style>
    .form-group {
        margin-bottom: 16px;
    }

    .form-group label {
        display: block;
        margin-bottom: 6px;
        font-size: 13px;
        color: #333;
    }

    .form-group input {
        width: 100%;
        padding: 8px 10px;
        border: 1px solid #dcdcdc;
        border-radius: 6px;
        font-size: 14px;
        box-sizing: border-box;
    }

    .form-group input:focus {
        outline: none;
        border-color: #06c;
    }

    .password-input {
        position: relative;
    }

    .password-input input {
        padding-right: 36px;
    }

    .toggle-password {
        position: absolute;
        top: 50%;
        right: 6px;
        transform: translateY(-50%);
        display: flex;
        align-items: center;
        padding: 4px;
        background: none;
        border: none;
        color: #666;
        cursor: pointer;
    }

    .toggle-password:hover {
        color: #333;
    }

    .form-group.has-error label {
        color: #b71c1c;
    }

    .form-group.has-error input {
        border-color: #b71c1c;
    }

    .form-group.has-error input:focus {
        border-color: #b71c1c;
    }

    .field-error {
        margin-top: 6px;
        color: #b71c1c;
        font-size: 12px;
    }

    .field-hint {
        margin-top: 6px;
        color: #888;
        font-size: 12px;
    }
</style>
