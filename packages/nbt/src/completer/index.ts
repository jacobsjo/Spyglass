import * as core from '@spyglassmc/core'
import * as mcdoc from '@spyglassmc/mcdoc'
import type {
	NbtCollectionNode,
	NbtCompoundNode,
	NbtNode,
	NbtPrimitiveNode,
	NbtStringNode,
} from '../node/index.js'

const collection: core.Completer<NbtCollectionNode> = (node, ctx) => {
	const index = core.binarySearch(node.children, ctx.offset, (n, o) => {
		return core.Range.compareOffset(n.range, o, true)
	})
	const item = index >= 0 ? node.children[index] : undefined
	if (item?.value) {
		return ctx.meta.getCompleter(item.value.type)(item.value, ctx)
	}
	if (node.typeDef?.kind === 'list') {
		const completions = getValues(node.typeDef.item, ctx.offset, ctx)
		if (ctx.offset < node.children[node.children.length - 1]?.range.start ?? 0) {
			return completions.map(c => ({ ...c, insertText: c.insertText + ',' }))
		}
		return completions
	}
	return []
}

const compound = core.completer.record<NbtStringNode, NbtNode, NbtCompoundNode>({
	key: (record, pair, ctx, range, iv, ipe, exitingKeys) => {
		if (!record.typeDef) {
			return []
		}
		const keySet = new Set(exitingKeys.map(n => n.value))
		return mcdoc.runtime.completer
			.getFields(record.typeDef, ctx)
			.filter(({ key }) => !keySet.has(key))
			.map(({ key, field }) =>
				core.CompletionItem.create(key, pair?.key ?? range, {
					kind: core.CompletionKind.Field,
					detail: mcdoc.McdocType.toString(field.type as core.Mutable<mcdoc.McdocType>),
					deprecated: field.deprecated,
					sortText: field.optional ? '$b' : '$a', // sort above hardcoded $schema
					filterText: formatKey(key, pair?.key?.quote),
					insertText: `${formatKey(key, pair?.key?.quote)}${iv ? ':' : ''}${ipe ? '$1,' : ''}`,
				})
			)
	},
	value: (record, pair, ctx, range) => {
		if (pair.value) {
			return ctx.meta.getCompleter(pair.value.type)(pair.value, ctx)
		}
		if (pair.key && record.typeDef) {
			const pairKey = pair.key.value
			const field = mcdoc.runtime.completer.getFields(record.typeDef, ctx)
				.find(({ key }) => key === pairKey)
				?.field.type
			if (field) {
				return getValues(field, range, ctx)
			}
		}
		return []
	},
})

const primitive: core.Completer<NbtPrimitiveNode> = (node, ctx) => {
	const insideRange = core.Range.contains(node, ctx.offset, true)
	if (node.type === 'nbt:string' && node.children?.length && insideRange) {
		const childItems = core.completer.string(node, ctx)
		if (childItems.length > 0) {
			return childItems
		}
	}
	if (!node.typeDef) {
		return []
	}
	return getValues(node.typeDef, insideRange ? node : ctx.offset, ctx)
}

function getValues(
	typeDef: core.DeepReadonly<mcdoc.McdocType>,
	range: core.RangeLike,
	ctx: core.CompleterContext,
): core.CompletionItem[] {
	return mcdoc.runtime.completer.getValues(typeDef, ctx)
		.map(({ value, detail, kind, completionKind }) =>
			core.CompletionItem.create(value, range, {
				kind: completionKind ?? core.CompletionKind.Value,
				detail,
				filterText: formatValue(value, kind),
				insertText: formatValue(value, kind),
			})
		)
}

function formatKey(key: string, quote?: core.Quote) {
	if (!quote && core.BrigadierUnquotablePattern.test(key)) {
		return key
	}
	const q = quote ?? '"'
	return q + core.completer.escapeString(key, q) + q
}

function formatValue(value: string, kind?: mcdoc.McdocType['kind']) {
	switch (kind) {
		case 'string':
			return `"${core.completer.escapeString(value, '"')}"`
		case 'byte':
			return `${value}b`
		case 'short':
			return `${value}s`
		case 'long':
			return `${value}L`
		case 'float':
			return `${value}f`
		default:
			return value
	}
}

export function register(meta: core.MetaRegistry): void {
	meta.registerCompleter('nbt:byte', primitive)
	meta.registerCompleter('nbt:byte_array', collection)
	meta.registerCompleter('nbt:compound', compound)
	meta.registerCompleter('nbt:double', primitive)
	meta.registerCompleter('nbt:int', primitive)
	meta.registerCompleter('nbt:int_array', collection)
	meta.registerCompleter('nbt:list', collection)
	meta.registerCompleter('nbt:long', primitive)
	meta.registerCompleter('nbt:long_array', collection)
	meta.registerCompleter('nbt:string', primitive)
	meta.registerCompleter('nbt:short', primitive)
	meta.registerCompleter('nbt:float', primitive)
}
