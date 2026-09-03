<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { onMount } from "svelte";
    import { Config } from "$lib/core/config";
    import { Language } from "$lib/core/language";
    import { login } from "./utils/login";
    import { getOidcLoginUrl } from "./utils/sso";
    import { ApiError } from "$lib/core/api-client";
    import { Notifier } from "$lib/dom/notifier";
    import { UserData } from "$lib/core/user-data";
    import TextInput from "$lib/components/TextInput/TextInput.svelte";

    export let onLogin: (data: any) => void = () => {};
    export let onForgotPassword: (username: string) => void = () => {};

    const demo: { username?: string; password?: string } | null = Config.get('demo');
    const hasOidcLogin = !!Config.get('hasOidcLogin');

    let username = demo?.username ? demo.username : (localStorage.getItem('lastAuthUserName') || '');
    let password = demo?.username ? (demo.password || '') : '';
    let rememberUsername = demo?.username ? false : localStorage.getItem('rememberUserName') === 'true';
    let submitting = false;
    let usernameInvalid = false;
    let passwordInvalid = false;
    let credentialsError: string | null = null;
    let usernameInputEl: TextInput;
    let passwordInputEl: TextInput;
    let oidcLoginUrl: string | null = null;
    let ssoError: string | null = null;

    onMount(() => {
        const urlParams = new URLSearchParams(window.location.search);

        if (urlParams.has('ssoError')) {
            ssoError = urlParams.get('ssoError');
            history.replaceState(null, '', window.location.pathname);
        }

        if (hasOidcLogin) {
            getOidcLoginUrl().then(url => oidcLoginUrl = url);
        }

        if (demo?.username) {
            return;
        }

        if (username) {
            passwordInputEl.focus();
        } else {
            usernameInputEl.focus();
        }
    });

    function onSsoButtonClick() {
        if (oidcLoginUrl) {
            window.location.href = oidcLoginUrl;
        }
    }

    function clearCredentialsError() {
        usernameInvalid = false;
        passwordInvalid = false;
        credentialsError = null;
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
            const data = await login(username, password);

            UserData.set(data);

            onLogin({
                auth: {
                    userName: username,
                    token: data.token,
                },
                user: data.user,
                preferences: data.preferences,
                acl: data.acl,
                settings: data.settings,
                appParams: data.appParams,
            });

            if (rememberUsername) {
                localStorage.setItem('rememberUserName', 'true');
                localStorage.setItem('lastAuthUserName', username);
            } else {
                localStorage.removeItem('rememberUserName');
                localStorage.removeItem('lastAuthUserName');
            }
        } catch (e) {
            submitting = false;

            if (e instanceof ApiError && e.status >= 500) {
                Notifier.notify(e.toString(), {type: 'error'});
                return;
            }

            usernameInvalid = true;
            passwordInvalid = true;
            credentialsError = Language.translate('wrongUsernamePasword', 'messages', 'User');
        }
    }
</script>

{#if hasOidcLogin}
    <button type="button" class="sso-button" disabled={!oidcLoginUrl} on:click={onSsoButtonClick}>
        <i class="ph ph-key"></i> <span>{Language.translate('ContinueWithSso')}</span>
    </button>

    {#if ssoError}
        <div class="error-message" role="alert">{ssoError}</div>
    {/if}

    <div class="divider">
        <span>{Language.translate('OrContinueWithUsername')}</span>
    </div>
{/if}

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
            <input type="checkbox" id="field-remember-username" name="rememberUsername" bind:checked={rememberUsername}>
            <span>{Language.translate('RememberUsername')}</span>
        </label>
        <a href="javascript:" class="forgot-password" on:click|preventDefault={() => onForgotPassword(username)}>{Language.translate('Forgot Password?', 'labels', 'User')}</a>
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
