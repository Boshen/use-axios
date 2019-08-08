import { useState, useEffect } from 'react'
import axios, { AxiosRequestConfig } from 'axios'

const toState = (loading: boolean, data?: any, error?: Error) => ({
  data,
  loading,
  error,
})

const useAxios = (config: AxiosRequestConfig, dependencies: any[]) => {
  const [state, setState] = useState(toState(true))

  useEffect(() => {
    setState(toState(true))

    const source = axios.CancelToken.source()
    axios
      .request({ ...config, cancelToken: source.token })
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
