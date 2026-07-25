'use client'

import { useSelector } from '@/app/store'
import author from '@/public/assets/images/author.webp'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { type KeyboardEvent, useState } from 'react'
import { AppearanceSettings, WallpaperGrid, wallpapers } from './wallpaper'

type SettingsTab = 'overview' | 'appearance' | 'wallpapers'

const tabs: Array<{ id: SettingsTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'wallpapers', label: 'Wallpapers' },
]

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
    <section aria-labelledby="settings-overview-heading" className="space-y-5">
      <div>
        <h2
          className="text-[22px] font-semibold tracking-[-0.02em] text-zinc-900 dark:text-white"
          id="settings-overview-heading"
        >
          MehdiOS
        </h2>
        <p className="mt-1 text-[13px] text-zinc-500 dark:text-white/50">
          Portfolio desktop preferences and appearance.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-black/8 bg-white/70 shadow-sm dark:border-white/8 dark:bg-white/5">
        <div className="flex flex-col items-center gap-4 p-5 text-center sm:flex-row sm:text-left">
          <Image
            alt="Mehdi Djahraoui"
            className="size-20 rounded-full border border-black/10 object-cover shadow-md dark:border-white/10"
            height={80}
            priority
            src={author}
            width={80}
          />
          <div className="min-w-0">
            <h3 className="truncate text-[19px] font-semibold text-zinc-900 dark:text-white">
              Mehdi Djahraoui
            </h3>
            <p className="mt-1 text-[13px] text-zinc-500 dark:text-white/50">
              Portfolio owner
            </p>
            <p className="mt-3 max-w-xl text-[12px] leading-5 text-zinc-500 dark:text-white/45">
              Personalize the desktop without changing any of the projects,
              applications, or portfolio content.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-black/8 bg-white/70 p-4 shadow-sm dark:border-white/8 dark:bg-white/5">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-zinc-400 uppercase dark:text-white/35">
            Appearance
          </p>
          <p className="mt-2 text-[15px] font-medium text-zinc-900 dark:text-white/90">
            {themeLabel}
          </p>
          <p className="mt-1 text-[12px] text-zinc-500 dark:text-white/45">
            Theme mode currently applied to MehdiOS.
          </p>
        </div>

        <div className="rounded-xl border border-black/8 bg-white/70 p-4 shadow-sm dark:border-white/8 dark:bg-white/5">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-zinc-400 uppercase dark:text-white/35">
            Wallpaper
          </p>
          <p className="mt-2 text-[15px] font-medium text-zinc-900 dark:text-white/90">
            {selectedWallpaper?.name ?? 'Custom wallpaper'}
          </p>
          <p className="mt-1 text-[12px] text-zinc-500 dark:text-white/45">
            Active background for the portfolio desktop.
          </p>
        </div>
      </div>
    </section>
  )
}

export function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('overview')

  const focusTab = (index: number) => {
    const nextTab = tabs[index]
    if (!nextTab) return

    setActiveTab(nextTab.id)
    requestAnimationFrame(() => {
      document.getElementById(`settings-tab-${nextTab.id}`)?.focus()
    })
  }

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    let nextIndex = index

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (index + 1) % tabs.length
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (index - 1 + tabs.length) % tabs.length
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = tabs.length - 1
    } else {
      return
    }

    event.preventDefault()
    focusTab(nextIndex)
  }

  return (
    <div
      className="grid h-full min-h-0 grid-rows-[48px_1fr_30px] bg-[#f4f4f5] text-zinc-900 dark:bg-[#27272a] dark:text-white"
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', 'Segoe UI', sans-serif",
      }}
    >
      <div className="flex min-w-0 items-center justify-center border-b border-black/8 bg-white/45 px-3 dark:border-white/8 dark:bg-black/10">
        <div
          aria-label="Settings sections"
          aria-orientation="horizontal"
          className="flex max-w-full items-center gap-1 overflow-x-auto rounded-lg p-1"
          role="tablist"
        >
          {tabs.map((tab, index) => {
            const selected = activeTab === tab.id

            return (
              <button
                aria-controls={`settings-panel-${tab.id}`}
                aria-selected={selected}
                className={`shrink-0 rounded-md px-3 py-1.5 text-[13px] font-medium transition focus-visible:outline-2 focus-visible:outline-[#007aff] ${
                  selected
                    ? 'bg-black/10 text-zinc-900 shadow-sm dark:bg-white/15 dark:text-white'
                    : 'text-zinc-500 hover:bg-black/5 hover:text-zinc-800 dark:text-white/55 dark:hover:bg-white/5 dark:hover:text-white/85'
                }`}
                id={`settings-tab-${tab.id}`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                role="tab"
                tabIndex={selected ? 0 : -1}
                type="button"
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <main className="min-h-0 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
        <div className="mx-auto w-full max-w-[920px]">
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              aria-labelledby={`settings-tab-${activeTab}`}
              exit={{ opacity: 0, y: -6 }}
              id={`settings-panel-${activeTab}`}
              initial={{ opacity: 0, y: 10 }}
              key={activeTab}
              role="tabpanel"
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            >
              {activeTab === 'overview' && <SettingsOverview />}
              {activeTab === 'appearance' && <AppearanceSettings />}
              {activeTab === 'wallpapers' && <WallpaperGrid />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <footer className="flex items-center justify-center border-t border-black/8 text-[11px] text-zinc-400 dark:border-white/8 dark:text-white/30">
        MehdiOS Preferences
      </footer>
    </div>
  )
}
