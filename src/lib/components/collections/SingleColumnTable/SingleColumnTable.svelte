<!--
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 -->
<script lang="ts">
    export let className: string = '';
    export let extendBorders: boolean = false;
    export let horizontalPadding: number = 20;
</script>

<ul class="base-list {className}" class:extend-borders={extendBorders}
    style="--horizontal-padding: {horizontalPadding}px">
    <slot></slot>
</ul>

<style>
    .base-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .base-list.extend-borders :global(.list-item) {
        margin-left: calc(-1 * var(--horizontal-padding, 20px));
        margin-right: calc(-1 * var(--horizontal-padding, 20px));
        padding-left: var(--horizontal-padding, 20px);
        padding-right: var(--horizontal-padding, 20px);
    }

    .base-list.extend-borders :global(.list-item:last-child .dropdown-menu) {
        top: auto;
        bottom: 100%;
    }
</style>
