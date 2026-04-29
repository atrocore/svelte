import { UserData } from "$lib/core/user-data";
import { Notifier } from "$lib/dom/notifier";
import { ApiClient } from '$lib/core/api-client';

export async function startStopJm(pause: boolean) {
    let userData = UserData.get();
    if (!userData) {
        return;
    }

    try {
        await ApiClient.post('jobManagerPause', { pause });
        Notifier.notify('Done', 'success');
    } catch (error) {
        console.error('Error:', error);
    }
}
