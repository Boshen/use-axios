import { useState, useEffect, DependencyList } from 'react'
import axios, { AxiosRequestConfig, AxiosError } from 'axios'

export interface Idle {
  type: 'idle'
  data: null
}

export interface Success<T> {
  type: 'success'
  data: T
}

export interface Loading {
  type: 'loading'
  data: boolean
}

export interface Err<T> {
  type: 'error'
  data: AxiosError<T>
}

export interface UseAxiosControls {
  rerun: () => void
}
export type UseAxiosState<S, U> = Idle | Success<S> | Loading | Err<U>
export type UseAxiosResponse<S, U> = [UseAxiosState<S, U>, UseAxiosControls]

export interface UseAxiosOptions {
  skipRequest?: () => boolean
}
export type UseAxiosConfig = AxiosRequestConfig & UseAxiosOptions

const idle = (): Idle => ({ type: 'idle', data: null })
const success = <T>(data: T): Success<T> => ({
  type: 'success',
  data,
})
const loading = (): Loading => ({ type: 'loading', data: true })
const error = <T>(err: AxiosError<T>): Err<T> => ({ type: 'error', data: err })

export const useAxios = <S = any, U = any>(
  config: UseAxiosConfig,
  dependencies: DependencyList
): UseAxiosResponse<S, U> => {
  const { skipRequest = () => false, ...axiosConfig } = config

  const [rerun, setRerun] = useState(false)

  const [state, setState] = useState<UseAxiosState<S, U>>(
    skipRequest() ? idle() : loading()
  )

  const [prevDeps, setPrevDeps] = useState(dependencies)

  if (!areHookInputsEqual(dependencies, prevDeps)) {
    setState(skipRequest() ? idle() : loading())
    setPrevDeps(dependencies)
  }

  const request = () => {
    setState(loading())
    const source = axios.CancelToken.source()
    const promise = axios
      .request({ ...axiosConfig, cancelToken: source.token })
      .then((res) => {
        setState(success(res.data))
      })
      .catch((err) => {
        if (axios.isCancel(err)) {
          return
        }
        setState(error(err))
      })
    return { source, promise }
  }

  useEffect(() => {
    if (skipRequest()) return
    const { source } = request()
    return () => source.cancel()
  }, dependencies)

  useEffect(() => {
    if (!rerun) return
    const { source, promise } = request()
    promise.then(() => setRerun(false))
    return () => source.cancel()
  }, [rerun])

  const controls = {
    rerun: () => setRerun(true),
  }
  return [state, controls]
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
