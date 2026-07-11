<script lang="ts">
    import type { FieldMode } from '$lib/types/ui/field';

    export let mode: FieldMode = 'detail';
    export let userId: string = '';
    export let userName: string = '';
    export let valueIsSet: boolean = true;
    export let meta: { actor: { id: string; name: string; isSystem: boolean }; delegator: { id: string; name: string; isSystem: boolean } } | null = null;
    export let avatarPath: string = '';
</script>

{#if meta?.actor}
    {#if meta.actor.isSystem}
        <span>{meta.actor.name}</span>
    {:else}
        <a href="#User/view/{meta.actor.id}" title={meta.actor.name}>{meta.actor.name}</a>
    {/if}
    <span class="text-muted"> ‹ </span>
    {#if meta.delegator.isSystem}
        <span>{meta.delegator.name}</span>
    {:else}
        <a href="#User/view/{meta.delegator.id}" title={meta.delegator.name}>{meta.delegator.name}</a>
    {/if}
{:else if userId}
    {#if avatarPath}
        <img class="avatar avatar-link" style="max-width:26px; max-height:26px;" src={avatarPath} alt="">
    {/if}
    <a href="#User/view/{userId}" title={userName}>{userName}</a>
{:else if userName}
    {userName}
{:else if mode === 'detail'}
    {#if valueIsSet}
        <span class="pre-label">&nbsp;</span>
    {:else}
        ...
    {/if}
{/if}
