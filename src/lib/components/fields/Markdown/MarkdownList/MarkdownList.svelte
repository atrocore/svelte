<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { renderMarkdown } from '../utils/render-markdown';

    export let value: string | null = null;
</script>

{#if value}
    <span class="complex-text">{@html renderMarkdown(value)}</span>
{/if}
