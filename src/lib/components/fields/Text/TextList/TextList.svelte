<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script>
    import { breaklines } from '../utils/breaklines';
    import { truncate } from '../utils/truncate';

    export let value = '';
    export let detailMaxLength = 400;
    export let detailMaxNewLineCount = 10;
    export let seeMoreDisabled = false;

    $: ({ text: displayedText } = seeMoreDisabled
        ? { text: value || '' }
        : truncate(value, detailMaxLength, detailMaxNewLineCount));
</script>

<span>{@html breaklines(displayedText)}</span>