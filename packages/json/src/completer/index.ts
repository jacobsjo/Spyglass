import type { CompleterContext } from '@spyglassmc/core'
import { CompletionKind, CompletionToken, selectedNode } from '@spyglassmc/core'
import type { JsonAstNode, JsonExpectation, JsonObjectAstNode, JsonObjectExpectation } from '../node'

export const JsonTriggerCharacters = ['\n', ':', '"']

const SIMPLE_SNIPPETS = {
	'json:object': '{$1}',
	'json:array': '[$1]',
	'json:string': '"$1"',
	'json:boolean': '${1|false,true|}',
	'json:number': '${1:0}',
	'json:union': '',
}

export function entry(root: JsonAstNode, ctx: CompleterContext): CompletionToken[] {
	const result = selectedNode(root, ctx.offset)
	if (result) {
		const n0 = result.node as JsonAstNode
		const n1 = result.parents[0] as JsonAstNode
		const n2 = result.parents[1] as JsonAstNode

		// Object properties
		// { "foo": 1, | }
		if (n0.type === 'json:object') {
			if (n0.expectation?.type === 'json:object') {
				return objectCompletion(n0, n0.expectation, ctx, false)
			} else if (n0.expectation?.type === 'json:union') {
				const expectation = n0.expectation.options.find(o => o.type === 'json:object')
				if (expectation) {
					return objectCompletion(n0, expectation as JsonObjectExpectation, ctx, false)
				}
			}
		}
		// { "foo": 1, "|" }
		if (n0.type === 'json:string' && n1.type === 'json:property' && n1.key === n0 && n2.type === 'json:object') {
			if (n2.expectation?.type == 'json:object') {
				return objectCompletion(n2, n2.expectation, ctx, true)
			} else if (n2.expectation?.type === 'json:union') {
				const expectation = n2.expectation.options.find(o => o.type === 'json:object')
				if (expectation) {
					return objectCompletion(n2, expectation as JsonObjectExpectation, ctx, true)
				}
			}
		}

		// Inside a string
		// { "foo": "|" }
		if (n0.type === 'json:string' && n0.expectation?.type === 'json:string') {
			if (Array.isArray(n0.expectation.pool)) {
				return n0.expectation.pool.map(v => CompletionToken.create(v, `"${v}"`, {
					kind: CompletionKind.Value,
					filterText: `"${v}"`,
				}))
			}
		}

		// Values after an object property
		// { "foo": | }
		if (n0.type === 'json:property' && n0.value === undefined && ctx.offset >= n0.key.range.end && n1.type === 'json:object' && n1.expectation?.type === 'json:object' && n1.expectation.fields) {
			const field = n1.expectation.fields.find(f => f.key === n0.key.value)
			if (field?.value) {
				return valueCompletion(field.value, ctx)
			}
		}

		// Values in an array
		// { "foo": [|] }
		if (n0.type === 'json:array' && n0.expectation?.type === 'json:array' && n0.expectation.items) {
			return valueCompletion(n0.expectation.items, ctx)
		}
	}
	return []
}

function objectCompletion(node: JsonObjectAstNode, expectation: JsonObjectExpectation, ctx: CompleterContext, quoted: boolean) {
	const comma = node.properties.find(p => p.key.range.start > ctx.offset) !== undefined
	if (expectation.fields) {
		return expectation.fields!
			.filter(f => !node.properties.find(p => f.key === p.key.value))
			.map(f => fieldCompletion(f, comma, quoted))
	} else if (expectation.keys) {
		return valueCompletion(expectation.keys, ctx)
	}
	return []
}

function fieldCompletion(field: Exclude<JsonObjectExpectation['fields'], undefined>[number], comma: boolean, quoted: boolean) {
	const value = field.value ? SIMPLE_SNIPPETS[field.value.type] : ''
	const text = `"${field.key}": ${value}${comma ? ',' : ''}`
	return CompletionToken.create(field.key, text, {
		kind: CompletionKind.Property,
		detail: field.value?.typedoc,
		sortText: `${field.deprecated ? 2 : field.opt ? 1 : 0}${field.key}`,
		deprecated: field.deprecated,
		...quoted ? { filterText: `"${field.key}"` } : {},
	})
}

function valueCompletion(expectation: JsonExpectation, ctx: CompleterContext): CompletionToken[] {
	switch(expectation.type) {
		case 'json:object':
		case 'json:array':
		case 'json:string':
			return [simpleCompletion(SIMPLE_SNIPPETS[expectation.type])]
		case 'json:boolean':
			return ['false', 'true'].map(simpleCompletion)
		case 'json:number':
			return [simpleCompletion('0')]
		case 'json:union':
			return expectation.options.reduce((a, o) => [
				...a,
				...valueCompletion(o, ctx).filter(c => !a.find(t => t.label === c.label)),
			], [] as CompletionToken[])
	}
}

function simpleCompletion(value: string) {
	return CompletionToken.create(value.replace('$1', ''), value, {
		kind: CompletionKind.Value,
	})
}