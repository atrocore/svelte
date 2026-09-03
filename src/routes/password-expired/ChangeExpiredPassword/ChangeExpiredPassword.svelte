<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import StandalonePageLayout from "$lib/components/StandalonePageLayout/StandalonePageLayout.svelte";
    import LogoCard from "$lib/components/LogoCard/LogoCard.svelte";
    import { Config } from "$lib/core/config";
    import { Language } from "$lib/core/language";
    import { ApiClient, ApiError } from "$lib/core/api-client";
    import TextInput from "$lib/components/TextInput/TextInput.svelte";

    const description = Language.translate('passwordExpiredForm', 'messages', 'User');

    const passwordLabel = Language.translate('newPassword', 'fields', 'User');

    const passwordRegexPattern: string | null = Config.get('passwordRegexPattern') || null;
    let passwordRegex: RegExp | null = null;
    if (passwordRegexPattern) {
        try {
            passwordRegex = new RegExp(passwordRegexPattern);
        } catch {
            passwordRegex = null;
        }
    }

    let password = '';
    let passwordConfirm = '';
    let passwordInvalid = false;
    let passwordConfirmInvalid = false;
    let passwordError: string | null = null;
    let passwordConfirmError: string | null = null;
    let submitting = false;
    let success = false;

    $: formInvalid = !password
        || !passwordConfirm
        || (passwordRegex !== null && !passwordRegex.test(password))
        || password !== passwordConfirm;

    $: if (passwordConfirm && password !== passwordConfirm) {
        passwordConfirmInvalid = true;
        passwordConfirmError = Language.translate('fieldBadPasswordConfirm', 'messages').replace('{field}', passwordLabel);
    } else {
        passwordConfirmInvalid = false;
        passwordConfirmError = null;
    }

    $: if (!password) {
        passwordInvalid = false;
        passwordError = null;
    } else if (passwordRegex && !passwordRegex.test(password)) {
        passwordInvalid = true;
        passwordError = Language.translate('newPasswordHint', 'messages', 'User');
    } else {
        passwordInvalid = false;
        passwordError = null;
    }

    async function handleSubmit(): Promise<void> {
        if (!password) {
            passwordInvalid = true;
            passwordError = Language.translate('fieldIsRequired', 'messages').replace('{field}', passwordLabel);
            return;
        }

        if (passwordRegex && !passwordRegex.test(password)) {
            passwordInvalid = true;
            passwordError = Language.translate('newPasswordHint', 'messages', 'User');
            return;
        }

        if (password !== passwordConfirm) {
            passwordConfirmInvalid = true;
            passwordConfirmError = Language.translate('fieldBadPasswordConfirm', 'messages').replace('{field}', passwordLabel);
            return;
        }

        submitting = true;

        try {
            await ApiClient.post('User/changeExpiredPassword', {password});
            success = true;
        } catch (e) {
            if (e instanceof ApiError) {
                passwordInvalid = true;
                passwordError = typeof e.body === 'string' && e.body
                    ? e.body
                    : e.toString();
            } else {
                passwordInvalid = true;
                passwordError = String(e);
            }
        } finally {
            submitting = false;
        }
    }
</script>

<StandalonePageLayout>
    <LogoCard>
        <div class="body">
            {#if success}
                <h1 class="page-title success">{Language.translate('passwordChangedByRequest', 'messages', 'User')}</h1>
                <button type="button" class="primary submit-button" on:click={() => window.location.reload()}>
                    <i class="ph ph-sign-in"></i>
                    <span>{Language.translate('Login', 'labels', 'User')}</span>
                </button>
            {:else}
                <h1 class="page-title">{Language.translate('Change Password', 'labels', 'User')}</h1>
                <p class="page-subtitle">{description}</p>

                <form on:submit|preventDefault={handleSubmit}>
                    <TextInput
                        label={passwordLabel}
                        id="field-new-password"
                        name="password"
                        type="password"
                        bind:value={password}
                        invalid={passwordInvalid}
                    />

                    <TextInput
                        label={Language.translate('newPasswordConfirm', 'fields', 'User')}
                        id="field-new-password-confirm"
                        name="passwordConfirm"
                        type="password"
                        bind:value={passwordConfirm}
                        invalid={passwordConfirmInvalid}
                        error={passwordConfirmError}
                    />

                    {#if passwordError}
                        <div class="password-policy-message field-error">{passwordError}</div>
                    {:else if passwordRegex}
                        <div class="password-policy-message field-hint">{Language.translate('newPasswordHint', 'messages', 'User')}</div>
                    {/if}

                    <button type="submit" class="primary submit-button" disabled={submitting || formInvalid}>
                        {#if submitting}
                            <i class="ph ph-circle-notch ph-spin"></i>
                        {:else}
                            <i class="ph ph-lock"></i>
                        {/if}
                        <span>{Language.translate('Save Password', 'labels', 'User')}</span>
                    </button>
                </form>
            {/if}
        </div>
    </LogoCard>
</StandalonePageLayout>

<style>
    label {
        font-weight: 500;
    }

    .body {
        padding: 0 20px 20px;
    }

    .page-title {
        margin: 20px 0 10px;
        font-size: 18px;
        font-weight: 600;
        text-align: center;
        color: #222;
    }

    .page-title.success {
        font-weight: 400;
    }

    .page-subtitle {
        margin: 0 0 25px;
        font-size: 12px;
        text-align: center;
        color: #666;
    }

    .password-policy-message {
        margin-bottom: 16px;
    }

    .field-error {
        color: #b71c1c;
        font-size: 12px;
    }

    .field-hint {
        color: #888;
        font-size: 12px;
    }

    .submit-button {
        width: 100%;
        padding: 10px;
        border-radius: 8px;
        margin-top: 20px;
    }

    .submit-button:disabled {
        opacity: 0.6;
        cursor: default;
    }
</style>
