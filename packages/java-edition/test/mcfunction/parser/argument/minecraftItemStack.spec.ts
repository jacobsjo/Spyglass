import { showWhitespaceGlyph, testParser } from '@spyglassmc/core/test-out/utils'
import { describe, it } from 'mocha'
import snapshot from 'snap-shot-it'
import { argument } from '../../../../lib/mcfunction/parser'
import type { ArgumentTreeNode } from '../../../../lib/mcfunction/tree'
import { CommandArgumentTestSuites } from './_suites'

describe('mcfunction argument minecraft:item_stack', () => {
	for (const { content, properties } of CommandArgumentTestSuites['minecraft:item_stack']!) {
		const treeNode: ArgumentTreeNode = {
			type: 'argument',
			parser: 'minecraft:item_stack',
			properties,
		}
		for (const string of content) {
			it(`Parse "${showWhitespaceGlyph(string)}"${properties ? ` with ${JSON.stringify(properties)}` : ''}`, () => {
				snapshot(testParser(argument('test', treeNode)!, string, { removeTopLevelChildren: true }))
			})
		}
	}
})
