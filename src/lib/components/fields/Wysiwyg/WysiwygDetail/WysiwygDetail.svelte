<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { onMount } from 'svelte';
    import { sanitizeHtml } from '../utils/sanitize';
    import { IFRAME_ALLOW, IFRAME_ALLOWED_HOSTS } from '$lib/helpers/html';
    import { renderMarkdown } from '$lib/components/fields/Markdown/utils/render-markdown';
    import { Language } from '$lib/core/language';
    import { truncate } from '$lib/components/fields/Text/utils/truncate';

    export let value: string | null = null;
    export let isPlain: boolean = false;
    export let useIframe: boolean = false;
    export let iframeStylesheet: string = '';
    export let detailMaxHeight: number = 400;
    export let seeMoreDisabled: boolean = false;
    export let detailMaxLength: number = 400;
    export let detailMaxNewLineCount: number = 10;

    let iframeEl: HTMLIFrameElement;
    let htmlContainerEl: HTMLDivElement;
    let showMore = false;
    let expanded = false;
    let seeMoreText = false;

    $: sanitized = sanitizeHtml(value);

    $: ({ text: displayedText, isCut } = !seeMoreText && !seeMoreDisabled && isPlain && value
        ? truncate(value, detailMaxLength, detailMaxNewLineCount)
        : { text: value || '', isCut: false });

    onMount(() => {
        if (!useIframe || isPlain || !iframeEl) return;

        const $ = (window as any).$;
        const doc = iframeEl.contentWindow?.document;
        if (!doc) return;

        const link = doc.createElement('link');
        link.type = 'text/css';
        link.rel = 'stylesheet';
        link.href = iframeStylesheet;

        // The sandbox needs allow-scripts so embedded players can run, and allow-same-origin so we can access the
        // document. This CSP forbids any script in the wrapper document itself, so its content can never remove the
        // sandbox; nested cross-origin players are not affected.
        const csp = doc.createElement('meta');
        csp.httpEquiv = 'Content-Security-Policy';
        csp.content = [
            "script-src 'none'",
            "object-src 'none'",
            "base-uri 'none'",
            "form-action 'none'",
            'frame-src ' + IFRAME_ALLOWED_HOSTS.map(host => `https://${host}`).join(' '),
        ].join('; ');

        doc.write(csp.outerHTML + link.outerHTML + sanitized);
        doc.close();

        $(iframeEl).on('load', () => {
            $(iframeEl).contents().find('a').attr('target', '_blank');
        });

        const processHeight = () => {
            const body = iframeEl.contentWindow?.document.body;
            if (!body) return;
            iframeEl.style.height = '0px';
            const height = Math.max(body.scrollHeight, body.offsetHeight);
            iframeEl.style.height = height + 'px';
        };

        iframeEl.style.visibility = 'hidden';
        setTimeout(() => {
            processHeight();
            iframeEl.style.visibility = 'visible';
            $(iframeEl).on('load', processHeight);
        }, 40);

        const onResize = () => processHeight();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    });

    onMount(() => {
        if (useIframe || isPlain || seeMoreDisabled) return;
        requestAnimationFrame(() => {
            if (htmlContainerEl && htmlContainerEl.offsetHeight > detailMaxHeight) {
                showMore = true;
            }
        });
    });
</script>

{#if value === null}
    <span class="text-gray">{Language.translate('Null') || 'Null'}</span>
{:else if !value}
    <span class="pre-label">&nbsp;</span>
{:else if isPlain}
    <!-- svelte-ignore a11y-invalid-attribute -->
    <div class="plain complex-text">{@html renderMarkdown(displayedText)}</div>
    {#if isCut}
        <a href="javascript:" on:click={() => (seeMoreText = true)}>{Language.translate('See more') || 'See more'}</a>
    {/if}
{:else if useIframe}
    <iframe
        bind:this={iframeEl}
        sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
        allow={IFRAME_ALLOW}
        allowfullscreen
        frameborder="0"
    ></iframe>
{:else}
    <div
        bind:this={htmlContainerEl}
        class="html-container"
        style={showMore && !expanded ? `max-height: ${detailMaxHeight}px; overflow: hidden; margin-bottom: 10px;` : ''}
    >{@html sanitized}</div>
    {#if showMore && !expanded}
        <!-- svelte-ignore a11y-invalid-attribute -->
        <a href="javascript:" on:click={() => (expanded = true)}>{Language.translate('See more') || 'See more'}</a>
    {/if}
{/if}

<style>
    iframe {
        width: 100%;
        overflow: hidden;
    }
</style>