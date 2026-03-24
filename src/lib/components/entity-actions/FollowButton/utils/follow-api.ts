import { ApiClient } from '$lib/core/api-client';

export async function followEntity(entity: string, id: string): Promise<boolean> {
    try {
        await ApiClient.patch(`${entity}/${id}/subscription`);
        return true;
    } catch {
        return false;
    }
}

export async function unfollowEntity(entity: string, id: string): Promise<boolean> {
    try {
        await ApiClient.delete(`${entity}/${id}/subscription`);
        return true;
    } catch {
        return false;
    }
}
