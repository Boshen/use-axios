[![CircleCI](https://circleci.com/gh/Boshen/use-axios/tree/master.svg?style=svg)](https://circleci.com/gh/Boshen/use-axios/tree/master)
[![Coverage Status](https://coveralls.io/repos/github/Boshen/use-axios/badge.svg?branch=master)](https://coveralls.io/github/Boshen/use-axios?branch=master)
[![Greenkeeper badge](https://badges.greenkeeper.io/Boshen/use-axios.svg)](https://greenkeeper.io/)
[![Npm Version](https://img.shields.io/npm/v/react-use-axios)](https://img.shields.io/npm/v/react-use-axios)
[![Size](https://img.shields.io/bundlephobia/minzip/react-use-axios)](https://bundlephobia.com/result?p=react-use-axios)
[![License](https://img.shields.io/npm/l/react-use-axios)](https://img.shields.io/npm/l/react-use-axios)
[![Twitter](https://img.shields.io/twitter/follow/BoshenBoshen.svg?style=social)](https://twitter.com/BoshenBoshen)

[![Dependencies](https://img.shields.io/david/boshen/use-axios)](https://img.shields.io/david/boshen/use-axios)
[![Dev Dependencies](https://img.shields.io/david/dev/boshen/use-axios)](https://img.shields.io/david/dev/boshen/use-axios)

# useAxios

> React hook for [axios], written in typescript

## Features

* same api as `useEffect`
* request cancelling on component unmount
- typings!

## Install

### npm

```bash
npm install --save react-use-axios
```

### yarn

```bash
yarn add react-use-axios
```

Note: `react(>= v16.8.0)` and `axios(>= 0.19.0)` are listed as peer dependencies.

## Prior Works
* [use-hooks/react-hooks-axios](https://github.com/use-hooks/react-hooks-axios)
* [simoneb/axios-hooks](https://github.com/simoneb/axios-hooks)
* [ArnoSaine/use-axios](https://github.com/ArnoSaine/use-axios)

Why creating another one? Because:
* I want typings
* I want to make its behaviour and api the same as `useEffect`, so we don't need to look up the api when using this hook

## Usage
use this hook just like `useEffect`, the first argument is axios' config object,
and the second argument is useEffect's dependencies array.

```typescript
interface Props {
  foo: string
}

interface ResponseObject {
  bar: string
}

const Component: React.FunctionComponent<Props> = (props) => {
  const { foo } = props

  const [res] = useAxios<ResponseObject[]>(
    {
      url: '/api',
      method: 'get',
    },
    [foo]
  )

  if (res.type === 'loading') return 'loading'
  if (res.type === 'error') return 'error'
  if (res.data.length === 0) return 'empty'
  return objects
}
```

### Skipping request
Often you want to skip the request on some condition, you can simply pass `skipRequest` to useAxios
```typescript
useAxios({
  url: '/api',
  method: 'get',
  skipRequest: () => !foo
}, [foo])
```

### Callbacks
useEffect to the rescure:
```typescript
const [res] = useAxios({ url: '/api', method: 'get' }, [])
useEffect(() => {
  if (res.type === 'success') {
    console.info(res.data)
  }
  if (res.type === 'error') {
    console.error(res.data)
  }
}, [res])
```

### Rerun
`rerun` will retrigger the request even if you have skipped request, useful for callback triggered requests
```typescript
const [res, {rerun}] = useAxios({ url: '/api', method: 'get', skipRequest: () => true }, [])
const onClick = () => {
  rerun()
}
<button onClick={onClick} />
```

### Cancelling request on component unmount
useAxios uses the axios cancel token to cancel requests, so requests are automatically canceled when a component unmounts.

## Note on source code
What's with the `areHookInputsEqual`?

This dependencies comparison is copied from the React codebase.
It's needed because without it, when your dependencies change, you will get an extra render with the previous data. So to avoid this, we need to reset the state in the same event look / scheduler.

## License

MIT

[axios]: https://github.com/axios/axios
