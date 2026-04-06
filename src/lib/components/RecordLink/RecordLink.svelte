<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    export let entityName: string = '';
    export let entityId: string|null = '';
</script>

<a href="#{entityName}/view/{entityId}" class="link" data-id={entityId}>
    <slot />
</a>
