// @flow
import os from 'os'
import HappyPack from 'happypack'
import { group } from '@webpack-blocks/webpack'
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
import webpackMerge from 'webpack-merge'

const threadPool = new HappyPack.ThreadPool({ size: os.cpus().length })


// Add HappyPack to a block
// Input: webpack block function -- (context, utils) => prevConfig => newConfig
// Return new block function
const happifyBlock = (
  block: WebpackBlock,
  { loaders, ...happypackOptions }: BlockOptions
): WebpackBlock => (context, utils): Block => prevConfig => {

  console.log('COUNT')

  const compiledBlock = block(context, utils)(prevConfig)
  const originalRules = getRules(compiledBlock)

  if (!originalRules) return prevConfig;

  const plugins = compiledBlock.plugins || []

  const rules = originalRules.map((rule) => {
    const originalLoaders = extractLoaders(rule)
    const allowedLoaders = extractAllowedLoaders(
      originalLoaders,
      // eslint-disable-next-line flowtype-errors/show-errors
      getAllowedLoadersPattern(loaders)
    )

    if (!allowedLoaders.length) return rule

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
      post: block.post,
    })
  ))
}

module.exports = happypack
