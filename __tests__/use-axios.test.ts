import { renderHook, act, RenderHookResult } from '@testing-library/react-hooks'
import axiosMock from 'jest-mock-axios'
import { AxiosRequestConfig } from 'axios'
import * as sinon from 'sinon'

import useAxios, { UseAxiosConfig } from '../src'

test('it should default export a function', () => {
  expect(useAxios).toBeInstanceOf(Function)
})

describe('useAxios', () => {
  const requestConfig: AxiosRequestConfig = {
    url: '/api',
    method: 'get',
  }

  afterEach(() => {
    axiosMock.reset()
  })

  describe('without dependencies', () => {
    let hook: RenderHookResult<any, any>

    beforeEach(() => {
      hook = renderHook((props) => useAxios(props, []), {
        initialProps: requestConfig,
      })
    })

    test('it should return initial state', () => {
      expect(hook.result.current).toEqual({
        data: undefined,
        loading: true,
        error: undefined,
      })
    })

    test('it should do a request', async () => {
      expect(axiosMock.request).toHaveBeenCalled()
      const { config } = axiosMock.lastReqGet()
      expect(config.url).toEqual(requestConfig.url)
      expect(config.method).toEqual(requestConfig.method)
    })

    test('it should do a successful request', async () => {
      const res = { data: true }
      // @ts-ignore error TS2345: Argument of type '() => Promise<void>' is not assignable to parameter of type '() => void | undefined'.
      await act(async () => {
        axiosMock.mockResponse(res)
        await hook.waitForNextUpdate()
      })

      expect(hook.result.current).toEqual({
        data: res.data,
        loading: false,
        error: undefined,
      })
    })

    test('it should do a failure request', async () => {
      const err = new Error()
      // @ts-ignore
      await act(async () => {
        axiosMock.mockError(err)
        await hook.waitForNextUpdate()
      })

      expect(hook.result.current).toEqual({
        data: undefined,
        loading: false,
        error: err,
      })
    })
  })

  describe('cancelation', () => {
    test('it should cancel request ', async () => {
      const hook = renderHook((props) => useAxios(props, []), {
        initialProps: requestConfig,
      })

      axiosMock.mockError(new axiosMock.Cancel())

      expect(hook.result.current).toEqual({
        data: undefined,
        loading: true,
        error: undefined,
      })
    })

    test('it should cancel request if unmount', async () => {
      const token = new axiosMock.CancelToken(() => {})
      const cancel = sinon.spy()
      sinon.stub(axiosMock.CancelToken, 'source').returns({
        token,
        cancel,
      })

      const hook = renderHook((props) => useAxios(props, []), {
        initialProps: requestConfig,
      })

      expect(axiosMock.lastReqGet().config.cancelToken).toBe(token)

      hook.unmount()
      expect(cancel.called).toBe(true)
      // @ts-ignore
      axiosMock.CancelToken.source.restore()
    })
  })

  describe('with dependencies', () => {
    test('it should track dependencies', async () => {
      const dep1 = 'foo'
      const dep2 = 'bar'
      const hook = renderHook(({ config, deps }) => useAxios(config, deps), {
        initialProps: {
          config: {
            ...requestConfig,
            params: {
              test: dep1,
            },
          },
          deps: [dep1],
        },
      })

      expect(axiosMock.lastReqGet().config.params).toEqual({
        test: dep1,
      })

      // @ts-ignore
      await act(async () => {
        axiosMock.mockResponse({ data: dep1 })
        await hook.waitForNextUpdate()
      })

      hook.rerender({
        config: {
          ...requestConfig,
          params: {
            test: dep2,
          },
        },
        deps: [dep2],
      })

      expect(hook.result.current).toEqual({
        data: undefined,
        loading: true,
        error: undefined,
      })
      expect(axiosMock.lastReqGet().config.params).toEqual({
        test: dep2,
      })
    })
  })

  describe('with skipRequest', () => {
    test('it should skip initial request', async () => {
      renderHook((config: UseAxiosConfig) => useAxios(config, []), {
        initialProps: {
          ...requestConfig,
          skipRequest: () => true,
        },
      })
      expect(axiosMock.request).not.toHaveBeenCalled()
    })
  })
})
