import { UserData } from "$lib/core/user-data";
import { Notifier } from "$lib/core/notifier";

export async function startStopJm(pause: boolean) {
    let userData = UserData.get();
    if (!userData) {
        return;
    }

    try {
        const response = await fetch('/api/v1/App/action/QueueManagerUpdate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization-Token': btoa(userData.user.userName + ':' + userData.token)
            },
            body: JSON.stringify({pause: pause})
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        await response.json();

        Notifier.notify('Done', 'success');
    } catch (error) {
        console.error('Error:', error);
    }
}
