// @flow
import crypto from 'crypto'
import kebabCase from 'lodash/kebabCase'
import findIdx from 'lodash/findIndex'
import flatten from 'lodash/flatten'
import isEqual from 'lodash/isEqual'
import uniqWith from 'lodash/uniqWith'

import type { BlockOptions, Loader, Rule } from './types'

export const createHappyConfig = ({
  cache, cacheContext, refresh, ...happypackOptions
}: BlockOptions = {}) => ({
  ...happypackOptions,
  cache: typeof cache !== 'undefined' ? cache : !process.env.DISABLE_HAPPY_CACHE,
  cacheContext: {
    env: process.env.NODE_ENV,
    refresh: refresh || process.env.REFRESH_HAPPY_CACHE ? Math.random() : 0,
    ...cacheContext,
  },
})

export const createRuleHash = (rule: Rule): string =>
  crypto
    .createHash('md5')
    .update(JSON.stringify(rule))
    .digest('hex')
    .slice(0, 8)

export const createRuleId = (rule: Rule, hash: string): string =>
  `${kebabCase(rule.test.source)}-${hash}`

export const getAllowedLoadersPattern = (allowedLoaders: Loader[]): RegExp =>
  new RegExp(`^(${allowedLoaders.join('|')})`, 'i')

export const extractLoaders = (rule: Rule): Loader[] =>
  flatten([]
    .concat(rule.loader || rule.loaders || rule.use || [])
    .map(loader => (
      typeof loader === 'string' ? loader.split('!') : [].concat(loader)
    )))

export const extractAllowedLoaders = (loaders: any[], pattern: RegExp): any[] =>
  loaders
    .map((useEntry) => {
      if (typeof useEntry === 'string') return useEntry
      const rule = {
        loader: useEntry.loader,
        options: useEntry.options,
      }
      return rule
    })
    .filter(loader => pattern.test(loader.loader || loader))

export const mergeRule = (
  rule: Rule,
  originalLoaders: any[],
  allowedLoaders: Loader[],
  happypackLoaderId: string
): Rule => {
  const finalRule = {
    ...rule,
    use: originalLoaders.reduce((finalLoaders, original): any[] => {
      const happyLoader = {
        loader: 'happypack/loader',
        options: { id: happypackLoaderId },
      }

      if (original.loader && findIdx(allowedLoaders, v => isEqual(v, original.loader)) >= 0) {
        // ExtractTextPlugin
        finalLoaders.push({ ...original, ...happyLoader })
      } else if (findIdx(allowedLoaders, v => isEqual(v, original)) >= 0) {
        finalLoaders.push(happyLoader)
      } else {
        finalLoaders.push(original)
      }
      return finalLoaders
    }, []),
  }

  finalRule.use = uniqWith(finalRule.use, isEqual)

  delete finalRule.loader
  delete finalRule.loaders

  return finalRule
}
