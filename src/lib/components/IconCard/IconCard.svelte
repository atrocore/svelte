<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { Language } from '$lib/core/language';

    export let title: string;
    export let description: string | null = null;
    export let iconClass: string | null = null;
    export let iconSrc: string | null = null;
    export let href: string | null = null;
    export let tooltip: string | null = null;
    export let alert: string | null = null;
    export let docsUrl: string | null = null;
    export let onClick: (() => void) | null = null;
</script>

<svelte:element
    this={href ? 'a' : 'button'}
    href={href}
    type={href ? undefined : 'button'}
    class="card"
    class:has-alert={!!alert}
    title={tooltip}
    role={href ? 'link' : 'button'}
    on:click={() => onClick?.()}
>
    <div class="top">
        {#if iconClass}
            <i class="{iconClass} icon"></i>
        {:else if iconSrc}
            <img class="icon" src={iconSrc} alt="">
        {/if}
        <span class="title">{title}</span>
    </div>
    {#if description}
        <div class="description">{description}</div>
    {/if}
    {#if alert || docsUrl}
        <div class="bottom">
            {#if docsUrl}
                <a href={docsUrl} target="_blank" class="help-link">{Language.translate('Help Center')}</a>
            {/if}

            {#if alert}
                <i title={alert} class="ph ph-warning-circle alert-icon"></i>
            {/if}
        </div>
    {/if}
</svelte:element>

