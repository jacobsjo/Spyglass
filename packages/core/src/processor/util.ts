import type { AstNode } from '../node'
import { Range } from '../source'

type Callback<R> = (this: void, leaf: AstNode, parents: AstNode[]) => R

export function traverseLeaves(node: AstNode, fn: Callback<unknown>, range?: Range): void
export function traverseLeaves(node: AstNode, fn: Callback<unknown>, range?: Range, existingParents: AstNode[] = []): void {
	if (range && !Range.intersects(node.range, range)) {
		return
	}
	if (node.children?.length) {
		for (const child of node.children) {
			existingParents.unshift(node);
			(traverseLeaves as any)(child, fn, range, existingParents)
			existingParents.shift()
		}
	} else {
		fn(node, existingParents)
	}
}

// mASteRPiecE /s
// export function traverseLeaves(node: AstNode, fn: Callback<unknown>): void {
// 	// LIFO, but things are inserted at the beginning.
// 	const stack: AstNode[] = [node]
// 	const visitedIndices: number[] = [-1]
// 	while (stack.length) {
// 		let visitedIndex = visitedIndices[0]
// 		if (!top.children || visitedIndex === top.children.length - 1) {
// 			if (!top.children) {
// 				fn(top, stack)
// 			}
// 			stack.shift()
// 			visitedIndices.shift()
// 		} else {
// 			visitedIndex = visitedIndices[0] += 1
// 			stack.unshift(top.children[visitedIndex])
// 			visitedIndices.unshift(-1)
// 		}
// 	}
// }

export function traversePreOrder(node: AstNode, positivePredicate: Callback<unknown>, negativePredicate: Callback<unknown>, fn: Callback<unknown>): void
export function traversePreOrder(node: AstNode, positivePredicate: Callback<unknown>, negativePredicate: Callback<unknown>, fn: Callback<unknown>, existingParents: AstNode[] = []): void {
	if (negativePredicate(node, existingParents)) {
		return
	}
	if (positivePredicate(node, existingParents)) {
		fn(node, existingParents)
		return
	}
	for (const child of node.children ?? []) {
		existingParents.unshift(node);
		(traversePreOrder as any)(child, positivePredicate, negativePredicate, fn, existingParents)
		existingParents.shift()
	}
}

export function selectedLeaf(node: AstNode, offset: number): { leaf: AstNode, parents: AstNode[] } | null
export function selectedLeaf(node: AstNode, offset: number, existingParents: AstNode[] = []): { leaf: AstNode, parents: AstNode[] } | null {
	if (Range.contains(node.range, offset)) {
		if (node.children?.length) {
			existingParents.unshift(node)
			// TODO: Binary search here.
			for (const child of node.children) {
				const result = (selectedLeaf as any)(child, offset, existingParents)
				if (result) {
					return result
				}
			}
			existingParents.shift()
		}
		return { leaf: node, parents: existingParents }
	}
	return null
}
