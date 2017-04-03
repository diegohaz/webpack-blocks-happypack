// @flow
import crypto from 'crypto'
import kebabCase from 'lodash/kebabCase'
import flatten from 'lodash/flatten'
import uniq from 'lodash/uniq'
import type { Loader, Rule, Block } from './types'

export const createRuleHash = (rule: Rule): string =>
  crypto
    .createHash('md5')
    .update(JSON.stringify(rule))
    .digest('hex')
    .slice(0, 8)

export const createRuleId = (rule: Rule, hash: string): string =>
  `${kebabCase(rule.test.source)}-${hash}`

export const getRules = (block: Block): ?Rule[] => (
  block.module ? block.module.loaders || block.module.rules : undefined
)

export const getAllowedLoadersPattern = (allowedLoaders: Loader[]): RegExp =>
  new RegExp(`^(${allowedLoaders.join('|')})`, 'i')

export const extractLoaders = (rule: Rule): Loader[] =>
  flatten([]
    .concat(rule.loader || rule.loaders || rule.use || [])
    .map(loader => loader.split('!'))
  )

export const extractAllowedLoaders = (loaders: any, pattern: RegExp): Loader[] =>
  loaders
    .map(loader => loader.loader || loader)
    .filter(loader => pattern.test(loader))

export const mergeRule = (
  rule: Rule,
  originalLoaders: any[],
  allowedLoaders: Loader[],
  happypackLoaderId: string
): Rule => {
  const finalRule = {
    ...rule,
    use: originalLoaders.reduce((finalLoaders, originalLoader): any[] => {
      const happyLoader = `happypack/loader?id=${happypackLoaderId}`

      if (originalLoader.loader && allowedLoaders.indexOf(originalLoader.loader) >= 0) {
        // ExtractTextPlugin
        finalLoaders.push({ loader: happyLoader })
      } else if (allowedLoaders.indexOf(originalLoader) >= 0) {
        finalLoaders.push(happyLoader)
      } else {
        finalLoaders.push(originalLoader)
      }
      return finalLoaders
    }, []),
  }

  finalRule.use = uniq(finalRule.use)

  delete finalRule.loader
  delete finalRule.loaders

  return finalRule
}
