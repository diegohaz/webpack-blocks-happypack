// @flow
/** */
export type Loader = string

/** */
export type Rule = {
  test: RegExp,
  loader?: Loader | Loader[],
  loaders?: Loader | Loader[],
  use?: Loader | Loader[],
}

/** */
export type Block = {
  plugins?: any[],
  module: {
    loaders?: Rule[],
    rules?: Rule[],
  },
}

/** */
export type BlockOptions = {
  loaders?: string[],
  refresh?: boolean,
  cache?: any,
  cacheContext?: {},
}

/** */
export type WebpackBlock = () => Block
