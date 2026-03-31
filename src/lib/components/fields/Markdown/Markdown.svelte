<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<!--
  TODO (technical debt): This component cannot be used in isolation — it requires a Backbone proxy view.
  Two hard dependencies on the proxy:
  1. `window.EasyMDE` must be pre-loaded via `lib!EasyMDE` in the Backbone AMD define() before
     this component mounts, otherwise the EasyMDE editor will not initialize.
  2. `markdownView` prop must be a live Backbone view instance to enable image modal dialogs
     (selectImage / uploadImage toolbar buttons call `markdownView.createView()` and `markdownView.listenTo()`).
  Goal: decouple from Backbone so this component works standalone.
-->

<script lang="ts">
    import MarkdownDetail from './MarkdownDetail/MarkdownDetail.svelte';
    import MarkdownEdit from './MarkdownEdit/MarkdownEdit.svelte';
    import MarkdownList from './MarkdownList/MarkdownList.svelte';
    import TextSearch from '$lib/components/fields/Text/TextSearch/TextSearch.svelte';
    import type { FieldMode, FieldFetchResult, FieldSearchResult } from '$lib/types/ui/field';

    export let mode: FieldMode = 'detail';
    export let name: string = '';
    export let value: string | null = null;
    export let params: Record<string, unknown> = {};
    export let searchType: string = 'startsWith';
    export let searchValue: string = '';
    export let markdownView: any = null;
    export let mentions: Record<string, { name: string; id: string }> = {};

    $: displayValue = (() => {
        if (!value || !['detail', 'list'].includes(mode) || !Object.keys(mentions).length) {
            return value;
        }
        let text = value;
        Object.keys(mentions)
            .sort((a, b) => b.length - a.length)
            .forEach(item => {
                const part = '[' + mentions[item].name + '](#User/view/' + mentions[item].id + ')';
                text = text!.replace(new RegExp(item, 'g'), part);
            });
        return text;
    })();

    $: minHeight = (() => {
        const min = (params.minHeight as number) || 200;
        const max = (params.maxHeight as number) || 400;
        return max < min ? max : min;
    })();
    $: maxHeight = (params.maxHeight as number) || 400;

    let editComponent: MarkdownEdit | undefined;
    let searchComponent: TextSearch | undefined;

    export function fetch(): FieldFetchResult {
        if (editComponent) return editComponent.fetch();
        return { [name]: value };
    }

    export function fetchSearch(): FieldSearchResult {
        if (searchComponent) return searchComponent.fetchSearch();
        return false;
    }
</script>

{#if mode === 'detail'}
    <MarkdownDetail value={displayValue} />
{:else if mode === 'list'}
    <MarkdownList value={displayValue} />
{:else if mode === 'edit'}
    <MarkdownEdit
        bind:this={editComponent}
        {name}
        {value}
        {minHeight}
        {maxHeight}
        {markdownView}
    />
{:else if mode === 'search'}
    <TextSearch
        bind:this={searchComponent}
        {name}
        {searchType}
        {searchValue}
    />
{/if}
