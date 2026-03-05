<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { Language } from '$lib/core/language';

    export let value: boolean | null = null;

    $: valueIsSet = value !== null && value !== undefined;
    $: isNull = value === null || value === undefined;
</script>

{#if !valueIsSet}
    ...
{:else if isNull}
    <span class="text-gray">{Language.translate('Null')}</span>
{:else}
    <input type="checkbox" checked={!!value} disabled />
{/if}
