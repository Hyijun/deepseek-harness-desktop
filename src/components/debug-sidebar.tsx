import type { ReactNode } from 'react'
import { ArrowRotateRight, ArrowsRotateRight, ArrowUpRightFromSquare, Copy, Folder, Power } from '@gravity-ui/icons'
import {
  Button,
  Chip,
  Drawer,
  Input,
  ListBox,
  Select,
  Spinner,
  Switch,
  TextArea,
} from '@heroui/react'
import { invoke } from '@tauri-apps/api/core'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from 'valtio-define'
import { harness } from '../store/modules/harness'
import { setting } from '../store/modules/setting'
import { toast } from '../utils/toast'

export interface RuntimeInfo {
  app_version: string
  dsh_version: string | null
  node_version: string
  service_url: string
  data_dir: string
  log_path: string
  platform: string
  arch: string
}

export interface AppConfig {
  port: number
  auto_start: boolean
  cli_link_enabled: boolean
}

export interface CliLinkStatus {
  enabled: boolean
  shim_exists: boolean
  path_registered: boolean
  user_dsh_preserved: boolean
  bin_dir: string
  shim_path: string
}

/** 分组卡片容器 */
function SectionCard({ children, className = '' }: { children: ReactNode, className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {children}
    </div>
  )
}

/** 分组小节标题 */
function SectionTitle({ children, action }: { children: ReactNode, action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted/80 border-b border-line/40 pb-2">
      <span>{children}</span>
      {action && <div>{action}</div>}
    </div>
  )
}

/** 信息列表的一行 */
function InfoRow({ term, children }: { term: string, children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs py-0.5">
      <dt className="shrink-0 text-muted font-medium">{term}</dt>
      <dd className="min-w-0 break-all text-ink text-right font-mono">{children}</dd>
    </div>
  )
}

