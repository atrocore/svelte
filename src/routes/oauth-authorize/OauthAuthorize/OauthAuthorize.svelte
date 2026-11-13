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
    import { ApiError } from "$lib/core/api-client";
    import Login from "../../login/Login/Login.svelte";
    import {
        approveAuthorizationRequest,
        denyAuthorizationRequest,
        validateAuthorizationRequest
    } from "$lib/components/LoginForm/utils/authorize";
    import {forgetAuthorizationRequest} from "$lib/components/LoginForm/utils/sign-in-cookies";

    let clientName: string | null = null;
    let isConsentRequired = true;
    let requestError: string | null = null;
    let username = '';
    let password = '';
    let credentialsError: string | null = null;
    let submitting = false;
    let usernameInputEl: TextInput;
    let redirectUri = '';

    $: message = Language.translate('authorizationRequest', 'labels', 'OauthClient').replace('{clientName}', clientName ?? '');

    onMount(async () => {
        try {
            const authorizationRequest = await validateAuthorizationRequest();
            isConsentRequired = authorizationRequest.isConsentRequired;
            clientName = authorizationRequest.clientName;
        } catch (e) {
            // the request cannot be completed, the application opens as usual next time
            forgetAuthorizationRequest();
            requestError = getErrorMessage(e);
        }
    });

    $: if (clientName && isConsentRequired && usernameInputEl) {
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
        window.location.href = redirectUri;
    }

    async function handleApprove(): Promise<void> {
        if (!username.trim() || !password) {
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

    async function handleDeny(): Promise<void> {
        submitting = true;

        try {
            window.location.href = (await denyAuthorizationRequest()).redirectUri;
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

                        <div class="buttons">
                            <button type="button" class="deny-button" disabled={submitting} on:click={handleDeny}>
                                {Language.translate('Deny', 'labels', 'OauthClient')}
                            </button>
                            <button type="submit" class="primary allow-button" disabled={submitting}>
                                {#if submitting}
                                    <i class="ph ph-circle-notch ph-spin"></i>
                                {/if}
                                <span>{Language.translate('Allow', 'labels', 'OauthClient')}</span>
                            </button>
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
