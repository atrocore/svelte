<script lang="ts">
    import type Button from "$lib/components/SortableListPicker/types/button";
    import type Params from "$lib/components/SortableListPicker/types/params";
    import { Language } from "$lib/core/language"

    export let params: Params;
    export let fetch: any


    export let validate = (itemsToSave: Array<any>):boolean => {
        return true;
    }

    let disabled = false;

    export let buttonList: Button[] = [
        {name: 'save', label: Language.translate('Save', 'labels'), style: 'primary'},
        {name: 'cancel', label: Language.translate('Cancel', 'labels')}
    ];

    export function save(): void {
        disabled = true;
        const itemsToSave = fetch();
        if (validate(itemsToSave) && params.onSaved) {
            params.onSaved(itemsToSave)
        }
        disabled = false
    }


    function cancel(): void {
    }


    function onClick(button: Button): void {
        if (button.action) {
            button.action();
            return;
        }
        switch (button.name) {
            case 'save':
                save()
                break
            case 'cancel':
                cancel()
                break
        }
    }
</script>

<div class="button-container" style="padding-top: 10px">
    {#each buttonList as button}
        <button on:click={()=>onClick(button)}
                data-action="{button.name}"
                disabled={disabled}
                type="button"
                style="{button.cssStyle}"
                class={`action ${button.style ?? ''}`}>
            {button.label}
        </button>
    {/each}
</div>

<slot></slot>

<style>
    .button-container {
        display: flex;
        gap: 10px;
    }
</style>
