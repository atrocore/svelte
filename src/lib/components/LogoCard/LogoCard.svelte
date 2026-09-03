<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { Config } from "$lib/core/config";

    export let logoVariant: 'full' | 'short' = 'short';

    const faviconId = Config.get('faviconId');
    const shortLogoSrc = faviconId
        ? `/?entryPoint=LogoImage&id=${faviconId}&t=${faviconId}`
        : '/client/modules/treo-core/img/favicon_48.png';

    const companyLogoId = Config.get('companyLogoId');
    const fullLogoSrc = companyLogoId
        ? `/?entryPoint=LogoImage&id=${companyLogoId}&t=${companyLogoId}`
        : '/client/modules/treo-core/img/core_logo_dark.svg';

    $: resolvedLogoSrc = logoVariant === 'full' ? fullLogoSrc : shortLogoSrc;
</script>

<div class="logo-card">
    <div class="logo-container">
        <img src={resolvedLogoSrc} class="logo" class:full={logoVariant === 'full'} alt="Logo">
    </div>

    <slot />
</div>

<style>
    .logo-card {
        position: relative;
        width: 100%;
        max-width: 400px;
        background: #fff;
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .logo-container {
        display: flex;
        justify-content: center;
        margin: 30px 0;
    }

    .logo-container .logo {
        width: 32px;
        height: 32px;
    }

    .logo-container .logo.full {
        width: auto;
        height: auto;
        max-width: 250px;
        max-height: 24px;
        object-fit: contain;
    }
</style>
