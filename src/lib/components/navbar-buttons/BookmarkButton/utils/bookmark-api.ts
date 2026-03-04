import { Utils } from "$lib/core/utils";

export async function addBookmark(entityType: string, entityId: string): Promise<Record<string, any> | null> {
    const response = await Utils.postRequest('Bookmark', {
        entityType,
        entityId,
    });

    if (response.ok) {
        return await response.json();
    }

    return null;
}

export async function removeBookmark(bookmarkId: string): Promise<boolean> {
    const response = await Utils.request('DELETE', `Bookmark/${bookmarkId}`, null, {
        'permanently': 'true',
    });

    return response.ok;
}
