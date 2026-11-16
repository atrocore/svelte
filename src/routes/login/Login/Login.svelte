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
    import LoginForm from "$lib/components/LoginForm/LoginForm.svelte";
    import ForgotPasswordForm from "./ForgotPasswordForm/ForgotPasswordForm.svelte";
    import {signInToUserInterface} from "$lib/components/LoginForm/utils/sign-in";
    import type {SignIn} from "$lib/components/LoginForm/types/sign-in";

    /**
     * Signs in to the user interface, unless the form is shown for the authorization request of an OAuth client.
     */
    export let signIn: SignIn = signInToUserInterface;
    export let onSignedIn: () => void = () => {
    };

    let view: 'login' | 'forgot-password' = 'login';
    let forgotPasswordUserName = '';
</script>

<StandalonePageLayout showFooter={false}>
    <LogoCard logoVariant={view === 'forgot-password' ? 'short' : 'full'}>
        <div class="login-body">
            {#if view === 'forgot-password'}
                <ForgotPasswordForm onBack={() => view = 'login'} initialUserName={forgotPasswordUserName} />
            {:else}
                <LoginForm {signIn} {onSignedIn} onForgotPassword={(username) => { forgotPasswordUserName = username; view = 'forgot-password'; }} />
            {/if}
        </div>
    </LogoCard>
</StandalonePageLayout>

<style>
    .login-body {
        padding: 0 20px 20px;
    }
</style>
