<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import { Language } from "$lib/core/language"

    import BaseHeader from "$lib/components/headers/BaseHeader/BaseHeader.svelte";
    import type BreadcrumbsItem from "$lib/types/ui/header/breadcrumbs-item";

    export let tabs: string[] = [];
    export let selectedTabIndex: number = 0;
    export let readOnly: boolean = true;
    export let onEditTabs: () => void = () => {};
    export let onAddDashlet: () => void = () => {};
    export let onReset: () => void = () => {};
    export let onSelectTab: (index: string) => void = () => {};

    const breadcrumbs: BreadcrumbsItem[] = [{
        label: Language.translate('Dashboard'),
        url: '/#'
    }];

    function handleSelectTab(e: Event): void {
        const target = e.currentTarget as HTMLElement;
        const index = target.dataset.tab;
        if (index) {
            onSelectTab(index);
        }
    }

    function handleChangeTab(e: Event): void {
        const target = e.currentTarget as HTMLSelectElement;
        const index = target.value;
        if (index) {
            onSelectTab(index);
        }
    }

    function handleReset(e: Event): void {
        onReset();
    }

    function handleEditTabs(e: Event): void {
        onEditTabs();
    }

    function handleAddDashlet(e: Event): void {
        onAddDashlet();
    }
</script>

<BaseHeader {breadcrumbs} scope="App" id="Dashboard">
    <div class="controls">
        {#if tabs.length > 1}
            <div class="button-group dashboard-tabs">
                {#each tabs as tab, index}
                    <button class="button" class:active={index === selectedTabIndex} on:click={handleSelectTab}
                            data-tab="{index}">{tab}</button>
                {/each}
            </div>

            <div class="dashboard-selectbox">
                <select class="form-control" on:change={handleChangeTab}>
                    {#each tabs as tab, index}
                        <option value={index} selected={index === selectedTabIndex}>{tab}</option>
                    {/each}
                </select>
            </div>
        {/if}

        {#if !readOnly}
            <button on:click={handleReset}>{Language.translate('Reset to Default')}</button>
            <div class="button-group dashboard-buttons">
                <button on:click={handleEditTabs} title="{Language.translate('Edit Dashboard')}"><i
                        class="ph ph-pencil-simple"></i></button>
                <button on:click={handleAddDashlet} title="{Language.translate('Add Dashlet')}"><i
                        class="ph ph-plus"></i></button>
            </div>
        {/if}
    </div>
</BaseHeader>

<style>
    .controls {
        margin: 0 0 0 auto;
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
    }

    .dashboard-buttons {
        flex-wrap: nowrap;
    }
</style>
