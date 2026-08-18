import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useEvent, useMountedState } from 'react-use'

/**
 * 桌面桥：接收内嵌 dsh 页面（iframe）通过 postMessage 发来的原生操作请求，
 * 转发给 Tauri 执行（窗口拖拽/最小化/最大化/隐藏、系统剪贴板、系统通知）。
 *
 * 消息协议与 dsh-plugins/desktop-window-drag-bridge/lib/client.js 对应，
 * 所有消息类型都以 `deepseek-harness-desktop:` 为前缀。
 */

const BRIDGE_PREFIX = 'deepseek-harness-desktop:'
const DRAG_MESSAGE = `${BRIDGE_PREFIX}start-window-drag`
const MINIMIZE_MESSAGE = `${BRIDGE_PREFIX}minimize-window`
const TOGGLE_MAXIMIZE_MESSAGE = `${BRIDGE_PREFIX}toggle-window-maximize`
const HIDE_MESSAGE = `${BRIDGE_PREFIX}hide-window`
const NOTIFICATION_MESSAGE = `${BRIDGE_PREFIX}show-native-notification`
const CLIPBOARD_WRITE_MESSAGE = `${BRIDGE_PREFIX}write-native-clipboard`
const CLIPBOARD_WRITE_RESULT_MESSAGE = `${BRIDGE_PREFIX}native-clipboard-write-result`
const TOGGLE_SIDEBAR_MESSAGE = `${BRIDGE_PREFIX}toggle-sidebar`
const READY_MESSAGE = `${BRIDGE_PREFIX}drag-bridge-ready`

/** 插件应在 iframe 加载后这段时间内完成 slot 挂载并发送 ready 心跳 */
const READY_TIMEOUT_MS = 5000

interface BridgeMessage {
  type?: unknown
  title?: unknown
  body?: unknown
  requestId?: unknown
  text?: unknown
  error?: unknown
}

/**
 * 桥接 iframe 与桌面原生能力。
 *
 * @param iframeRef 承载 dsh 页面的 iframe 引用（要求与 event.source 一致）
 * @param serviceUrl dsh 服务地址（用于校验消息发起方 origin）
 * @param iframeKey 当前 iframe 实例标识；变更时重置 watchdog 状态
 */
export function useDesktopBridge(
  iframeRef: RefObject<HTMLIFrameElement | null>,
  serviceUrl: string | null,
  iframeKey: string | number,
) {
  const isMounted = useMountedState()
  const [failed, setFailed] = useState(false)
  const readyRef = useRef(false)
  const timeoutRef = useRef<number | null>(null)

  const appWindow = getCurrentWindow()
  // 期望的消息来源：dsh 服务 origin（iframe 只加载该源页面）
  const dshOrigin = useMemo(
    () => (serviceUrl ? new URL(serviceUrl).origin : null),
    [serviceUrl],
  )

  const clearTimeoutRef = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  /** iframe 加载完成：启动 watchdog，等待插件 ready 心跳 */
  const notifyLoaded = useCallback(() => {
    setFailed(false)
    clearTimeoutRef()
    if (readyRef.current) return
    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = null
      if (!readyRef.current) {
        setFailed(true)
        void invoke('report_window_drag_injection_failure', {
          detail: 'plugin did not register its Header slots within 5 seconds of iframe load',
        }).catch((error: unknown) => {
          console.error('[desktop-window-drag] failed to report injection failure:', error)
        })
      }
    }, READY_TIMEOUT_MS)
  }, [clearTimeoutRef])

  /** iframe 加载失败：取消 watchdog，避免在错误页上误报注入失败 */
  const cancelWatchdog = useCallback(() => {
    clearTimeoutRef()
  }, [clearTimeoutRef])

  /** 消息处理：校验来源后按类型分发 */
  function handleMessage(event: MessageEvent<BridgeMessage>) {
    const data = event.data
    if (!data || typeof data !== 'object' || typeof data.type !== 'string') {
      return
    }
    if (!data.type.startsWith(BRIDGE_PREFIX)) {
      return
    }
    // 只接受 dsh 直接 iframe 发来的消息，且 origin 必须匹配服务地址
    if (event.source !== iframeRef.current?.contentWindow) {
      return
    }
    if (dshOrigin !== null && event.origin !== dshOrigin) {
      return
    }

    switch (data.type) {
      case READY_MESSAGE:
        readyRef.current = true
        clearTimeoutRef()
        setFailed(false)
        return
      case DRAG_MESSAGE:
        void appWindow.startDragging().catch((error: unknown) => {
          console.error('[desktop-window-drag] failed to start window dragging:', error)
        })
        return
      case MINIMIZE_MESSAGE:
        void appWindow.minimize().catch((error: unknown) => {
          console.error('[desktop-window-drag] failed to minimize window:', error)
        })
        return
      case HIDE_MESSAGE:
        void appWindow.hide().catch((error: unknown) => {
          console.error('[desktop-window-drag] failed to hide window:', error)
        })
        return
      case TOGGLE_MAXIMIZE_MESSAGE:
        void appWindow
          .isMaximized()
          .then((maximized) => (maximized ? appWindow.unmaximize() : appWindow.maximize()))
          .catch((error: unknown) => {
            console.error('[desktop-window-drag] failed to toggle window maximize:', error)
          })
        return
      case NOTIFICATION_MESSAGE:
        void invoke('show_native_notification', {
          payload: {
            title: typeof data.title === 'string' ? data.title : 'DSH',
            body: typeof data.body === 'string' ? data.body : '',
            tag: null,
            sessionId: null,
            requireInteraction: false,
          },
        }).catch((error: unknown) => {
          console.error('[desktop-notification] failed to show native notification:', error)
        })
        return
      case CLIPBOARD_WRITE_MESSAGE:
        if (typeof data.requestId !== 'string' || typeof data.text !== 'string') {
          return
        }
        void invoke('write_system_clipboard', { text: data.text }).then(
          () => {
            iframeRef.current?.contentWindow?.postMessage(
              { type: CLIPBOARD_WRITE_RESULT_MESSAGE, requestId: data.requestId },
              '*',
            )
          },
          (error: unknown) => {
            iframeRef.current?.contentWindow?.postMessage(
              {
                type: CLIPBOARD_WRITE_RESULT_MESSAGE,
                requestId: data.requestId,
                error: String(error),
              },
              '*',
            )
          },
        )
        return
      case TOGGLE_SIDEBAR_MESSAGE:
        void invoke('toggle_sidebar').catch((error: unknown) => {
          console.error('[desktop-window-drag] failed to toggle sidebar:', error)
        })
        return
      default:
        return
    }
  }

  useEvent('message', handleMessage)

  // iframe 实例变化（刷新/重挂载）时重置 ready 与 watchdog
  useEffect(() => {
    readyRef.current = false
    setFailed(false)
    clearTimeoutRef()
    return clearTimeoutRef
  }, [iframeKey, serviceUrl, clearTimeoutRef])

  // 卸载时清理定时器（isMounted 仅用于 eslint 依赖约束）
  useEffect(
    () => () => {
      clearTimeoutRef()
      void isMounted()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  return { failed, notifyLoaded, cancelWatchdog }
}