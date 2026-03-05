<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { breaklines } from '../utils/breaklines';
    import { truncate } from '../utils/truncate';

    export let value: string = '';
    export let detailMaxLength: number = 400;
    export let detailMaxNewLineCount: number = 10;
    export let seeMoreDisabled: boolean = false;

    $: ({ text: displayedText } = seeMoreDisabled
        ? { text: value || '' }
        : truncate(value, detailMaxLength, detailMaxNewLineCount));
</script>

<span>{@html breaklines(displayedText)}</span>