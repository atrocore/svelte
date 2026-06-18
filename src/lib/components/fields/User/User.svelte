<script lang="ts">
    import UserDetail from './UserDetail/UserDetail.svelte';
    import type { FieldMode } from '$lib/types/ui/field';

    export let mode: FieldMode = 'detail';
    export let userId: string = '';
    export let userName: string = '';
    export let valueIsSet: boolean = true;
    export let meta: { actor: { id: string; name: string; isSystem: boolean }; delegator: { id: string; name: string; isSystem: boolean } } | null = null;
</script>

{#if mode === 'detail' || mode === 'list'}
    <UserDetail {mode} {userId} {userName} {valueIsSet} {meta} />
{/if}
