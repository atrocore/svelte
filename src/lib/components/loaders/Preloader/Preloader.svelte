<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    export let heightPx: number = 12
</script>

<img class="preloader" style:height={`${heightPx}px`} src="client/img/atro-loader.svg" alt="Loading">

<style>
    .preloader {
        user-select: none;
    }
</style>