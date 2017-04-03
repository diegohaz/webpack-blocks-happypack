import {
  createRuleHash,
  createRuleId,
  getRules,
  getAllowedLoadersPattern,
  extractLoaders,
  extractAllowedLoaders,
  mergeRule,
} from '../src/utils'

describe('createRuleHash', () => {
  it('returns rule hash', () => {
    const hash = createRuleHash({
      test: /\.jsx?$/,
      use: ['babel-loader'],
    })
    expect(hash).toEqual(expect.stringMatching(/^[a-z0-9]{8}$/i))
  })
})

describe('createRuleId', () => {
  it('returns rule id', () => {
    const id = createRuleId({
      test: /\.jsx?$/,
      use: ['babel-loader'],
    }, '123')
    expect(id).toBe('jsx-123')
  })
})

describe('getRules', () => {
  it('returns module.loaders', () => {
    expect(getRules({ module: { loaders: [1, 2, 3] } })).toEqual([1, 2, 3])
  })

  it('returns module.rules', () => {
    expect(getRules({ module: { rules: [1, 2, 3] } })).toEqual([1, 2, 3])
  })

  it('returns undefined', () => {
    expect(getRules({})).toBeUndefined()
  })
})

describe('getAllowedLoadersPattern', () => {
  it('returns allowed loaders pattern', () => {
    const pattern = getAllowedLoadersPattern(['css-loader', 'babel-loader'])
    expect(pattern).toEqual(/^(css-loader|babel-loader)/i)
  })
})

describe('extractLoaders', () => {
  it('returns loaders split by !', () => {
    expect(extractLoaders({ loader: 'foo!bar!baz' })).toEqual(['foo', 'bar', 'baz'])
    expect(extractLoaders({ loader: ['foo!bar!baz', 'foo'] }))
      .toEqual(['foo', 'bar', 'baz', 'foo'])
  })

  it('returns rule.loader', () => {
    expect(extractLoaders({ loader: 'foo' })).toEqual(['foo'])
    expect(extractLoaders({ loader: ['foo', 'bar'] })).toEqual(['foo', 'bar'])
  })

  it('returns rule.loaders', () => {
    expect(extractLoaders({ loaders: 'foo' })).toEqual(['foo'])
    expect(extractLoaders({ loaders: ['foo', 'bar'] })).toEqual(['foo', 'bar'])
  })

  it('returns rule.use', () => {
    expect(extractLoaders({ use: 'foo' })).toEqual(['foo'])
    expect(extractLoaders({ use: ['foo', 'bar'] })).toEqual(['foo', 'bar'])
  })

  it('returns empty array', () => {
    expect(extractLoaders({})).toEqual([])
  })
})

describe('extractAllowedLoaders', () => {
  const pattern = /^(babel-loader|css-loader)/

  it('filters none', () => {
    const allowedLoaders = extractAllowedLoaders(
      ['foo-loader', 'bar-loader'],
      pattern
    )
    expect(allowedLoaders).toEqual([])
  })

  it('filters normal loaders', () => {
    const allowedLoaders = extractAllowedLoaders(
      ['babel-loader', 'foo-loader'],
      pattern
    )
    expect(allowedLoaders).toEqual(['babel-loader'])
  })

  it('filters extract text loader', () => {
    const allowedLoaders = extractAllowedLoaders(
      ['babel-loader', { loader: 'css-loader' }],
      pattern
    )
    expect(allowedLoaders).toEqual(['babel-loader', 'css-loader'])
  })
})

describe('mergeRule', () => {
  test('standard rule', () => {
    const rule = {
      test: /\.jsx?$/,
      loader: 'babel-loader',
    }
    const originalLoaders = ['babel-loader']
    const allowedLoaders = ['babel-loader']
    const happypackLoaderId = 'jsx-123'
    expect(mergeRule(rule, originalLoaders, allowedLoaders, happypackLoaderId))
      .toEqual({
        test: /\.jsx?$/,
        use: ['happypack/loader?id=jsx-123'],
      })
  })

  test('multiple loaders', () => {
    const rule = {
      test: /\.jsx?$/,
      loaders: ['babel-loader', 'css-loader'],
    }
    const originalLoaders = ['babel-loader', 'css-loader']
    const allowedLoaders = ['babel-loader']
    const happypackLoaderId = 'jsx-123'
    expect(mergeRule(rule, originalLoaders, allowedLoaders, happypackLoaderId))
      .toEqual({
        test: /\.jsx?$/,
        use: ['happypack/loader?id=jsx-123', 'css-loader'],
      })
  })

  test('multiple allowed loaders', () => {
    const rule = {
      test: /\.jsx?$/,
      loaders: ['babel-loader', 'css-loader'],
    }
    const originalLoaders = ['babel-loader', 'css-loader']
    const allowedLoaders = ['babel-loader', 'css-loader']
    const happypackLoaderId = 'jsx-123'
    expect(mergeRule(rule, originalLoaders, allowedLoaders, happypackLoaderId))
      .toEqual({
        test: /\.jsx?$/,
        use: ['happypack/loader?id=jsx-123'],
      })
  })

  test('with extract text loader', () => {
    const rule = {
      test: /\.css$/,
      loader: { loader: 'css-modules' },
    }
    const originalLoaders = [{ loader: 'css-loader' }]
    const allowedLoaders = ['css-loader']
    const happypackLoaderId = 'css-123'
    expect(mergeRule(rule, originalLoaders, allowedLoaders, happypackLoaderId))
      .toEqual({
        test: /\.css$/,
        use: [{
          loader: 'happypack/loader?id=css-123',
        }],
      })
  })
})
