<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import UserDetail from './UserDetail/UserDetail.svelte';
    import type { FieldMode } from '$lib/types/ui/field';

    export let mode: FieldMode = 'detail';
    export let userId: string = '';
    export let userName: string = '';
    export let valueIsSet: boolean = true;
    export let meta: { actor: { id: string; name: string; isSystem: boolean }; delegator: { id: string; name: string; isSystem: boolean } } | null = null;
    export let avatarPath: string = '';
</script>

{#if mode === 'detail' || mode === 'list'}
    <UserDetail {mode} {userId} {userName} {valueIsSet} {meta} {avatarPath}/>
{/if}