export default function DebugSidebar() {
  const { t, i18n } = useTranslation()
  const { sidebarOpen } = useStore(setting)
  const { serviceRunning, busyAction, preinstall } = useStore(harness)
  const [info, setInfo] = useState<RuntimeInfo | null>(null)
  const [cliLinkEnabled, setCliLinkEnabled] = useState(true)
  const [port, setPort] = useState(3080)
  const [cliStatus, setCliStatus] = useState<CliLinkStatus | null>(null)
  const [logs, setLogs] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  async function refreshInfo() {
    if (busy)
      return
    setBusy('refreshInfo')
    try {
      setInfo(await invoke<RuntimeInfo>('get_runtime_info'))
    }
    catch (err) {
      console.error('[DebugSidebar] failed to load runtime info:', err)
    }
    finally {
      setBusy(null)
    }
  }

  async function refreshConfig() {
    try {
      const nextConfig = await invoke<AppConfig>('get_app_config')
      setPort(nextConfig.port)
      setCliLinkEnabled(nextConfig.cli_link_enabled)
    }
    catch (err) {
      console.error('[DebugSidebar] failed to load config:', err)
    }
  }

  async function refreshCliStatus() {
    try {
      setCliStatus(await invoke<CliLinkStatus>('get_cli_link_status'))
    }
    catch (err) {
      console.error('[DebugSidebar] failed to load cli link status:', err)
    }
  }

  async function toggleCliLink(enabled: boolean) {
    if (busy)
      return
    const prev = cliLinkEnabled
    setBusy('cliLink')
    setCliLinkEnabled(enabled)
    try {
      const nextConfig = await invoke<AppConfig>('update_app_config', { cliLinkEnabled: enabled })
      setCliLinkEnabled(nextConfig.cli_link_enabled)
      toast(t(nextConfig.cli_link_enabled ? 'messages.cli_link_enabled' : 'messages.cli_link_disabled'), {})
      await refreshCliStatus()
    }
    catch (err) {
      console.error('[DebugSidebar] failed to update cli link enabled:', err)
      setCliLinkEnabled(prev)
      toast(t('messages.save_failed'), { variant: 'danger' })
    }
    finally {
      setBusy(null)
    }
  }

  async function savePort() {
    if (busy)
      return
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      toast(t('messages.save_failed'), { variant: 'danger' })
      return
    }
    setBusy('savePort')
    try {
      const nextConfig = await invoke<AppConfig>('update_app_config', { port })
      setPort(nextConfig.port)
      toast(t('messages.port_changed'), {
        variant: 'accent',
        description: t('messages.port_restart_hint'),
        timeout: 10_000,
        actionProps: {
          children: t('app.restart'),
          onPress: () => { void harness.restart() },
        },
      })
    }
    catch (err) {
      console.error('[DebugSidebar] failed to save port:', err)
      toast(t('messages.save_failed'), { variant: 'danger' })
    }
    finally {
      setBusy(null)
    }
  }

  async function refreshLogs() {
    if (busy)
      return
    setBusy('refreshLogs')
    try {
      setLogs(await invoke<string>('read_service_logs', { maxBytes: 64 * 1024 }))
    }
    catch (err) {
      console.error('[DebugSidebar] failed to read logs:', err)
    }
    finally {
      setBusy(null)
    }
  }

  useEffect(() => {
    void refreshInfo()
    void refreshConfig()
    void refreshCliStatus()
    void refreshLogs()
    // eslint-disable-next-line react/exhaustive-deps
  }, [])

  async function copyUrl() {
    if (busy)
      return
    setBusy('copy')
    try {
      await invoke('copy_service_url')
      toast(t('messages.copy_success'), {})
    }
    catch {
      toast(t('messages.copy_failed'), { variant: 'danger' })
    }
    finally {
      setBusy(null)
    }
  }

  async function clearLogs() {
    if (busy)
      return
    setBusy('clearLogs')
    try {
      await invoke('clear_service_logs')
      setLogs('')
      toast(t('messages.logs_cleared'), {})
    }
    catch (err) {
      console.error('[DebugSidebar] failed to clear logs:', err)
    }
    finally {
      setBusy(null)
    }
  }

  async function revealDataDir() {
    if (busy)
      return
    setBusy('revealDataDir')
    try {
      await invoke('reveal_data_dir')
    }
    catch (err) {
      console.error('[DebugSidebar] failed to reveal data dir:', err)
    }
    finally {
      setBusy(null)
    }
  }

  return (
    <Drawer.Root>
      <Drawer.Backdrop
        isOpen={sidebarOpen}
        onOpenChange={open => (open ? setting.toggleSidebar() : setting.closeSidebar())}
      >
        <Drawer.Content placement="right">
          <Drawer.Dialog>
            <Drawer.Body className="space-y-4 relative">

              {/* 核心服务与地址状态 */}
              <SectionCard>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                    {t('ui.connection_status')}
                  </span>
                  <Chip
                    size="sm"
                    variant="soft"
                    color={serviceRunning ? 'success' : 'danger'}
                    className="font-medium"
                  >
                    {serviceRunning ? t('ui.running') : t('ui.stopped')}
                  </Chip>
                </div>

                <div className="space-y-1.5">
                  <div className="flex gap-1.5">
                    <Input
                      readOnly
                      variant="secondary"
                      value={info?.service_url ?? '-'}
                      aria-label={t('ui.service_url')}
                      className="font-mono text-xs flex-1 rounded-md"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      isIconOnly
                      className="rounded-md"

                      onPress={copyUrl}
                      isDisabled={busy === 'copy'}
                      aria-label={t('buttons.copy')}
                    >
                      {busy === 'copy' ? <Spinner size="sm" color="current" /> : <Copy className="size-3.5" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-md"
                      isIconOnly
                      onPress={harness.openBrowser}
                      isDisabled={busyAction !== null}
                      aria-label={t('app.open_browser')}
                    >
                      {busyAction === 'openBrowser' ? <Spinner size="sm" color="current" /> : <ArrowUpRightFromSquare className="size-3.5" />}
                    </Button>
                  </div>
                </div>

                {/* 服务操作 */}
                <div className="pt-2 border-t border-line/40 flex items-center gap-2">
                  {serviceRunning
                    ? (
                        <>
                          <Button
                            size="sm"
                            variant="tertiary"
                            className="flex-1 rounded-md"
                            onPress={harness.restart}
                            isDisabled={busyAction !== null}
                          >
                            {busyAction === 'restart' ? <Spinner size="sm" color="current" /> : <ArrowRotateRight className="size-3.5" />}
                            {t('app.restart')}
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            className="flex-1 rounded-md"
                            onPress={harness.shutdown}
                            isDisabled={busyAction !== null}
                          >
                            {busyAction === 'shutdown' ? <Spinner size="sm" color="current" /> : <Power className="size-3.5" />}
                            {t('app.shutdown')}
                          </Button>
                        </>
                      )
                    : (
                        <Button
                          size="sm"
                          variant="primary"
                          className="flex-1 rounded-md"
                          onPress={harness.start}
                          isDisabled={busyAction !== null}
                        >
                          {busyAction === 'start' && <Spinner size="sm" color="current" />}
                          {t('app.retry')}
                        </Button>
                      )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-md"
                    isIconOnly
                    onPress={refreshInfo}
                    isDisabled={busy === 'refreshInfo'}
                    aria-label={t('app.refresh')}
                  >
                    {busy === 'refreshInfo' ? <Spinner size="sm" color="current" /> : <ArrowsRotateRight className="size-3.5" />}
                  </Button>
                </div>
              </SectionCard>

              {/* 应用信息 */}
              <SectionCard>
                <SectionTitle>{t('ui.app_info')}</SectionTitle>
                <dl className="space-y-1">
                  <InfoRow term={t('ui.current_version')}>{info?.app_version ?? '-'}</InfoRow>
                  <InfoRow term={t('ui.dsh_version')}>{info?.dsh_version ?? '-'}</InfoRow>
                  <InfoRow term={t('ui.node_version')}>{info?.node_version ? `v${info.node_version}` : '-'}</InfoRow>
                  <InfoRow term="Platform">
                    {info ? `${info.platform} / ${info.arch}` : '-'}
                  </InfoRow>
                  <div className="flex items-center justify-between gap-2 text-xs pt-1 border-t border-line/30">
                    <dt className="shrink-0 text-muted font-medium">{t('ui.data_dir')}</dt>
                    <dd className="min-w-0 flex items-center gap-1">
                      <span className="truncate max-w-[160px] font-mono text-[11px] text-muted/80" title={info?.data_dir ?? '-'}>
                        {info?.data_dir ?? '-'}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        isIconOnly
                        className="size-6 min-w-6 rounded-md"
                        aria-label={t('app.reveal_dir')}
                        onPress={revealDataDir}
                        isDisabled={busy === 'revealDataDir'}
                      >
                        {busy === 'revealDataDir' ? <Spinner size="sm" color="current" /> : <Folder className="size-3.5" />}
                      </Button>
                    </dd>
                  </div>
                </dl>
              </SectionCard>

              {/* 设置 */}
              <SectionCard>
                <SectionTitle>{t('ui.settings')}</SectionTitle>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-ink">{t('ui.cli_link_enabled')}</span>
                    <Switch
                      isSelected={cliLinkEnabled}
                      isDisabled={busy === 'cliLink'}
                      onChange={toggleCliLink}
                    >
                      <Switch.Content>
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                      </Switch.Content>
                    </Switch>

                  </div>

                  {cliStatus && (
                    <div className="rounded-lg border border-line/50 bg-background/50 p-2 text-[11px] space-y-1 text-muted">
                      <code className="block truncate font-mono text-[10px] text-muted/70">{cliStatus.bin_dir}</code>
                      <p>{t('ui.cli_link_hint')}</p>
                      {cliStatus.user_dsh_preserved && (
                        <p className="font-medium text-ink">{t('ui.cli_link_user_dsh_preserved')}</p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-ink">{t('ui.port')}</span>
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        variant="secondary"
                        value={String(port)}
                        onChange={e => setPort(Number(e.target.value))}
                        className="w-24 rounded-md"
                        aria-label={t('ui.port')}
                      />
                      <Button
                        size="sm"
                        variant="primary"
                        className="rounded-md"
                        onPress={savePort}
                        isDisabled={busy === 'savePort'}
                      >
                        {busy === 'savePort' ? <Spinner size="sm" color="current" /> : t('buttons.save')}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-ink">{t('ui.language')}</span>
                    <Select
                      variant="secondary"
                      selectedKey={i18n.language}
                      onSelectionChange={key => i18n.changeLanguage(String(key))}
                      className="w-32 rounded-md"
                    >
                      <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover className="rounded-md">
                        <ListBox>
                          <ListBox.Item id="zh-CN" textValue="中文">中文</ListBox.Item>
                          <ListBox.Item id="en-US" textValue="English">English</ListBox.Item>
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>
                </div>
              </SectionCard>

              {/* 预装插件（重新打开预设引导） */}
              <SectionCard>
                <SectionTitle>{t('preinstall.settings_title')}</SectionTitle>
                <p className="text-xs leading-relaxed text-muted">{t('preinstall.settings_hint')}</p>
                <Button
                  size="sm"
                  variant="primary"
                  className="rounded-md"
                  onPress={harness.openPreinstall}
                  isDisabled={busyAction !== null || preinstall.installing}
                >
                  {t('preinstall.open_preset')}
                </Button>
              </SectionCard>

              {/* 日志 */}
              <SectionCard>
                <SectionTitle
                  action={(
                    <Button
                      size="sm"
                      variant="ghost"
                      isIconOnly
                      className="size-6 min-w-6"
                      aria-label={t('buttons.refresh_logs')}
                      onPress={refreshLogs}
                      isDisabled={busy === 'refreshLogs'}
                    >
                      {busy === 'refreshLogs' ? <Spinner size="sm" color="current" /> : <ArrowRotateRight className="size-3.5" />}
                    </Button>
                  )}
                >
                  {t('ui.logs')}
                </SectionTitle>

                <TextArea
                  readOnly
                  variant="secondary"
                  value={logs || t('ui.no_logs')}
                  aria-label={t('ui.logs')}
                  className="min-h-[140px] max-h-[180px] font-mono text-[11px] w-full leading-relaxed"
                />

                <Button
                  size="sm"
                  variant="tertiary"
                  fullWidth
                  className="rounded-md"
                  onPress={clearLogs}
                  isDisabled={busy === 'clearLogs'}
                >
                  {busy === 'clearLogs' && <Spinner size="sm" color="current" />}
                  {t('buttons.clear_logs')}
                </Button>
              </SectionCard>

            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer.Root>
  )
}
