import { useState, useEffect } from 'react'
import axios, { AxiosRequestConfig, AxiosError } from 'axios'

export interface UseAxiosOptions {
  skipRequest?: () => boolean
}

export type UseAxiosConfig = AxiosRequestConfig & UseAxiosOptions

interface UseAxiosState<T> {
  data: T | undefined
  loading: boolean
  error: AxiosError<T> | undefined
}

const toState = (loading: boolean, data?: any, error?: AxiosError) => ({
  data,
  loading,
  error,
})

const useAxios = <T>(config: UseAxiosConfig, dependencies: any[]) => {
  const skipRequest = config.skipRequest || (() => false)
  const useStateReturn = useState<UseAxiosState<T>>(toState(!skipRequest()))
  const state = useStateReturn[0]
  const setState = useStateReturn[1]
  const prevDepsReturn = useState(dependencies)
  const prevDeps = prevDepsReturn[0]
  const setPrevDeps = prevDepsReturn[1]

  if (!areHookInputsEqual(dependencies, prevDeps)) {
    setState(toState(!skipRequest()))
    setPrevDeps(dependencies)
  }

  useEffect(() => {
    if (skipRequest()) {
      return
    }

    setState(toState(true))

    const source = axios.CancelToken.source()
    axios
      .request(Object.assign({}, config, { cancelToken: source.token }))
      .then((res) => {
        setState(toState(false, res.data))
      })
      .catch((err) => {
        if (axios.isCancel(err)) {
          return
        }
        setState(toState(false, undefined, err))
      })
    return () => {
      source.cancel()
    }
  }, dependencies)

  return state
}

function areHookInputsEqual(nextDeps: any[], prevDeps: any[]) {
  for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    if (Object.is(nextDeps[i], prevDeps[i])) {
      continue
    }
    return false
  }
  return true
}

export default useAxios
