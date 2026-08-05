<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { onMount } from "svelte";
    import StandalonePageLayout from "$lib/components/StandalonePageLayout/StandalonePageLayout.svelte";
    import { Config } from "$lib/core/config";
    import {Language} from "$lib/core/language";
    import { login } from "./utils/login";
    import { getOidcLoginUrl } from "./utils/sso";
    import { ApiError } from "$lib/core/api-client";
    import { Notifier } from "$lib/dom/notifier";

    export let onLogin: (data: any) => void = () => {};
    export let onForgotPassword: () => void = () => {};

    const companyLogoId = Config.get('companyLogoId');
    const logoSrc = companyLogoId
        ? `/?entryPoint=LogoImage&id=${companyLogoId}&t=${companyLogoId}`
        : '/client/modules/treo-core/img/core_logo_dark.svg';

    const demo: { username?: string; password?: string } | null = Config.get('demo');
    const hasOidcLogin = !!Config.get('hasOidcLogin');

    let username = demo?.username ? demo.username : (localStorage.getItem('lastAuthUserName') || '');
    let password = demo?.username ? (demo.password || '') : '';
    let rememberUsername = demo?.username ? false : localStorage.getItem('rememberUserName') === 'true';
    let submitting = false;
    let usernameInvalid = false;
    let passwordInvalid = false;
    let credentialsError: string | null = null;
    let usernameInputEl: HTMLInputElement;
    let passwordInputEl: HTMLInputElement;
    let showPassword = false;
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

    function onPasswordInput(e: Event) {
        password = (e.currentTarget as HTMLInputElement).value;
        clearCredentialsError();
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

<StandalonePageLayout>
    <div id="login">
        <div class="logo-container">
            <img src={logoSrc} class="logo" alt="Logo">
        </div>

        <div class="login-body">
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
                <div class="form-group" class:has-error={usernameInvalid}>
                    <label for="field-username">{Language.translate('Username')}</label>
                    <input type="text" id="field-username" name="username" bind:value={username} bind:this={usernameInputEl}
                           on:input={clearCredentialsError}>
                </div>

                <div class="form-group" class:has-error={passwordInvalid}>
                    <label for="field-password">{Language.translate('Password')}</label>
                    <div class="password-input">
                        <input type={showPassword ? 'text' : 'password'} id="field-password" name="password" value={password} bind:this={passwordInputEl}
                               on:input={onPasswordInput}>
                        <button type="button" class="toggle-password" on:click={() => showPassword = !showPassword}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}>
                            <i class="ph {showPassword ? 'ph-eye-slash' : 'ph-eye'}"></i>
                        </button>
                    </div>
                </div>

                <div class="form-row">
                    <label class="remember-username">
                        <input type="checkbox" id="field-remember-username" name="rememberUsername" bind:checked={rememberUsername}>
                        <span>{Language.translate('RememberUsername')}</span>
                    </label>
                    <a href="javascript:" class="forgot-password" on:click|preventDefault={onForgotPassword}>{Language.translate('Forgot Password?', 'labels', 'User')}</a>
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
        </div>
    </div>
</StandalonePageLayout>

<style>
    label {
        font-weight: 500;
    }

    #login {
        position: relative;
        width: 100%;
        max-width: 380px;
        background: #fff;
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .logo-container {
        display: flex;
        justify-content: center;
        padding-top: 20px;
        margin-bottom: 1em;
    }

    .logo-container + .login-body {
        margin-top: 30px;
    }

    .logo-container .logo {
        max-width: 130px;
        max-height: 50px;
    }

    .login-body {
        padding: 0 20px 20px;
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

    .form-group {
        margin-bottom: 16px;
    }

    .form-group label {
        display: block;
        margin-bottom: 6px;
        font-size: 13px;
    }

    .form-group label,
    .form-row label {
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

    .form-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
        font-size: 13px;
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