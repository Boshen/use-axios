import { useState, useEffect } from 'react'
import axios, { AxiosRequestConfig, AxiosError } from 'axios'

interface UseAxiosState<T> {
  data: T | undefined
  loading: boolean
  error: AxiosError<T> | undefined
}

export interface UseAxiosOptions {
  skipRequest?: () => boolean
}

export type UseAxiosConfig = AxiosRequestConfig & UseAxiosOptions

const toState = (loading: boolean, data?: any, error?: AxiosError) => ({
  data,
  loading,
  error,
})

const useAxios = <T>(config: UseAxiosConfig, dependencies: any[]) => {
  const useStateReturn = useState<UseAxiosState<T>>(toState(true))
  const state = useStateReturn[0]
  const setState = useStateReturn[1]

  useEffect(() => {
    if (config.skipRequest && config.skipRequest()) {
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

export default useAxios
