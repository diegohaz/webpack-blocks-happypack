// @flow
import os from 'os'
import HappyPack from 'happypack'
import { group } from '@webpack-blocks/webpack2'
import type { Block } from './types'
import {
  createRuleHash,
  createRuleId,
  getRules,
  getAllowedLoadersPattern,
  extractLoaders,
  extractAllowedLoaders,
  mergeRule,
} from './utils'

/** */
type Options = {
  loaders: string[],
}

/** */
type WebpackBlock = () => Block

const threadPool = new HappyPack.ThreadPool({ size: os.cpus().length })

const happyConfig = {
  cache: !process.env.DISABLE_HAPPY_CACHE,
  cacheContext: {
    env: process.env.NODE_ENV,
    refresh: process.env.REFRESH_HAPPY_CACHE ? Math.random() : 0,
  },
}

const happifyBlock = (block: WebpackBlock, options: Options): WebpackBlock =>
  (...args): Block => {
    const compiledBlock = block(...args)
    const originalRules = getRules(compiledBlock)
    if (!originalRules) return compiledBlock

    const plugins = compiledBlock.plugins || []

    const rules = originalRules.map((rule) => {
      const originalLoaders = extractLoaders(rule)
      const allowedLoaders = extractAllowedLoaders(
        originalLoaders,
        getAllowedLoadersPattern(options.loaders)
      )

      if (!allowedLoaders) return rule

      const id = createRuleId(rule, createRuleHash(rule))

      const plugin = new HappyPack({
        id,
        threadPool,
        loaders: allowedLoaders,
        ...happyConfig,
      })

      plugins.push(plugin)

      return mergeRule(rule, originalLoaders, allowedLoaders, id)
    })

    return {
      ...compiledBlock,
      plugins,
      module: {
        rules,
      },
    }
  }

/** */
const happypack = (
  blocks: WebpackBlock[],
  { loaders = ['babel-loader', 'css-loader'] }: Options = {}
): Block[] => {
  if (process.env.DISABLE_HAPPY) {
    return group(blocks)
  }
  return group(blocks.map(block => happifyBlock(block, { loaders })))
}

module.exports = happypack
