import { Metadata } from '$lib/core/metadata';
import { Storage } from '$lib/core/storage';
import { getTabIcon } from '$lib/helpers/icon';
import type { SelectedNode } from '../types/selected-node';

export function buildRuleForNode(node: SelectedNode, scope: string) {
    let field = node.link;
    let operator = 'linked_with';
    if (Metadata.get(['entityDefs', scope, 'fields', field, 'type']) === 'link') {
        field = field + 'Id';
        operator = 'in';
    }
    return {
        operator,
        id: field,
        field,
        value: [node.id],
        data: {
            nameHash: {[node.id]: node.name},
            _treeNodeKey: `${node.link}__${node.id}`
        }
    };
}

export function saveNodes(scope: string, nodes: SelectedNode[]): void {
    Storage.set('treeSelectedNodes', scope, nodes.map(n => ({ id: n.id, name: n.name, link: n.link })));
}

export function loadNodes(scope: string, getLinkScope: (link: string) => string | null): SelectedNode[] {
    const stored: any[] = Storage.get('treeSelectedNodes', scope) || [];
    return stored.map(n => {
        const nodeScope = n.scope || getLinkScope(n.link) || '';
        return { ...n, scope: nodeScope, icon: nodeScope ? getTabIcon(nodeScope) : null };
    });
}

export function filterStaleNodes(nodes: SelectedNode[], rules: any[]): SelectedNode[] {
    const keys = new Set(rules.map((r: any) => r.data._treeNodeKey as string));
    return nodes.filter(n => keys.has(`${n.link}__${n.id}`));
}
