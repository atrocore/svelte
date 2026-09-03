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
    import { Language } from "$lib/core/language";

    export let code: 403 | 404;

    const titleKey = code === 403 ? 'accessDenied' : 'pageNotFound';
    const descriptionKey = code === 403 ? 'accessDeniedDescription' : 'pageNotFoundDescription';
</script>

<StandalonePageLayout>
    <LogoCard>
        <div class="body">
            <h1 class="page-title">{Language.translate(titleKey)}</h1>
            <p class="page-subtitle">{Language.translate(descriptionKey)}</p>
            <p class="error-code">{Language.translate('errorCode')}: {code}</p>

            <a role="button" class="primary submit-button" href="#">
                <i class="ph ph-presentation-chart"></i>
                <span>{Language.translate('Open Dashboard')}</span>
            </a>
        </div>
    </LogoCard>
</StandalonePageLayout>

<style>
    .body {
        padding: 0 20px 20px;
        text-align: center;
    }

    .page-title {
        margin: 30px 0;
        font-size: 28px;
        line-height: 1;
    }

    .page-subtitle {
        margin: 0;
        color: #333;
    }

    .error-code {
        margin: 2em 0;
        color: #888;
    }

    .submit-button {
        width: 100%;
        padding: 10px;
        border-radius: 8px;
    }
</style>
