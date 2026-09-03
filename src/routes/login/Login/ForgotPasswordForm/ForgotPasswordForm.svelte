<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { Language } from '$lib/core/language';
    import { ApiClient, ApiError } from '$lib/core/api-client';
    import { Notifier } from '$lib/dom/notifier';
    import TextInput from '$lib/components/TextInput/TextInput.svelte';

    export let onBack: () => void = () => {};
    export let initialUserName: string = '';

    let userName = initialUserName;
    let emailAddress = '';
    let userNameInvalid = false;
    let emailInvalid = false;
    let submitting = false;
    let errorMessage: string | null = null;

    $: formInvalid = !userName.trim() || !emailAddress.trim();

    async function handleSubmit(): Promise<void> {
        const userNameEmpty = !userName.trim();
        const emailEmpty = !emailAddress.trim();

        if (userNameEmpty || emailEmpty) {
            userNameInvalid = userNameEmpty;
            emailInvalid = emailEmpty;
            return;
        }

        userNameInvalid = false;
        emailInvalid = false;
        errorMessage = null;
        submitting = true;

        try {
            await ApiClient.post('User/passwordChangeRequest', {
                userName,
                emailAddress,
                url: window.location.href
            });
            onBack();
            Notifier.notify(Language.translate('uniqueLinkHasBeenSent', 'messages', 'User'), 'success');
        } catch (e) {
            if (e instanceof ApiError && e.status === 404) {
                errorMessage = Language.translate('userNameEmailAddressNotFound', 'messages', 'User');
            } else if (e instanceof ApiError && e.status === 403) {
                errorMessage = Language.translate('forbidden', 'messages', 'User');
            } else {
                errorMessage = String(e);
            }
        } finally {
            submitting = false;
        }
    }
</script>

<h1 class="page-title">{Language.translate('Password Change Request', 'labels', 'User')}</h1>
<p class="page-subtitle">{Language.translate('passwordChangeRequestDescription', 'messages', 'User')}</p>

<form on:submit|preventDefault={handleSubmit}>
    <TextInput
        label={Language.translate('Username')}
        id="field-forgot-username"
        name="userName"
        bind:value={userName}
        invalid={userNameInvalid}
        error={userNameInvalid ? Language.translate('userCantBeEmpty', 'messages', 'User') : null}
        autocomplete="off"
        autocapitalize="off"
    />

    <TextInput
        label={Language.translate('Email Address', 'labels', 'User')}
        id="field-forgot-email"
        name="emailAddress"
        bind:value={emailAddress}
        invalid={emailInvalid}
        error={emailInvalid ? Language.translate('emailAddressCantBeEmpty', 'messages', 'User') : null}
        autocomplete="off"
        autocapitalize="off"
    />

    {#if errorMessage}
        <div class="error-message" role="alert">{errorMessage}</div>
    {/if}

    <button type="submit" class="primary submit-button" disabled={submitting || formInvalid}>
        {#if submitting}
            <i class="ph ph-circle-notch ph-spin"></i>
        {:else}
            <i class="ph ph-paper-plane-tilt"></i>
        {/if}
        <span>{Language.translate('Submit')}</span>
    </button>

    <a href="javascript:" class="back-to-login" on:click|preventDefault={onBack}>{Language.translate('Back to login', 'labels', 'User')}</a>
</form>

<style>
    label {
        font-weight: 500;
    }

    .page-title {
        margin: 0 0 10px;
        font-size: 18px;
        font-weight: 600;
        text-align: center;
        color: #222;
    }

    .page-subtitle {
        margin: 0 0 25px;
        font-size: 12px;
        text-align: center;
        color: #666;
    }

    .error-message {
        margin-top: 16px;
        margin-bottom: 20px;
        padding: 4px 10px;
        min-height: 18px;
        color: #b71c1c;
        font-size: 13px;
        text-align: center;
    }

    .submit-button {
        width: 100%;
        padding: 10px;
        border-radius: 8px;
    }

    .submit-button:disabled {
        opacity: 0.6;
        cursor: default;
    }

    .back-to-login {
        display: block;
        margin-top: 16px;
        text-align: center;
        font-size: 13px;
        text-decoration: none;
    }

    .back-to-login:hover {
        text-decoration: underline;
    }
</style>
