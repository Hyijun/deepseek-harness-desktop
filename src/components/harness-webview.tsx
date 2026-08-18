/* eslint-disable react/dom-no-unsafe-iframe-sandbox */
import { CircleExclamation } from '@gravity-ui/icons'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from 'valtio-define'
import { useDesktopBridge } from '@/hooks/use-desktop-bridge'
import { useIframeShim } from '@/hooks/use-iframe-shim'
import { harness } from '../store/modules/harness'
import Loadable from './loadable'
import PreinstallSetup from './preinstall-setup'
import Setup from './setup'
import WindowTitlebar from './window-titlebar'

/**
 * 主区域视图：安装/错误态渲染 Setup，
 * 就绪态渲染 iframe（挂载后加载职责交给 dsh 应用内官方 boot 页，避免两套 loading 叠加）。
 * 状态与方法全部来自 harness store，不再接收 props。
 */
export default function HarnessWebview() {
  const { t } = useTranslation()
  const {
    status,
    serviceHealthy,
    iframeError,
    iframeKey,
    iframeSrc,
    serviceUrl,
  } = useStore(harness)

  const iframeRef = useRef<HTMLIFrameElement>(null)

  useIframeShim(iframeRef)
  const dragBridge = useDesktopBridge(iframeRef, serviceUrl, iframeKey)

  if (status === 'error') {
    return (
      <main className="relative flex-1 bg-canvas">
        <WindowTitlebar />
        <Setup />
      </main>
    )
  }

  // 预装插件引导：独立于安装/加载界面，渲染推荐插件列表与安装控制台
  if (status === 'preinstall') {
    return (
      <main className="relative w-full bg-canvas">
        <WindowTitlebar />
        <PreinstallSetup />
      </main>
    )
  }

  if (status !== 'ready') {
    return (
      <main className="relative w-full bg-canvas">
        <WindowTitlebar />
        <Setup />
      </main>
    )
  }

  return (
    <main className="relative flex-1 bg-canvas">
      {!dragBridge.ready && <WindowTitlebar />}
      {serviceHealthy
        ? (
            <iframe
              key={iframeKey}
              ref={iframeRef}
              className="block h-full w-full border-none bg-load-bg"
              src={iframeSrc}
              allow="clipboard-read; clipboard-write; camera; microphone; geolocation; display-capture; autoplay; encrypted-media; fullscreen; notifications *"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-downloads allow-storage-access-by-user-activation"
              onLoad={() => {
                harness.markIframeLoaded()
                dragBridge.notifyLoaded()
              }}
              onError={() => {
                harness.markIframeError()
                dragBridge.cancelWatchdog()
              }}
              title={t('app.open_editor')}
            />
          )
        : (
            <div className="absolute inset-0 z-[1]">
              <Loadable subtitle={t('status.loading')} />
            </div>
          )}
      {serviceHealthy && iframeError && (
        <Loadable
          icon={CircleExclamation}
          title={t('ui.iframe_error')}
          errorMsg={t('ui.ensure_running', { url: serviceUrl })}
          onRetry={harness.refreshIframe}
        />
      )}
      {serviceHealthy && dragBridge.failed && (
        <div
          className="fixed bottom-4 left-4 z-50 flex max-w-[420px] items-center gap-3 rounded-lg border border-red-500/40 bg-panel px-4 py-3 shadow-lg"
          role="alert"
        >
          <p className="min-w-0 flex-1 text-[13px] text-ink">{t('messages.drag_bridge_failed')}</p>
        </div>
      )}
    </main>
  )
}
