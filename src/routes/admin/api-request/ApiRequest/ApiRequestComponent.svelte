<script lang="ts">
    import { Language } from "$lib/core/language"
    import { ModelFactory } from "$lib/core/model-factory";
    import { onMount } from "svelte";

    import BaseHeader from "$lib/components/headers/BaseHeader/BaseHeader.svelte";

    export let afterOnMount = (model: Record<string, any>) => null;
    export let sendRequest = (model: Record<string, any>) => null;

    let model: Record<string, any>;


    onMount(() => {
        ModelFactory.create('', m => {
            model = m;
            afterOnMount(model);
        })
    })

    const breadcrumbs = [
        {
            url: '#Admin',
            label: Language.translate('Administration')
        },
        {
            url: '#',
            label: Language.translate('apiRequest', 'labels', 'Admin'),
            className: 'header-title'
        }
    ];

</script>

<div class="page-header">
    <BaseHeader breadcrumbs={breadcrumbs} scope="App" id="apiRequest"/>

    <button on:click={sendRequest(model)} style="margin: 10px 7px 0 5px" class="primary action" data-action="execute"
            type="button">{Language.translate('execute', 'labels', 'Admin')}</button>
</div>

<div class="row">
    <div class="col-sm-3">
        <div class="row">
            <div class="col-xs-12 cell form-group">
                <label class="control-label" data-name="type">{Language.translate('Type', 'fields', 'Admin')}</label>
                <div class="field" data-name="type"></div>
            </div>
        </div>
    </div>
</div>
<div class="row">
    <div class="col-sm-12 col-md-6 cell form-group">
        <label class="control-label" data-name="request">{Language.translate('request', 'fields', 'Admin')}</label>
        <div class="field" data-name="request"></div>
    </div>
    <div class="col-sm-12 col-md-6 cell form-group">
        <label style="width:100%" class="control-label" data-name="response">{Language.translate('response', 'fields', 'Admin')}
            <span class="pull-right status hidden">{Language.translate('status', 'labels', 'Admin')}: <span></span></span></label>
        <div class="field" data-name="response"></div>
    </div>
</div>




