import { Utils } from "$lib/core/utils";

export async function followEntity(entity: string, id: string): Promise<boolean> {
    const response = await Utils.request('PUT', `${entity}/${id}/subscription`, null);
    return response.ok;
}

export async function unfollowEntity(entity: string, id: string): Promise<boolean> {
    const response = await Utils.request('DELETE', `${entity}/${id}/subscription`, null);
    return response.ok;
}
