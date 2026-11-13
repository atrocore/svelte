<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import {onMount} from "svelte";
    import {Config} from "$lib/core/config";
    import {Language} from "$lib/core/language";
    import {getOidcLoginUrl} from "./utils/sso";
    import {takeSignInError} from "./utils/sign-in-cookies";
    import type {SignIn} from "./types/sign-in";
    import {ApiError} from "$lib/core/api-client";
    import {Notifier} from "$lib/dom/notifier";
    import TextInput from "$lib/components/TextInput/TextInput.svelte";

    export let signIn: SignIn;
    export let onSignedIn: () => void;
    export let onForgotPassword: (username: string) => void = () => {
    };

    const demo: { username?: string; password?: string } | null = Config.get('demo');
    const hasOidcLogin = !!Config.get('hasOidcLogin');
    const hasLoginForm = !Config.get('ssoOnly');
    const hasPasswordChangeRequest = !!Config.get('passwordChangeRequestAvailable');

    let username = demo?.username ? demo.username : (localStorage.getItem('lastAuthUserName') || '');
    let password = demo?.username ? (demo.password || '') : '';
    let rememberUsername = demo?.username ? false : localStorage.getItem('rememberUserName') === 'true';
    let submitting = false;
    let usernameInvalid = false;
    let passwordInvalid = false;
    let credentialsError: string | null = null;
    let usernameInputEl: TextInput;
    let passwordInputEl: TextInput;
    let ssoRedirecting = false;
    let ssoError: string | null = null;

    onMount(() => {
        ssoError = takeSignInError();

        if (demo?.username) {
            return;
        }

        if (username) {
            passwordInputEl.focus();
        } else {
            usernameInputEl.focus();
        }
    });

    /**
     * The sign-in URL is requested on the click: it starts the sign-in, which is valid for a limited time.
     */
    async function onSsoButtonClick(): Promise<void> {
        ssoRedirecting = true;
        ssoError = null;

        try {
            window.location.href = await getOidcLoginUrl();
        } catch (e) {
            ssoRedirecting = false;
            ssoError = e instanceof ApiError ? e.getReason() : String(e);
        }
    }

    function clearCredentialsError() {
        usernameInvalid = false;
        passwordInvalid = false;
        credentialsError = null;
    }

    function storeRememberedUsername(): void {
        if (rememberUsername) {
            localStorage.setItem('rememberUserName', 'true');
            localStorage.setItem('lastAuthUserName', username);
        } else {
            localStorage.removeItem('rememberUserName');
            localStorage.removeItem('lastAuthUserName');
        }
    }

    async function handleSubmit() {
        const usernameEmpty = !username.trim();
        const passwordEmpty = !password.trim();

        if (usernameEmpty || passwordEmpty) {
            usernameInvalid = usernameEmpty;
            passwordInvalid = passwordEmpty;
            credentialsError = Language.translate('usernameOrPasswordCantBeEmpty', 'messages', 'User');

            if (usernameEmpty) {
                usernameInputEl.focus();
            } else {
                passwordInputEl.focus();
            }

            return;
        }

        clearCredentialsError();
        submitting = true;

        try {
            await signIn(username, password);
        } catch (e) {
            submitting = false;

            if (!(e instanceof ApiError) || e.status >= 500) {
                Notifier.notify(String(e), {type: 'error'});
                return;
            }

            usernameInvalid = true;
            passwordInvalid = true;
            credentialsError = e.getReason() || Language.translate('wrongUsernamePasword', 'messages', 'User');
            return;
        }

        storeRememberedUsername();
        onSignedIn();
    }
</script>

{#if hasOidcLogin}
    <button type="button" class="sso-button" disabled={ssoRedirecting} on:click={onSsoButtonClick}>
        <i class="ph ph-key"></i> <span>{Language.translate('ContinueWithSso')}</span>
    </button>

    {#if ssoError}
        <div class="error-message" role="alert">{ssoError}</div>
    {/if}

    {#if hasLoginForm}
        <div class="divider">
            <span>{Language.translate('OrContinueWithUsername')}</span>
        </div>
    {/if}
{/if}

{#if hasLoginForm}
    <form on:submit|preventDefault={handleSubmit}>
        <TextInput
                label={Language.translate('Username')}
                id="field-username"
                name="username"
                bind:value={username}
                bind:this={usernameInputEl}
                invalid={usernameInvalid}
                on:input={clearCredentialsError}
        />

        <TextInput
                label={Language.translate('Password')}
                id="field-password"
                name="password"
                type="password"
                bind:value={password}
                bind:this={passwordInputEl}
                invalid={passwordInvalid}
                on:input={clearCredentialsError}
        />

        <div class="form-row">
            <label class="remember-username">
                <input type="checkbox" id="field-remember-username" name="rememberUsername"
                       bind:checked={rememberUsername}>
                <span>{Language.translate('RememberUsername')}</span>
            </label>
            {#if hasPasswordChangeRequest}
                <a href="javascript:" class="forgot-password"
                   on:click|preventDefault={() => onForgotPassword(username)}>{Language.translate('Forgot Password?', 'labels', 'User')}</a>
            {/if}
        </div>

        <button type="submit" class="primary login-button" disabled={submitting}>
            {#if submitting}
                <i class="ph ph-circle-notch ph-spin"></i>
            {:else}
                <i class="ph ph-sign-in"></i>
            {/if}
            <span>{Language.translate('Login')}</span>
        </button>

        {#if credentialsError}
            <div class="error-message" role="alert">{credentialsError}</div>
        {/if}
    </form>
{/if}

<style>
    label {
        font-weight: 500;
    }

    .sso-button {
        width: 100%;
        padding: 10px;
        border-radius: 8px;
    }

    .divider {
        display: flex;
        align-items: center;
        margin: 30px 0;
        color: #888;
        font-size: 13px;
    }

    .divider::before,
    .divider::after {
        content: "";
        flex: 1;
        border-top: 1px solid #dcdcdc;
    }

    .divider span {
        padding: 0 10px;
    }

    .error-message {
        margin-top: 16px;
        padding: 4px 10px;
        min-height: 18px;
        color: #b71c1c;
        font-size: 13px;
        text-align: center;
    }

    .form-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
        font-size: 13px;
    }

    .form-row label {
        color: #333;
    }

    .remember-username {
        display: flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        user-select: none;
        margin-bottom: 0;
    }

    .remember-username input {
        cursor: pointer;
        margin: 0;
    }

    .forgot-password {
        text-decoration: none;
    }

    .forgot-password:hover {
        text-decoration: underline;
    }

    .login-button {
        width: 100%;
        padding: 10px;
        border-radius: 8px;
    }

    .login-button:disabled {
        opacity: 0.6;
        cursor: default;
    }
</style>
