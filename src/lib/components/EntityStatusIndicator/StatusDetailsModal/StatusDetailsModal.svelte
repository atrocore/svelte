<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import Modal from '$lib/components/modals/Modal/Modal.svelte';

    export let header: string;
    export let details: string;
    export let onClose: () => void = (): void => {
    };
</script>

<Modal {header} {onClose}>
    <pre class="details">{details}</pre>
</Modal>

<style>
    .details {
        margin: 0;
        border: none;
        background: none;
        white-space: pre-wrap;
        word-break: break-word;
    }
</style>
