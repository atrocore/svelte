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
    import { ApiClient } from "$lib/core/api-client";

    let authorName: string | null = null;
    let authorLink: string | null = null;

    onMount(() => {
        ApiClient.get<{ authorName: string; authorLink: string }>('background').then(data => {
            authorName = data.authorName || null;
            authorLink = data.authorLink || null;
        });
    });
</script>

<div class="standalone-page-layout" style="background-image: url(/?entryPoint=background)">
    <div class="container content page-content">
        <slot />

        {#if authorName}
            <span class="photo-link"><i class="ph ph-camera"></i> <a href={authorLink} target="_blank">{authorName}</a></span>
        {/if}
    </div>

    <footer class="container">
        <div class="credit small">
            <ul class="footer-links">
                <li><a target="_blank" href="https://github.com/atrocore/atrocore/issues/new">Report a Bug</a></li>
                <li><a target="_blank" href="https://community.atrocore.com">Community</a></li>
                <li><a target="_blank" href="https://help.atrocore.com">Help Center</a></li>
                <li><a target="_blank" href="https://support.atrocore.com">Support</a></li>
                <li><a target="_blank" href="https://atrocore.com/contact">Contact Us</a></li>
            </ul>
            <span class="copyright">&copy; <a href="https://atrocore.com" title="AtroCore is based on EspoCRM" target="_blank">AtroCore is based on EspoCRM</a> | <span>AtroCore: {Config.get('coreVersion') || ''}</span></span>
        </div>
    </footer>
</div>

<style>
    .standalone-page-layout {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        background-size: cover;
        background-repeat: no-repeat;
        background-position: center;
    }

    .page-content {
        position: relative;
        flex: 1 0 auto;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .photo-link {
        position: absolute;
        right: 33px;
        left: auto;
        bottom: 20px;
        display: flex;
        align-items: center;
        gap: 5px;
        color: #ffffff;
        font-size: 11px;
        transform: none;
    }

    .photo-link a {
        color: #ffffff;
        text-decoration: none;
        line-height: 1;
    }

    .photo-link a:hover {
        text-decoration: underline;
    }

    .photo-link i {
        font-size: 16px;
    }

    footer {
        flex-shrink: 0;
        background-color: #eee;
        min-width: 100%;
    }

    .credit {
        padding: 6px 14px;
        margin: 0;
    }

    .credit,
    .credit a,
    .credit a:hover,
    .credit a:active,
    .credit a:visited {
        color: #555;
    }

    .footer-links {
        display: inline-flex;
        align-items: center;
        margin: 0;
        padding: 0;
        list-style: none;
    }

    .footer-links li:not(:last-child)::after {
        content: "|";
        margin: 0 5px;
        color: #999;
    }

    .copyright {
        float: right;
    }

    @media screen and (max-width: 767px) {
        .credit {
            text-align: center;
        }

        .footer-links {
            display: none;
        }

        .credit .copyright {
            float: none !important;
        }

        .photo-link {
            right: 25px;
        }
    }
</style>