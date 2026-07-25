'use client'

import { useSelector } from '@/app/store'
import { WindowChromeContext } from '@/app/components/window-frame'
import { MacTrafficLights } from '@/app/components/window-frame/mac-traffic-lights'
import author from '@/public/assets/images/author.webp'
import {
  IconAdjustments,
  IconPhoto,
  IconSearch,
  IconSettings,
} from '@tabler/icons-react'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import {
  type KeyboardEvent,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
import { AppearanceSettings, WallpaperGrid, wallpapers } from './wallpaper'

type SettingsSection = 'general' | 'appearance' | 'wallpapers'

const sections: Array<{
  id: SettingsSection
  label: string
  Icon: typeof IconSettings
  iconClassName: string
}> = [
  {
    id: 'general',
    label: 'General',
    Icon: IconSettings,
    iconClassName: 'bg-gradient-to-br from-[#8f8f94] to-[#55555a]',
  },
  {
    id: 'appearance',
    label: 'Appearance',
    Icon: IconAdjustments,
    iconClassName: 'bg-gradient-to-br from-[#5ac8fa] to-[#0a84ff]',
  },
  {
    id: 'wallpapers',
    label: 'Wallpaper',
    Icon: IconPhoto,
    iconClassName: 'bg-gradient-to-br from-[#30d158] to-[#00a7c7]',
  },
]

function SettingsGroup({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-1">
      <h3 className="px-3 text-[10.5px] font-semibold tracking-[0.04em] text-black/35 uppercase dark:text-white/32">
        {label}
      </h3>
      <div className="overflow-hidden rounded-lg border border-black/7 bg-white/75 dark:border-white/7 dark:bg-white/[0.055]">
        {children}
      </div>
    </section>
  )
}

function SettingsRow({
  label,
  value,
  description,
  children,
}: {
  label: string
  value?: string
  description?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex min-h-9 items-center justify-between gap-3 border-b border-black/7 px-3.5 py-2.5 last:border-b-0 dark:border-white/7">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] text-zinc-900 dark:text-white/92">
          {label}
        </p>
        {description && (
          <p className="mt-0.5 text-[11px] leading-[1.35] text-zinc-500 dark:text-white/52">
            {description}
          </p>
        )}
      </div>
      {children ?? (
        <span className="max-w-[45%] truncate text-right text-[12px] text-zinc-500 dark:text-white/52">
          {value}
        </span>
      )}
    </div>
  )
}

function SettingsOverview() {
  const wallpaper = useSelector((state) => state.settings.wallpaper)
  const { resolvedTheme, theme } = useTheme()
  const selectedWallpaper = wallpapers.find(
    (option) =>
      option.dark.src === wallpaper?.dark.src &&
      option.light.src === wallpaper?.light.src
  )
  const themeLabel =
    theme === 'system'
      ? `Automatic (${resolvedTheme ?? 'system'})`
      : theme === 'dark'
        ? 'Dark'
        : 'Light'

  return (
    <section
      aria-labelledby="settings-general-heading"
      className="mx-auto w-full max-w-[580px] px-5 pt-7 pb-10 sm:px-7"
    >
      <header className="mb-7 text-center">
        <div className="mx-auto mb-3.5 flex size-[72px] items-center justify-center rounded-[18px] bg-gradient-to-br from-[#8f8f94] to-[#4d4d52] text-white shadow-[0_4px_16px_rgba(0,0,0,0.18)]">
          <IconSettings aria-hidden className="size-11" stroke={1.5} />
        </div>
        <h2
          className="text-[28px] font-bold tracking-[-0.02em] text-zinc-900 dark:text-white/92"
          id="settings-general-heading"
        >
          General
        </h2>
        <p className="mx-auto mt-2 max-w-[420px] text-[13.5px] leading-5 text-zinc-500 dark:text-white/52">
          Manage the portfolio desktop, appearance, and active background.
        </p>
      </header>

      <div className="space-y-4">
        <SettingsGroup label="MehdiOS">
          <SettingsRow label="Profile" value="Mehdi Djahraoui" />
          <SettingsRow
            label="Portfolio"
            value="Ready"
            description="Projects, applications, and content remain unchanged."
          />
        </SettingsGroup>

        <SettingsGroup label="Personalization">
          <SettingsRow label="Appearance" value={themeLabel} />
          <SettingsRow
            label="Wallpaper"
            value={selectedWallpaper?.name ?? 'Custom wallpaper'}
          />
        </SettingsGroup>
      </div>
    </section>
  )
}

export function Settings() {
  const windowChrome = useContext(WindowChromeContext)
  const fallbackHeaderRef = useRef<HTMLDivElement>(null)
  const [activeSection, setActiveSection] = useState<SettingsSection>('general')
  const [searchQuery, setSearchQuery] = useState('')

  const visibleSections = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    if (!normalizedQuery) return sections
    return sections.filter((section) =>
      section.label.toLowerCase().includes(normalizedQuery)
    )
  }, [searchQuery])

  const focusSection = (index: number) => {
    const section = visibleSections[index]
    if (!section) return

    setActiveSection(section.id)
    requestAnimationFrame(() => {
      document.getElementById(`settings-section-${section.id}`)?.focus()
    })
  }

  const handleSectionKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    let nextIndex = index

    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      nextIndex = (index + 1) % visibleSections.length
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      nextIndex = (index - 1 + visibleSections.length) % visibleSections.length
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = visibleSections.length - 1
    } else {
      return
    }

    event.preventDefault()
    focusSection(nextIndex)
  }

  const dragHandleRef = windowChrome?.frameHeader ?? fallbackHeaderRef

  return (
    <div
      className="grid h-full min-h-0 grid-cols-[92px_minmax(0,1fr)] overflow-hidden bg-white/95 text-zinc-900 md:grid-cols-[220px_minmax(0,1fr)] dark:bg-[#141416] dark:text-white"
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, 'Helvetica Neue', sans-serif",
      }}
    >
      <aside className="flex min-h-0 flex-col overflow-hidden border-r border-black/7 bg-[rgba(238,238,243,0.72)] dark:border-white/7 dark:bg-[rgba(40,40,42,0.67)]">
        <div
          ref={dragHandleRef}
          className="flex h-[46px] shrink-0 items-center px-2 md:px-3.5"
          onDoubleClick={windowChrome?.onZoom}
        >
          <MacTrafficLights
            appName="Settings"
            isActive={windowChrome?.isFocused ?? true}
            isFullscreen={windowChrome?.isFullscreen}
            onClose={windowChrome?.onClose ?? (() => {})}
            onMinimize={windowChrome?.onMinimize ?? (() => {})}
            onZoom={windowChrome?.onZoom ?? (() => {})}
          />
        </div>

        <label className="relative mx-2.5 mb-2 hidden shrink-0 md:block">
          <IconSearch
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-2 size-[13px] -translate-y-1/2 text-black/35 dark:text-white/35"
            stroke={2.2}
          />
          <input
            aria-label="Search settings"
            className="h-[25px] w-full rounded-[5px] border border-black/10 bg-white/75 pr-2 pl-[26px] text-[12px] outline-hidden transition placeholder:text-black/35 focus:border-black/15 focus:bg-white/90 dark:border-white/8 dark:bg-[rgba(40,40,42,0.5)] dark:text-white/92 dark:placeholder:text-white/32 dark:focus:border-white/14 dark:focus:bg-white/10"
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search"
            type="search"
            value={searchQuery}
          />
        </label>

        <button
          aria-label="Open General settings for Mehdi Djahraoui"
          className="mx-1.5 mb-1 flex shrink-0 items-center justify-center gap-2.5 rounded-[7px] px-1.5 py-2 text-left transition hover:bg-black/5 md:justify-start md:px-2.5 dark:hover:bg-white/6"
          onClick={() => setActiveSection('general')}
          type="button"
        >
          <Image
            alt=""
            className="size-7 shrink-0 rounded-full object-cover"
            height={28}
            priority
            src={author}
            width={28}
          />
          <span className="hidden min-w-0 md:block">
            <span className="block truncate text-[12px] font-medium">
              Mehdi Djahraoui
            </span>
            <span className="mt-px block truncate text-[10.5px] text-black/50 dark:text-white/52">
              Portfolio Settings
            </span>
          </span>
        </button>

        <div className="mx-3 my-1 h-px shrink-0 bg-black/7 dark:bg-white/7" />

        <div
          aria-label="Settings sections"
          aria-orientation="vertical"
          className="min-h-0 flex-1 overflow-y-auto px-1.5 pt-0.5 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
        >
          {visibleSections.map((section, index) => {
            const selected = activeSection === section.id

            return (
              <button
                aria-controls={`settings-panel-${section.id}`}
                aria-label={section.label}
                aria-selected={selected}
                className={`my-px flex h-[30px] w-full items-center justify-center gap-2 rounded-md px-1.5 text-[12.5px] transition md:justify-start md:px-2.5 ${
                  selected
                    ? 'bg-[#007aff] font-medium text-white'
                    : 'text-zinc-700 hover:bg-black/5 dark:text-white/92 dark:hover:bg-white/[0.055]'
                }`}
                id={`settings-section-${section.id}`}
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                onKeyDown={(event) => handleSectionKeyDown(event, index)}
                role="tab"
                tabIndex={
                  selected ||
                  (!visibleSections.some(
                    (visibleSection) => visibleSection.id === activeSection
                  ) &&
                    index === 0)
                    ? 0
                    : -1
                }
                type="button"
              >
                <span
                  className={`flex size-5 shrink-0 items-center justify-center rounded-[5px] text-white shadow-sm ${section.iconClassName}`}
                >
                  <section.Icon aria-hidden className="size-3.5" stroke={1.8} />
                </span>
                <span className="hidden truncate md:block">
                  {section.label}
                </span>
              </button>
            )
          })}

          {visibleSections.length === 0 && (
            <p className="px-2 py-4 text-center text-[11px] text-black/40 dark:text-white/40">
              No settings found
            </p>
          )}
        </div>
      </aside>

      <main className="min-h-0 overflow-y-auto bg-[rgba(246,246,248,0.99)] [scrollbar-width:thin] dark:bg-[rgba(20,20,22,0.99)]">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            aria-labelledby={`settings-section-${activeSection}`}
            exit={{ opacity: 0, y: -3 }}
            id={`settings-panel-${activeSection}`}
            initial={{ opacity: 0, y: 5 }}
            key={activeSection}
            role="tabpanel"
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeSection === 'general' && <SettingsOverview />}
            {activeSection === 'appearance' && <AppearanceSettings />}
            {activeSection === 'wallpapers' && <WallpaperGrid />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
