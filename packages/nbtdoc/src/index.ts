import { MetaRegistry } from '@spyglassmc/core'
import * as binder from './binder'
import * as checker from './checker'
import * as colorizer from './colorizer'
import type { CompoundFieldTypeNode, IdentifierToken, LiteralToken, MinecraftIdentifierToken } from './node'
import * as parser from './parser'

export * as colorizer from './colorizer'
export * from './node'
export * from './parser'

/* istanbul ignore next */
export function initializeNbtdoc() {
	MetaRegistry.addInitializer((registry) => {
		registry.registerLanguage('nbtdoc', {
			extensions: ['.nbtdoc'],
			parser: parser.entry,
			checker: checker.entry,
		})

		registry.registerColorizer<CompoundFieldTypeNode>('nbtdoc:compound_definition/field/type', colorizer.compoundFieldType)
		registry.registerColorizer<IdentifierToken>('nbtdoc:identifier', colorizer.identifier)
		registry.registerColorizer<LiteralToken>('nbtdoc:literal', colorizer.literal)
		registry.registerColorizer<MinecraftIdentifierToken>('nbtdoc:minecraft_identifier', colorizer.minecraftIdentifier)

		registry.registerUriBinder(binder.uriBinder)
	})
}
