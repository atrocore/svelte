import { ApiClient } from '$lib/core/api-client';

export async function addBookmark(entityType: string, entityId: string): Promise<Record<string, any> | null> {
    try {
        return await ApiClient.post<Record<string, any>>('Bookmark', { entityType, entityId });
    } catch {
        return null;
    }
}

export async function removeBookmark(bookmarkId: string): Promise<boolean> {
    try {
        await ApiClient.delete(`Bookmark/${bookmarkId}`, undefined, { 'permanently': 'true' });
        return true;
    } catch {
        return false;
    }
}
