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
  1. `window.$.summernote` must be pre-loaded via `lib!Summernote` in the Backbone AMD define() before
     this component mounts, otherwise Summernote will not initialize.
  2. `wysiwygView` prop must be a live Backbone view instance to enable image modal dialogs
     (selectImage / uploadImage buttons call `wysiwygView.createView()` and `wysiwygView.listenTo()`).
  Goal: decouple from Backbone so this component works standalone.
-->

<script lang="ts">
    import WysiwygDetail from './WysiwygDetail/WysiwygDetail.svelte';
    import WysiwygEdit from './WysiwygEdit/WysiwygEdit.svelte';
    import WysiwygList from './WysiwygList/WysiwygList.svelte';
    import TextSearch from '$lib/components/fields/Text/TextSearch/TextSearch.svelte';
    import RecordLink from '$lib/components/RecordLink/RecordLink.svelte';
    import type { FieldMode, FieldFetchResult, FieldSearchResult } from '$lib/types/ui/field';

    export let mode: FieldMode = 'detail';
    export let name: string = '';
    export let value: string | null = null;
    export let entityName: string = '';
    export let entityId: string | null = '';
    export let isHtml: boolean = true;
    export let hasIsHtml: boolean = false;
    export let params: Record<string, unknown> = {};
    export let useIframe: boolean = false;
    export let iframeStylesheet: string = '';
    export let searchType: string = 'startsWith';
    export let searchValue: string = '';
    export let wysiwygView: any = null;

    $: isPlain = hasIsHtml && !isHtml;
    $: height = (params.height as number) || 250;
    $: minHeight = (params.minHeight as number) || undefined;
    $: toolbar = params.toolbar as any[] | undefined;
    $: detailMaxHeight = (params.lengthOfCut as number) || 400;
    $: seeMoreDisabled = !!(params.seeMoreDisabled as boolean);
    $: maxLength = (params.maxLength as number) || undefined;
    $: countBytesInsteadOfCharacters = !!(params.countBytesInsteadOfCharacters as boolean);

    let editComponent: WysiwygEdit | undefined;
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
    <WysiwygDetail
        {value}
        {isPlain}
        {useIframe}
        {iframeStylesheet}
        {detailMaxHeight}
        {seeMoreDisabled}
    />
{:else if mode === 'list'}
    <WysiwygList {value} {isPlain} {detailMaxHeight} {seeMoreDisabled} />
{:else if mode === 'listLink'}
    <RecordLink {entityName} {entityId}>
        <WysiwygList {value} {isPlain} {detailMaxHeight} {seeMoreDisabled} />
    </RecordLink>
{:else if mode === 'edit'}
    <WysiwygEdit
        bind:this={editComponent}
        {name}
        {value}
        {isHtml}
        {hasIsHtml}
        {height}
        {minHeight}
        {toolbar}
        {wysiwygView}
        {maxLength}
        {countBytesInsteadOfCharacters}
    />
{:else if mode === 'search'}
    <TextSearch
        bind:this={searchComponent}
        {name}
        {searchType}
        {searchValue}
    />
{/if}
