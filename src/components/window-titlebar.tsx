import type { PointerEvent as ReactPointerEvent } from 'react'
import { Copy, Minus, Square, Xmark } from '@gravity-ui/icons'
import { Button } from '@heroui/react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Harness 还未就绪时提供窗口拖动和控制能力。
 * 正常态由注入到 Harness Header 的插件接管同一组控制。
 */
export default function WindowTitlebar() {
  const { t } = useTranslation()
  const appWindow = getCurrentWindow()
  const cleanupRef = useRef<(() => void) | null>(null)
  const [maximized, setMaximized] = useState(false)

  function cleanupDrag() {
    cleanupRef.current?.()
    cleanupRef.current = null
  }

  useEffect(() => () => cleanupDrag(), [])

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || event.target instanceof Element && event.target.closest('button')) {
      return
    }

    cleanupDrag()
    const startX = event.clientX
    const startY = event.clientY
    const pointerId = event.pointerId
    function cleanup() {
      window.removeEventListener('pointermove', handlePointerMove, true)
      window.removeEventListener('pointerup', cleanup, true)
      window.removeEventListener('pointercancel', cleanup, true)
      if (cleanupRef.current === cleanup) {
        cleanupRef.current = null
      }
    }
    function handlePointerMove(moveEvent: PointerEvent) {
      if (moveEvent.pointerId !== pointerId) {
        return
      }
      if ((moveEvent.buttons & 1) === 0) {
        cleanup()
        return
      }
      if (Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) < 4) {
        return
      }
      cleanup()
      void appWindow.startDragging().catch((error: unknown) => {
        console.error('[WindowTitlebar] failed to start dragging:', error)
      })
    }

    window.addEventListener('pointermove', handlePointerMove, true)
    window.addEventListener('pointerup', cleanup, true)
    window.addEventListener('pointercancel', cleanup, true)
    cleanupRef.current = cleanup
  }

  function handleDoubleClick(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.target instanceof Element && event.target.closest('button')) {
      return
    }
    void toggleMaximize()
  }

  async function toggleMaximize() {
    try {
      const nextMaximized = !(await appWindow.isMaximized())
      if (nextMaximized) {
        await appWindow.maximize()
      }
      else {
        await appWindow.unmaximize()
      }
      setMaximized(nextMaximized)
    }
    catch (error) {
      console.error('[WindowTitlebar] failed to toggle maximize:', error)
    }
  }

  function minimizeWindow() {
    void appWindow.minimize().catch((error: unknown) => {
      console.error('[WindowTitlebar] failed to minimize:', error)
    })
  }

  function hideWindow() {
    void appWindow.hide().catch((error: unknown) => {
      console.error('[WindowTitlebar] failed to hide:', error)
    })
  }

  return (
    <div
      className="absolute inset-x-0 top-0 z-30 flex h-10 items-center border-b border-line/60 bg-panel/90 pl-3 backdrop-blur-md"
      onDoubleClick={handleDoubleClick}
      onPointerDown={handlePointerDown}
    >
      <span className="select-none text-xs font-medium text-muted">{t('app.title')}</span>
      <div className="ml-auto flex h-full items-center gap-1 px-1">
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          className="size-8 min-w-8 rounded-md"
          aria-label={t('ui.minimize')}
          onPress={minimizeWindow}
        >
          <Minus className="size-3.5" />
        </Button>
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          className="size-8 min-w-8 rounded-md"
          aria-label={maximized ? t('ui.restore') : t('ui.maximize')}
          onPress={toggleMaximize}
        >
          {maximized ? <Copy className="size-3" /> : <Square className="size-3" />}
        </Button>
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          className="size-8 min-w-8 rounded-md hover:bg-danger hover:text-white"
          aria-label={t('ui.close')}
          onPress={hideWindow}
        >
          <Xmark className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}
