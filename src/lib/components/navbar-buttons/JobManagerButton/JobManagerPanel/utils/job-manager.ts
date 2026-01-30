import { UserData } from "$lib/core/user-data";
import { Notifier } from "$lib/core/notifier";
import { Utils } from "$lib/core/utils";

export async function startStopJm(pause: boolean) {
    let userData = UserData.get();
    if (!userData) {
        return;
    }

    try {
        const response = await Utils.postRequest('App/action/JobManagerUpdate', {pause: pause})

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        await response.json();

        Notifier.notify('Done', 'success');
    } catch (error) {
        console.error('Error:', error);
    }
}
