import { renderHook, act, RenderHookResult } from '@testing-library/react-hooks'
import axiosMock from 'jest-mock-axios'
import { AxiosRequestConfig } from 'axios'
import * as sinon from 'sinon'

import useAxiosDefault, {
  useAxios,
  UseAxiosConfig,
  UseAxiosState,
} from '../src'

test('it should default export a function', () => {
  expect(useAxios).toBeInstanceOf(Function)
  expect(useAxiosDefault).toBeInstanceOf(Function)
  expect(useAxiosDefault).toBe(useAxios)
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
    let hook: RenderHookResult<UseAxiosConfig, UseAxiosState<{}>>

    beforeEach(() => {
      hook = renderHook((props) => useAxios(props, []), {
        initialProps: requestConfig,
      })
    })

    test('it should return initial state', () => {
      expect(hook.result.current).toMatchObject({
        type: 'loading',
        data: true,
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
      await act(async () => {
        axiosMock.mockResponse(res)
        await hook.waitForNextUpdate()
      })

      expect(hook.result.current).toMatchObject({
        type: 'success',
        data: res.data,
      })
    })

    test('it should do a failure request', async () => {
      const err = new Error()
      await act(async () => {
        axiosMock.mockError(err)
        await hook.waitForNextUpdate()
      })

      expect(hook.result.current).toMatchObject({
        type: 'error',
        data: err,
      })
    })
  })

  describe('cancelation', () => {
    test('it should cancel request ', async () => {
      const hook = renderHook((props) => useAxios(props, []), {
        initialProps: requestConfig,
      })

      axiosMock.mockError(new axiosMock.Cancel())

      expect(hook.result.current).toMatchObject({
        type: 'loading',
        data: true,
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
      ;(axiosMock.CancelToken.source as sinon.SinonSpy).restore()
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

      expect(hook.result.current).toMatchObject({
        type: 'loading',
        data: true,
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

    test('it should skip subsequent requests', async () => {
      const dep1 = 'foo'
      const dep2 = 'bar'
      const config = {
        ...requestConfig,
        skipRequest: () => true,
      }
      const hook = renderHook(({ config, deps }) => useAxios(config, deps), {
        initialProps: {
          config,
          deps: [dep1],
        },
      })
      expect(axiosMock.request).not.toHaveBeenCalled()

      hook.rerender({
        config,
        deps: [dep2],
      })
      expect(axiosMock.request).not.toHaveBeenCalled()
    })
  })

  describe('rerun', () => {
    test('it should rerun the request', async () => {
      const hook = renderHook(
        (config: UseAxiosConfig) => useAxios(config, []),
        {
          initialProps: {
            ...requestConfig,
            skipRequest: () => true,
          },
        }
      )
      expect(axiosMock.request).not.toHaveBeenCalled()
      act(() => hook.result.current.rerun())
      await act(async () => {
        axiosMock.mockResponse({ data: {} })
        await hook.waitForNextUpdate()
      })
      expect(axiosMock.request).toHaveBeenCalled()
    })
  })

  describe('type check', () => {
    test('x', () => {
      const hook = renderHook(() => useAxios<number>({}, []))
      const res = hook.result.current
      switch (res.type) {
        case 'success':
          expect(res.data)
          break
        case 'loading':
          expect(res.data)
          break
        case 'error':
          expect(res.data)
          break
      }
    })
  })
})
