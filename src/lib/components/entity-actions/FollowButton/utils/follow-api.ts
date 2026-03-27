import { ApiClient } from '$lib/core/api-client';

export async function followEntity(entity: string, id: string): Promise<boolean> {
    try {
        await ApiClient.post('entitySubscription', { entityName: entity, id });
        return true;
    } catch {
        return false;
    }
}

export async function unfollowEntity(entity: string, id: string): Promise<boolean> {
    try {
        await ApiClient.delete('entitySubscription', { entityName: entity, id });
        return true;
    } catch {
        return false;
    }
}
