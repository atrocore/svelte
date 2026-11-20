<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    /**
     * A panel like the panels in the middle of a record (the panels of the detail layout): a heading with the caret that
     * collapses it and the title, and a form body. The panel has the design of the record only inside the container
     * `.record > .detail > .overview > .middle`, where the panels are its direct children. The content stays mounted while
     * the panel is collapsed, so the fields in it keep their values.
     */
    export let title: string;
    export let name: string = '';
    export let expanded: boolean = true;
    export let className: string = '';

    function toggle(): void {
        expanded = !expanded;
    }
</script>

<div class="panel panel-default {name ? `panel-${name}` : ''} {className}" data-name={name}>
    <div class="panel-heading">
        <h4 class="panel-title">
            <span class="panel-title-text" role="button" tabindex="0" on:click={toggle} on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggle()}>
                <i class="ph ph-caret-{expanded ? 'down' : 'right'} collapser"></i>
                {title}
            </span>
        </h4>
    </div>
    <div class="panel-body panel-body-form panel-collapse collapse {expanded ? 'in' : ''}" data-name={name} style:display={expanded ? null : 'none'}>
        <slot></slot>
    </div>
</div>
