<!--
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
-->

<script lang="ts">
    import ActionButton from "$lib/components/buttons/ActionButton/ActionButton.svelte";
    import type ActionButtonParams from "$lib/components/buttons/ActionButton/types/action-button-params";
    import { UserData } from "$lib/core/user-data";
    import { Language } from "$lib/core/language";
    import { followEntity, unfollowEntity } from "./utils/follow-api";

    export let entity: string;
    export let id: string;
    export let followers: Record<string, any>;
    export let onFollow: () => void;
    export let onUnfollow: () => void;

    let loading: boolean = false;
    let isFollowed: boolean;
    let style: string;
    let iconStyle: string;
    let params: ActionButtonParams;

    $: {
        const userId = UserData.get()?.user.id ?? null;
        isFollowed = userId ? !!followers[userId] : false;
        style = isFollowed ? 'primary outline' : '';
        iconStyle = isFollowed ? 'ph-fill ph-bell-simple-ringing' : 'ph ph-bell-simple';
        params = {
            name: 'following',
            action: isFollowed ? 'unfollow' : 'follow',
            html: `<i class="${iconStyle}"></i>`,
            style: style,
            disabled: loading,
            tooltip: Language.translate(isFollowed ? 'actionUnfollow' : 'actionFollow'),
        } as ActionButtonParams;
    }

    async function unfollowRecord(): Promise<void> {
        const userData = UserData.get();
        if (!userData) {
            return;
        }

        try {
            loading = true;
            const success = await unfollowEntity(entity, id);

            if (success) {
                delete followers[userData.user.id];
                onUnfollow();
            } else {
                console.error('Error on unfollowing record');
            }
        } catch (e) {
            console.error('Error on unfollowing record', e);
        } finally {
            loading = false;
        }
    }

    async function followRecord(): Promise<void> {
        const userData = UserData.get();
        if (!userData) {
            return;
        }

        try {
            const success = await followEntity(entity, id);

            if (success) {
                followers[userData.user.id] = userData.user.name;
                onUnfollow();
            } else {
                console.error('Error on following record');
            }
        } catch (e) {
            console.error('Error on following record', e);
        } finally {
            loading = false;
        }

        onFollow();
    }

    function execute(e: CustomEvent): void {
        if (params.action === 'unfollow') {
            unfollowRecord();
        } else {
            followRecord();
        }
    }
</script>

<ActionButton {params} on:execute={execute}/>
