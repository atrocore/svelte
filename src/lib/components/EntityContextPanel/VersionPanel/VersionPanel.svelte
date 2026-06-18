<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { ApiClient } from '$lib/core/api-client';
    import { Language } from "$lib/core/language";
    import { Notifier } from "$lib/dom/notifier";
    import { Dropdown } from "$lib/dom/dropdown";
    import UserDetail from "$lib/components/fields/User/UserDetail/UserDetail.svelte";

    export let scope: string;
    export let entityId: string;
    export let pageSize: number = 10;

    let versions: any[] = [];
    let visibleCount: number = pageSize;
    let loading = false;

    $: visibleVersions = versions.slice(0, visibleCount);
    $: hasMore = versions.length > visibleCount;

    async function load() {
        if (!scope || !entityId) return;
        loading = true;
        try {
            versions = (await ApiClient.get('/versionList', {entityName: scope, entityId})) ?? [];
        } catch {
            Notifier.notify('Error occurred', 'error');
        }
        loading = false;
    }

    function showMore() {
        visibleCount += pageSize;
    }

    async function deleteVersion(versionName: string) {
        try {
            const qs = new URLSearchParams({entityName: scope, entityId, name: versionName}).toString();
            await ApiClient.delete(`/version?${qs}`);
            versions = versions.filter(v => v.name !== versionName);
            Notifier.notify(Language.translate('Done'), 'success');
        } catch {
            Notifier.notify('Error occurred', 'error');
        }
    }

    function compareVersion(versionName: string) {
        window.dispatchEvent(new CustomEvent('versioning:compare', {detail: {scope, entityId, versionName}}));
    }

    function formatDate(dateStr: string): string {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr.replace(' ', 'T'));
            return date.toLocaleDateString() + ', ' + date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
        } catch {
            return dateStr;
        }
    }

    function versionDropdown(node: HTMLElement) {
        const toggle = node.querySelector('[data-toggle="dropdown"]') as HTMLElement;
        const menu = node.querySelector('.dropdown-menu') as HTMLElement;
        if (!toggle || !menu) return;

        menu.style.position = 'fixed';
        const dropdown = Dropdown.create(toggle, menu, {
            placement: 'bottom-end',
            strategy: 'fixed',
            onDropdownShow: () => node.classList.add('open'),
            onDropdownHide: () => node.classList.remove('open'),
        });

        return {
            destroy() {
                dropdown?.destroy();
            }
        };
    }

    onMount(() => {
        load();
        window.addEventListener('reload-versions', load);
    });

    onDestroy(() => {
        window.removeEventListener('reload-versions', load);
    });
</script>

{#if loading}
    <div style="text-align:center;margin-top:10px">
        <img style="width:40px" class="preloader" src="client/img/atro-loader.svg" alt="loader">
    </div>
{:else if versions.length === 0}
    <p class="no-versions">{Language.translate('noVersionsFound', 'messages')}</p>
{:else}
    <ul class="version-list">
        {#each visibleVersions as version}
            <li class="version-item">
                <div class="version-row version-title-row">
                    <span class="version-name">{version.name}</span>
                    <div class="dropdown" use:versionDropdown>
                        <button class="btn-dots" data-toggle="dropdown">
                            <i class="ph ph-dots-three-vertical"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-right">
                            <li>
                                <a href="javascript:" on:click={() => compareVersion(version.name)}>
                                    {Language.translate('Compare')}
                                </a>
                            </li>
                            <li role="separator" class="divider"></li>
                            <li>
                                <a href="javascript:" class="text-danger" on:click={() => deleteVersion(version.name)}>
                                    {Language.translate('deleteVersion', 'labels')}
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
                <div class="version-row version-meta-row">
                    <span class="version-date">{formatDate(version.createdAt)}</span>
                    {#if version.createdById}
                        <span class="version-author">
                            <UserDetail
                                    userId={version.createdById}
                                    userName={version.createdByName ?? ''}
                                    meta={version._meta?.audit?.createdBy ?? null}
                            />
                        </span>
                    {/if}
                </div>
            </li>
        {/each}
    </ul>

    {#if hasMore}
        <button class="btn btn-sm btn-default show-more-btn" on:click={showMore}>
            {Language.translate('Show more')}
        </button>
    {/if}
{/if}

<style>
    .no-versions {
        color: #999;
        font-style: italic;
        margin-top: 10px;
    }

    .version-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .version-item {
        border-bottom: 1px solid var(--primary-border-color, #e0e0e0);
        padding: 6px 0;
    }

    .version-item:last-child {
        border-bottom: none;
    }

    .version-row {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .version-title-row {
        justify-content: space-between;
    }

    .version-name {
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 1;
        min-width: 0;
    }

    .version-meta-row {
        gap: 6px;
        margin-top: 2px;
    }

    .version-date {
        font-size: 11px;
        color: var(--label-color, #888);
    }

    .version-author {
        font-size: 11px;
        color: var(--label-color, #888);
    }

    .version-author::before {
        content: '·';
        margin-right: 4px;
    }

    .dropdown {
        position: relative;
        flex-shrink: 0;
    }

    .btn-dots {
        background: none;
        border: none;
        padding: 0 2px;
        cursor: pointer;
        color: var(--label-color, #888);
        line-height: 1;
        display: flex;
        align-items: center;
    }

    .btn-dots:hover {
        color: #333;
    }

    .show-more-btn {
        width: 100%;
        margin-top: 6px;
    }
</style>
