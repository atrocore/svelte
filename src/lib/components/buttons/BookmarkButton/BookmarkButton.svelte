<script lang="ts">
    import ActionButtonParams from "$lib/components/buttons/ActionButton/types/action-button-params";
    import ActionButton from "$lib/components/buttons/ActionButton/ActionButton.svelte";
    import { Notifier } from "$lib/core/notifier";
    import { Language } from "$lib/core/language";
    import { addBookmark as addBookmarkApi, removeBookmark as removeBookmarkApi } from "./utils/bookmark-api";

    export let entity: string;
    export let id: string;
    export let bookmarkId: string | null = null;
    export let loading: boolean = false;

    let style: string;
    let iconStyle: string;
    let params: ActionButtonParams;

    $: {
        style = bookmarkId ? 'primary outline' : '';
        iconStyle = bookmarkId ? 'ph-fill' : 'ph';
        params = {
            name: 'bookmarking',
            action: bookmarkId ? 'unbookmark' : 'bookmark',
            html: `<i class="${iconStyle} ph-bookmark-simple"></i>`,
            style: style,
            disabled: loading,
            tooltip: Language.translate(bookmarkId ? 'actionUnbookmark' : 'actionBookmark'),
        } as ActionButtonParams;
    }

    async function addBookmark(): Promise<void> {
        Notifier.notify(Language.translate('Bookmarking') + '...');
        loading = true;

        try {
            const data = await addBookmarkApi(entity, id);
            if (data) {
                bookmarkId = data.id;
                Notifier.notify(Language.translate('Done'), 'success');
            }
        } catch (e) {
            console.error('Error on adding bookmark', e);
        } finally {
            loading = false;
        }
    }

    async function removeBookmark(): Promise<void> {
        if (!bookmarkId) {
            return;
        }

        Notifier.notify(Language.translate('Unbookmarking') + '...');
        loading = true;

        try {
            const success = await removeBookmarkApi(bookmarkId);
            if (success) {
                bookmarkId = null;
                Notifier.notify(Language.translate('Done'), 'success');
            }
        } catch (e) {
            console.error('Error on removing bookmark', e);
        } finally {
            loading = false;
        }
    }

    function execute(e: CustomEvent): void {
        if (params.action === 'unbookmark') {
            removeBookmark();
        } else {
            addBookmark();
        }
    }
</script>

<ActionButton {params} on:execute={execute}/>
