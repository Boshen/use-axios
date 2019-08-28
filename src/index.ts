import { useState, useEffect, DependencyList, Dispatch } from 'react'
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
export type UseAxiosResponse<T> = UseAxiosState<T> & { rerun: Dispatch<void> }

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
): UseAxiosResponse<T> => {
  const { skipRequest = () => false, ...axiosConfig } = config

  const [rerun, setRerun] = useState(false)

  const [state, setState] = useState<UseAxiosState<T>>(
    skipRequest() ? success(undefined) : loading()
  )

  const [prevDeps, setPrevDeps] = useState(dependencies)

  if (!areHookInputsEqual(dependencies, prevDeps)) {
    setState(skipRequest() ? success(undefined) : loading())
    setPrevDeps(dependencies)
  }

  useEffect(() => {
    if (!rerun && skipRequest()) {
      return
    }

    setState(loading())

    const source = axios.CancelToken.source()
    axios
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

    setRerun(false)
    return () => {
      source.cancel()
    }
  }, dependencies.concat(rerun))

  return {
    ...state,
    rerun: () => setRerun(true),
  }
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
