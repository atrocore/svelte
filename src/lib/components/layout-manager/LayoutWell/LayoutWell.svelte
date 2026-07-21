<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<div class="well">
    <slot name="header" />
    <div class="rows-wrapper">
        <slot />
    </div>
</div>

<style>
    .well {
        height: 100%;
        border: 1px solid #ededed;
        border-radius: 3px;
        display: flex;
        flex-direction: column;
    }

    .rows-wrapper {
        flex: 1;
        overflow-x: clip;
        overflow-y: auto;
        padding-right: 5px;
        margin-right: -5px;
        max-height: 70vh;
    }

    .well :global(header) {
        font-weight: bold;
    }

    .well :global(ul) {
        width: 100%;
        min-height: 100px;
        padding: 0;
        list-style-type: none;
        margin: 0;
        flex: 1;
    }

    .well :global(ul li) {
        list-style: none;
        border: 1px solid #CCC;
        margin: 5px 0;
        padding: 5px;
        height: 32px;
        display: flex;
        background-color: #FFF;
    }

    .well :global(ul > li .left) {
        flex: 1;
        min-width: 0;
    }

    .well :global(ul > li .left > label) {
        font-weight: normal;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .well :global(ul > li .right) {
        flex-shrink: 0;
        margin-left: auto;
        margin-right: 0;
    }

    .well :global(ul.disabled > li .right) {
        display: none;
    }
</style>