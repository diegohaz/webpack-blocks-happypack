import { createConfig } from '@webpack-blocks/webpack2'
import babel from '@webpack-blocks/babel6'
import cssModules from '@webpack-blocks/css-modules'
import extractText from '@webpack-blocks/extract-text2'
import prettyFormat from 'pretty-format'
import happypack from '../src'

jest.mock('os', () => ({
  cpus: () => [1, 2, 3],
}))

jest.mock('../src/utils', () => ({
  ...require.requireActual('../src/utils'),
  createRuleHash: () => 'foo',
}))

const extractTextPath = require.resolve('extract-text-webpack-plugin/loader')

expect.addSnapshotSerializer({
  test: value => value.loader && value.loader === extractTextPath,
  print: value => prettyFormat({
    ...value,
    loader: 'foo',
  }),
})

describe('happypack', () => {
  test('babel', () => {
    const config = createConfig.vanilla([
      happypack([
        babel(),
      ]),
    ])
    expect(config).toMatchSnapshot()
  })

  test('cssModules', () => {
    const config = createConfig.vanilla([
      happypack([
        cssModules(),
      ]),
    ])
    expect(config).toMatchSnapshot()
  })

  test('extractText', () => {
    const config = createConfig.vanilla([
      cssModules(),
      happypack([
        extractText(),
      ]),
    ])
    expect(config).toMatchSnapshot()
  })

  test('not allowed loaders', () => {
    const config = createConfig.vanilla([
      happypack([
        babel(),
      ], {
        loaders: ['css-loader'],
      }),
    ])
    expect(config).toMatchSnapshot()
  })
})
