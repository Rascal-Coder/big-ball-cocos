import { Node } from 'cc';

export function findNode(root: Node | null | undefined, name: string): Node | null {
    if (!root?.isValid) {
        return null;
    }
    if (root.name === name) {
        return root;
    }
    for (const child of root.children) {
        const hit = findNode(child, name);
        if (hit) {
            return hit;
        }
    }
    return null;
}
