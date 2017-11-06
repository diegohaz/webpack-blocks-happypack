import { createConfig, match } from '@webpack-blocks/webpack'
import babel from '@webpack-blocks/babel'
import { css } from '@webpack-blocks/assets'
import extractText from '@webpack-blocks/extract-text'
import prettyFormat from 'pretty-format'
import happypack from '../src'

jest.mock('os', () => ({
  cpus: () => [1, 2, 3],
}))

jest.mock('../src/utils', () => ({
  ...require.requireActual('../src/utils'),
  createRuleHash: () => 'foo',
}))

// Prevent extract text plugin from being serialized with a local (device-specific) path
const extractTextPath = require.resolve('extract-text-webpack-plugin/dist/loader')
expect.addSnapshotSerializer({
  test: value => value && value.loader && value.loader === extractTextPath,
  print: value => prettyFormat({
    ...value,
    loader: 'extract-text-plugin (replaced)',
  }),
})

describe('happypack', () => {
  test('babel', () => {
    const config = createConfig([
      happypack([
        babel(),
      ]),
    ])
    expect(config).toMatchSnapshot()
  })

  test('cssModules', () => {
    const config = createConfig([
      happypack([
        css.modules(),
      ]),
    ])
    expect(config).toMatchSnapshot()
  })

  test('extractText', () => {
    const config = createConfig([
      css.modules(),
      happypack([
        extractText(),
      ]),
    ])
    expect(config).toMatchSnapshot()
  })

  test('not allowed loaders', () => {
    const config = createConfig([
      happypack([
        babel(),
      ], {
        loaders: ['css-loader'],
      }),
    ])
    expect(config).toMatchSnapshot()
  })
})
