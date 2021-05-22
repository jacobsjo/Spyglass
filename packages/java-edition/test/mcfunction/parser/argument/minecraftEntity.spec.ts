import { showWhitespaceGlyph, testParser } from '@spyglassmc/core/test-out/utils'
import { describe, it } from 'mocha'
import snapshot from 'snap-shot-it'
import { argument } from '../../../../lib/mcfunction/parser'
import type { ArgumentTreeNode } from '../../../../lib/mcfunction/tree'
import { CommandArgumentTestSuites } from './_suites'

describe('mcfunction argument minecraft:entity', () => {
	for (const { content, properties } of CommandArgumentTestSuites['minecraft:entity']!) {
		const treeNode: ArgumentTreeNode = {
			type: 'argument',
			parser: 'minecraft:entity',
			properties,
		}
		for (const string of content) {
			it(`Parse "${showWhitespaceGlyph(string)}"${properties ? ` with ${JSON.stringify(properties)}` : ''}`, () => {
				snapshot(testParser(argument('test', treeNode)!, string, { removeTopLevelChildren: true }))
			})
		}
	}
})
