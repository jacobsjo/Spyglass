import { localize } from '@spyglassmc/locales'
import type { FloatNode, Mutable } from '../node'
import type { ParserContext } from '../service'
import { ErrorSeverity, Range, Source } from '../source'
import type { InfallibleParser, Parser, Result } from './Parser'
import { Failure } from './Parser'

interface OptionsBase {
	pattern: RegExp,
	/**
	 * Inclusive.
	 */
	min?: number,
	/**
	 * Inclusive.
	 */
	max?: number,
	/**
	 * A callback function that will be called when the numeral value is out of range.
	 * 
	 * Defaults to a function that marks an `Error` at the range of the node.
	 */
	onOutOfRange?: (ans: FloatNode, src: Source, ctx: ParserContext, options: Options) => void,
}

interface FallibleOptions extends OptionsBase {
	failsOnEmpty: true,
}

interface InfallibleOptions extends OptionsBase {
	failsOnEmpty?: false,
}

/** @internal For test only */
export type Options = FallibleOptions | InfallibleOptions

const fallbackOnOutOfRange = (ans: FloatNode, _src: Source, ctx: ParserContext, options: Options) => {
	ctx.err.report(
		localize('expected', [localize('float.between', [options.min ?? '-∞', options.max ?? '+∞'])]),
		ans,
		ErrorSeverity.Error
	)
}

export function float(options: InfallibleOptions): InfallibleParser<FloatNode>
export function float(options: FallibleOptions): Parser<FloatNode>
export function float(options: Options): Parser<FloatNode> {
	return (src: Source, ctx: ParserContext): Result<FloatNode> => {
		const ans: Mutable<FloatNode> = {
			type: 'float',
			range: Range.create(src),
			value: 0,
		}

		if (src.peek() === '-' || src.peek() === '+') {
			src.skip()
		}
		while (src.canRead() && Source.isDigit(src.peek())) {
			src.skip()
		}

		if (src.peek() === '.') {
			src.skip()
			while (src.canRead() && Source.isDigit(src.peek())) {
				src.skip()
			}
		}

		if (src.peek().toLowerCase() === 'e') {
			src.skip()
			if (src.peek() === '-' || src.peek() === '+') {
				src.skip()
			}
			while (src.canRead() && Source.isDigit(src.peek())) {
				src.skip()
			}
		}

		ans.range.end = src.cursor
		const raw = src.slice(ans.range)
		ans.value = parseFloat(raw) || 0

		if (!raw) {
			if (options.failsOnEmpty) {
				return Failure
			}
			ctx.err.report(localize('expected', [localize('float')]), ans)
		} else if (!options.pattern.test(raw)) {
			ctx.err.report(localize('parser.float.illegal', [options.pattern.toString()]), ans)
		} else if ((options.min && ans.value < options.min) || (options.max && ans.value > options.max)) {
			const onOutOfRange = options.onOutOfRange ?? fallbackOnOutOfRange
			onOutOfRange(ans, src, ctx, options)
		}

		return ans
	}
}