// @flow
import os from 'os'
import HappyPack from 'happypack'
import { group } from '@webpack-blocks/webpack2'
import type { Block, BlockOptions, WebpackBlock } from './types'
import {
  createHappyConfig,
  createRuleHash,
  createRuleId,
  getRules,
  getAllowedLoadersPattern,
  extractLoaders,
  extractAllowedLoaders,
  mergeRule,
} from './utils'

const threadPool = new HappyPack.ThreadPool({ size: os.cpus().length })

const happifyBlock = (
  block: WebpackBlock,
  { loaders = [], ...happypackOptions }: BlockOptions
): WebpackBlock => (...args): Block => {
  const compiledBlock = block(...args)
  const originalRules = getRules(compiledBlock)

  if (!originalRules) return compiledBlock

  const plugins = compiledBlock.plugins || []

  const rules = originalRules.map((rule) => {
    const originalLoaders = extractLoaders(rule)
    const allowedLoaders = extractAllowedLoaders(
      originalLoaders,
      getAllowedLoadersPattern(loaders)
    )

    if (!allowedLoaders) return rule

    const id = createRuleId(rule, createRuleHash(rule))

    const plugin = new HappyPack({
      id,
      threadPool,
      loaders: allowedLoaders,
      ...createHappyConfig(happypackOptions),
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
  { loaders = ['babel-loader', 'css-loader'], ...happypackOptions }: BlockOptions = {}
): Block[] => {
  const options = { loaders, ...happypackOptions }

  // istanbul ignore next
  if (process.env.DISABLE_HAPPY) {
    return group(blocks)
  }

  return group(blocks.map(block =>
    Object.assign(happifyBlock(block, options), {
      pre: block.pre,
      post: []
        .concat(block.post || [])
        .map(postHook => happifyBlock(postHook, options)),
    })
  ))
}

module.exports = happypack
