<!-- LayoutManagerFrame.svelte -->
<script lang="ts">
    import { createEventDispatcher, onMount, tick } from 'svelte';
    import type Button from '$lib/types/ui/button'
    import type Params from './types/params'
    import { Notifier as EspoNotifier } from "$lib/core/notifier";
    import { Notifier } from "$lib/dom/notifier";
    import { LayoutManager } from "$lib/core/layout-manager";
    import { Language } from "$lib/core/language"
    import { UserData } from "$lib/core/user-data";
    import ButtonBar from '$lib/components/buttons/ButtonBar/ButtonBar.svelte';
    import type LayoutData from './types/layout-data';

    const dispatch = createEventDispatcher();
    export let params: Params;

    export let fetch: () => any

    let layoutData: LayoutData | undefined;

    export let loadLayout = (callback: (data: any) => void): void => {
        LayoutManager.get(scope, type, layoutProfileId, callback, false);
    }

    export let validate = (_layout?: any): boolean => {
        return true;
    }

    let disabled = false;

    let buttonList: Button[] = [];
    let buttonContainer: HTMLElement | undefined;

    const profiles = params.layoutProfiles ?? []

    $: {
        const canReset = layoutData?.storedProfile && layoutData.storedProfile.id === params.layoutProfileId && layoutData.canEdit

        buttonList = [
            { name: 'cancel', label: Language.translate('Cancel', 'labels'), onClick: cancel }
        ]

        if (params.inModal) {
            let data = UserData.get();
            if (data && data.user && data.user.isAdmin) {
                buttonList.unshift({
                    name: 'fullEdit',
                    label: Language.translate('fullEdit', 'labels', "LayoutManager"),
                    onClick: () => window.open(`#Admin/layouts/scope=${params.scope}&type=${params.type}${params.relatedScope ? ('&relatedScope=' + params.relatedScope) : ''}${params.layoutProfileId ? ('&layoutProfileId=' + params.layoutProfileId) : ''}`, '_blank')
                })
            }
        }

        if (!params.inModal || layoutData?.canEdit) {
            buttonList.unshift({ name: 'save', label: Language.translate('Save', 'labels'), style: 'primary', onClick: save })
        }

        if (!params.inModal || canReset) {
            buttonList.push({
                name: 'reset',
                disabled: !canReset,
                label: Language.translate('reset', 'labels', 'LayoutManager'),
                onClick: reset
            })
        }
    }

    onMount(async () => {
        await loadData()
        await tick();
        dispatch('ready')

        const externalContainer = document.querySelector('#layout-buttons');

        if (buttonContainer && externalContainer && (params.inModal || params.replaceButtons)) {
            externalContainer.closest('.modal-body')?.classList.add('modal-layout-manager')
            externalContainer.appendChild(buttonContainer);
        }
    });

    async function loadData() {
        Notifier.notify('Loading...')
        return new Promise<void>((resolve) => {
            loadLayout((data) => {
                layoutData = data
                Notifier.clearRegular()
                resolve()
                if (params.afterRender) params.afterRender()
            });
        })
    }

    export function save(): void {
        disabled = true;
        const layoutToSave = fetch();

        if (!validate(layoutToSave)) {
            disabled = false;
            return;
        }
        Notifier.notify('Saving...');

        if (params.inModal) {
            if (!params.getActiveLayoutProfileId?.()) {
                emitUpdate(true)
                return;
            }
        }

        LayoutManager.set(params.scope, params.type, params.relatedScope, params.layoutProfileId, layoutToSave, () => {
            Notifier.notify('Saved', 'success', 2000);
            emitUpdate(false)
            disabled = false
            if (!params.inModal) {
                loadData()
            }
        }, () => {
            disabled = false
        });
    }

    function emitUpdate(reset: boolean): void {
        if (params.onUpdate) {
            params.onUpdate(reset)
        }
    }

    function cancel(): void {
        if (!params.inModal) {
            loadData();
        }
    }

    function reset(): void {
        EspoNotifier.confirm('Are you sure you want to reset this layout?', () => {
            LayoutManager.resetToDefault(params.scope, params.type, params.relatedScope, layoutData.storedProfile?.id, () => {
                emitUpdate(true)
                cancel();
            });
        });
    }
</script>

<div bind:this={buttonContainer}>
    <ButtonBar {buttonList} {disabled} />
</div>

<slot></slot>

<style>
    :global(.modal-layout-manager) {
        padding-top: 0 !important;
        overflow: auto !important;
    }
</style>