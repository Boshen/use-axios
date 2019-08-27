import { useState, useEffect, DependencyList } from 'react'
import axios, { AxiosRequestConfig, AxiosError } from 'axios'

interface Success<T> {
  type: 'success'
  data: T | undefined
}

interface Loading {
  type: 'loading'
  data: boolean
}

interface Err<T> {
  type: 'error'
  data: AxiosError<T>
}

export type UseAxiosState<T> = Success<T> | Loading | Err<T>

export interface UseAxiosOptions {
  skipRequest?: () => boolean
}
export type UseAxiosConfig = AxiosRequestConfig & UseAxiosOptions

const success = <T>(data: T | undefined): Success<T> => ({
  type: 'success',
  data,
})
const loading = (): Loading => ({ type: 'loading', data: true })
const error = <T>(err: AxiosError<T>): Err<T> => ({ type: 'error', data: err })

export const useAxios = <T>(
  config: UseAxiosConfig,
  dependencies: DependencyList
): UseAxiosState<T> => {
  const skipRequest = config.skipRequest || (() => false)

  const useStateReturn = useState<UseAxiosState<T>>(
    skipRequest() ? success(undefined) : loading()
  )
  const state = useStateReturn[0]
  const setState = useStateReturn[1]

  const prevDepsReturn = useState(dependencies)
  const prevDeps = prevDepsReturn[0]
  const setPrevDeps = prevDepsReturn[1]

  if (!areHookInputsEqual(dependencies, prevDeps)) {
    setState(skipRequest() ? success(undefined) : loading())
    setPrevDeps(dependencies)
  }

  useEffect(() => {
    if (skipRequest()) {
      return
    }

    setState(loading())

    const source = axios.CancelToken.source()
    axios
      .request(Object.assign({}, config, { cancelToken: source.token }))
      .then((res) => {
        setState(success(res.data))
      })
      .catch((err) => {
        if (axios.isCancel(err)) {
          return
        }
        setState(error(err))
      })
    return () => {
      source.cancel()
    }
  }, dependencies)

  return state
}

function areHookInputsEqual(
  nextDeps: DependencyList,
  prevDeps: DependencyList
) {
  for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    if (Object.is(nextDeps[i], prevDeps[i])) {
      continue
    }
    return false
  }
  return true
}

export default useAxios
