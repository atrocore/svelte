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
    import LogoCard from "$lib/components/LogoCard/LogoCard.svelte";
    import TextInput from "$lib/components/TextInput/TextInput.svelte";
    import { Language } from "$lib/core/language";
    import { Config } from "$lib/core/config";
    import { ApiError } from "$lib/core/api-client";
    import Login from "../../login/Login/Login.svelte";
    import {
        approveAuthorizationRequest,
        denyAuthorizationRequest,
        validateAuthorizationRequest
    } from "$lib/components/LoginForm/utils/authorize";
    import {forgetAuthorizationRequest, takeSignInError} from "$lib/components/LoginForm/utils/sign-in-cookies";
    import {getOidcLoginUrl} from "$lib/components/LoginForm/utils/sso";
    import {isAllowedRedirectUri} from "$lib/components/LoginForm/utils/redirect-uri";

    const hasOidcLogin = !!Config.get('hasOidcLogin');
    const hasLoginForm = !Config.get('ssoOnly');

    let clientName: string | null = null;
    let isConsentRequired = true;
    let userName: string | null = null;
    let ssoRedirecting = false;
    let requestError: string | null = null;
    let username = '';
    let password = '';
    let credentialsError: string | null = null;
    let submitting = false;
    let usernameInputEl: TextInput;
    let redirectUri = '';

    $: message = Language.translate('authorizationRequest', 'labels', 'OauthClient').replace('{clientName}', clientName ?? '');
    $: signedInMessage = Language.translate('signedInAs', 'labels', 'OauthClient').replace('{userName}', userName ?? '');

    onMount(async () => {
        try {
            const authorizationRequest = await validateAuthorizationRequest();
            isConsentRequired = authorizationRequest.isConsentRequired;
            userName = authorizationRequest.userName;
            clientName = authorizationRequest.clientName;
            credentialsError = takeSignInError();
        } catch (e) {
            // the request cannot be completed, the application opens as usual next time
            forgetAuthorizationRequest();
            requestError = getErrorMessage(e);
        }
    });

    $: if (clientName && isConsentRequired && !userName && usernameInputEl) {
        usernameInputEl.focus();
    }

    function clearCredentialsError(): void {
        credentialsError = null;
    }

    function getErrorMessage(e: unknown): string {
        return e instanceof ApiError ? e.getReason() : String(e);
    }

    /**
     * Approves the authorization request for the signed-in user, the client then gets the authorization code.
     */
    async function approve(username: string, password: string): Promise<void> {
        redirectUri = (await approveAuthorizationRequest(username, password)).redirectUri;
    }

    function returnToClient(): void {
        goToClient(redirectUri);
    }

    /**
     * The user agent goes to the redirect URI of the client only when it is allowed.
     */
    function goToClient(uri: string): void {
        if (!isAllowedRedirectUri(uri)) {
            submitting = false;
            requestError = Language.translate('invalidRedirectUri', 'exceptions', 'OauthClient').replace('%s', uri);
            return;
        }

        window.location.href = uri;
    }

    async function handleApprove(): Promise<void> {
        // a user signed in at the identity provider gives the consent without the password
        if (!userName && (!username.trim() || !password)) {
            credentialsError = Language.translate('usernameOrPasswordCantBeEmpty', 'messages', 'User');
            return;
        }

        credentialsError = null;
        submitting = true;

        try {
            await approve(username, password);
        } catch (e) {
            submitting = false;
            credentialsError = getErrorMessage(e);
            return;
        }

        returnToClient();
    }

    /**
     * The sign-in at the identity provider returns to this form, where the signed-in user gives the consent.
     */
    async function onSsoButtonClick(): Promise<void> {
        ssoRedirecting = true;
        credentialsError = null;

        try {
            window.location.href = await getOidcLoginUrl();
        } catch (e) {
            ssoRedirecting = false;
            credentialsError = getErrorMessage(e);
        }
    }

    async function handleDeny(): Promise<void> {
        submitting = true;

        try {
            goToClient((await denyAuthorizationRequest()).redirectUri);
        } catch (e) {
            submitting = false;
            requestError = getErrorMessage(e);
        }
    }
</script>

{#if clientName && !isConsentRequired}
    <Login signIn={approve} onSignedIn={returnToClient} />
{:else}
    <StandalonePageLayout showFooter={false}>
        <LogoCard logoVariant="full">
            <div class="authorize-body">
                {#if requestError}
                    <div class="error-message" role="alert">{requestError}</div>
                {:else if clientName}
                    <p class="request-message">{message}</p>

                    <form on:submit|preventDefault={handleApprove}>
                        {#if userName}
                            <p class="request-message">{signedInMessage}</p>
                        {:else}
                        {#if hasOidcLogin}
                            <button type="button" class="sso-button" disabled={ssoRedirecting || submitting} on:click={onSsoButtonClick}>
                                <i class="ph ph-key"></i> <span>{Language.translate('ContinueWithSso')}</span>
                            </button>
                        {/if}

                        {#if hasLoginForm}
                        <TextInput
                                label={Language.translate('Username')}
                                id="field-username"
                                name="username"
                                autocomplete="username"
                                bind:value={username}
                                bind:this={usernameInputEl}
                                invalid={!!credentialsError}
                                on:input={clearCredentialsError}
                        />

                        <TextInput
                                label={Language.translate('Password')}
                                id="field-password"
                                name="password"
                                type="password"
                                autocomplete="current-password"
                                bind:value={password}
                                invalid={!!credentialsError}
                                on:input={clearCredentialsError}
                        />
                        {/if}
                        {/if}

                        <div class="buttons">
                            <button type="button" class="deny-button" disabled={submitting} on:click={handleDeny}>
                                {Language.translate('Deny', 'labels', 'OauthClient')}
                            </button>
                            {#if userName || hasLoginForm}
                                <button type="submit" class="primary allow-button" disabled={submitting}>
                                    {#if submitting}
                                        <i class="ph ph-circle-notch ph-spin"></i>
                                    {/if}
                                    <span>{Language.translate('Allow', 'labels', 'OauthClient')}</span>
                                </button>
                            {/if}
                        </div>

                        {#if credentialsError}
                            <div class="error-message" role="alert">{credentialsError}</div>
                        {/if}
                    </form>
                {:else}
                    <div class="loading"><i class="ph ph-circle-notch ph-spin"></i></div>
                {/if}
            </div>
        </LogoCard>
    </StandalonePageLayout>
{/if}

<style>
    .authorize-body {
        padding: 0 20px 20px;
    }

    .request-message {
        margin-bottom: 20px;
        text-align: center;
    }

    .sso-button {
        width: 100%;
        padding: 10px;
        border-radius: 8px;
        margin-bottom: 20px;
    }

    .buttons {
        display: flex;
        gap: 10px;
    }

    .buttons button {
        flex: 1;
        padding: 10px;
        border-radius: 8px;
    }

    .error-message {
        margin-top: 16px;
        padding: 4px 10px;
        color: #b71c1c;
        font-size: 13px;
        text-align: center;
    }

    .loading {
        text-align: center;
        padding: 20px;
    }
</style>
