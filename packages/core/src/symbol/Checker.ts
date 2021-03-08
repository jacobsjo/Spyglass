import type { AstNode } from '../node'
import type { CheckerContext } from '../service'

export type Checker<N extends AstNode> = (node: N, ctx: CheckerContext) => Promise<void>

export const FallbackChecker: Checker<any> = () => Promise.resolve()
