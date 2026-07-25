'use client'

import { setWallpaper } from '@/app/features/settings'
import { useDispatch, useSelector } from '@/app/store'
import { macwebSettingsSectionIconSrc } from '@/app/utils/icon-paths'
import anime1 from '@/public/assets/background/anime1.webp'
import anime2 from '@/public/assets/background/anime2.webp'
import anime3 from '@/public/assets/background/anime3.webp'
import anime4 from '@/public/assets/background/anime4.webp'
import anime5 from '@/public/assets/background/anime5.webp'
import anime6 from '@/public/assets/background/anime6.webp'
import anime7 from '@/public/assets/background/anime7.webp'
import macosTahoe from '@/public/assets/background/macos-tahoe.jpg'
import vd from '@/public/assets/background/ventura-dark.jpg'
import vl from '@/public/assets/background/ventura-light.jpg'
import { IconCheck } from '@tabler/icons-react'
import Image, { type StaticImageData } from 'next/image'
import { useTheme } from 'next-themes'

export type WallpaperOption = {
  name: string
  dark: StaticImageData
  light: StaticImageData
}

const createWallpaper = (
  name: string,
  image: StaticImageData
): WallpaperOption => ({
  name,
  dark: image,
  light: image,
})

export const wallpapers: WallpaperOption[] = [
  createWallpaper('macOS Tahoe', macosTahoe),
  createWallpaper('Anime 1', anime1),
  createWallpaper('Anime 2', anime2),
  createWallpaper('Anime 3', anime3),
  createWallpaper('Anime 4', anime4),
  createWallpaper('Anime 5', anime5),
  createWallpaper('Anime 6', anime6),
  createWallpaper('Anime 7', anime7),
  { name: 'Ventura', dark: vd, light: vl },
]

function PanelHeader({
  description,
  title,
  type,
}: {
  description: string
  title: string
  type: 'appearance' | 'wallpaper'
}) {
  const iconSrc =
    type === 'appearance'
      ? macwebSettingsSectionIconSrc.appearance
      : macwebSettingsSectionIconSrc.wallpaper

  return (
    <header className="mb-7 text-center">
      <Image
        alt=""
        className="mx-auto mb-3.5 size-[72px] object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.22)]"
        height={72}
        src={iconSrc}
        width={72}
      />
      <h2 className="text-[28px] font-bold tracking-[-0.02em] text-zinc-900 dark:text-white/92">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-[420px] text-[13.5px] leading-5 text-zinc-500 dark:text-white/52">
        {description}
      </p>
    </header>
  )
}

const appearanceModes = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'Auto' },
] as const

export function AppearanceSettings() {
  const wallpaper = useSelector((state) => state.settings.wallpaper)
  const { theme, resolvedTheme, setTheme } = useTheme()
  const selectedTheme = theme ?? 'system'

  return (
    <section
      aria-labelledby="appearance-heading"
      className="mx-auto w-full max-w-[580px] px-5 pt-7 pb-10 sm:px-7"
    >
      <div id="appearance-heading">
        <PanelHeader
          description="Customize MehdiOS visual style and desktop preview."
          title="Appearance"
          type="appearance"
        />
      </div>

      <div className="space-y-4">
        <section className="space-y-1">
          <h3 className="px-3 text-[10.5px] font-semibold tracking-[0.04em] text-black/35 uppercase dark:text-white/32">
            Appearance Mode
          </h3>
          <div className="grid grid-cols-3 gap-2 rounded-lg border border-black/7 bg-white/75 p-2 dark:border-white/7 dark:bg-white/[0.055]">
            {appearanceModes.map((mode) => {
              const selected = selectedTheme === mode.id

              return (
                <button
                  aria-pressed={selected}
                  className={`group rounded-[7px] border p-1.5 text-center transition ${
                    selected
                      ? 'border-[#007aff] bg-[#007aff]/12 ring-1 ring-[#007aff]/25'
                      : 'border-black/7 hover:bg-black/4 dark:border-white/7 dark:hover:bg-white/5'
                  }`}
                  key={mode.id}
                  onClick={() => setTheme(mode.id)}
                  type="button"
                >
                  <span
                    className={`mx-auto block aspect-[4/3] overflow-hidden rounded-[5px] border ${
                      mode.id === 'dark'
                        ? 'border-white/10 bg-[#1c1c1e]'
                        : mode.id === 'light'
                          ? 'border-black/10 bg-[#f2f2f4]'
                          : 'border-black/10 bg-gradient-to-r from-[#f2f2f4] from-50% to-[#1c1c1e] to-50% dark:border-white/10'
                    }`}
                  >
                    <span className="mt-1.5 ml-1.5 block h-1 w-[65%] rounded-full bg-[#007aff]/80" />
                    <span className="mt-1 ml-1.5 block h-1 w-[45%] rounded-full bg-zinc-400/60" />
                  </span>
                  <span className="mt-1.5 block text-[11px] font-medium text-zinc-700 dark:text-white/75">
                    {mode.label}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="space-y-1">
          <h3 className="px-3 text-[10.5px] font-semibold tracking-[0.04em] text-black/35 uppercase dark:text-white/32">
            Desktop
          </h3>
          <div className="rounded-lg border border-black/7 bg-white/75 p-3 dark:border-white/7 dark:bg-white/[0.055]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] text-zinc-900 dark:text-white/92">
                  Current Wallpaper
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-white/52">
                  Preview using the active {resolvedTheme ?? 'system'} theme.
                </p>
              </div>
              <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-md border border-black/10 bg-zinc-200 dark:border-white/10 dark:bg-zinc-900">
                {wallpaper && (
                  <Image
                    alt="Current MehdiOS wallpaper"
                    className="object-cover object-center"
                    fill
                    sizes="96px"
                    src={
                      resolvedTheme === 'dark'
                        ? wallpaper.dark
                        : wallpaper.light
                    }
                  />
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>
  )
}

export function WallpaperGrid() {
  const dispatch = useDispatch()
  const wallpaper = useSelector((state) => state.settings.wallpaper)
  const { resolvedTheme } = useTheme()

  return (
    <section
      aria-labelledby="wallpapers-heading"
      className="mx-auto w-full max-w-[580px] px-5 pt-7 pb-10 sm:px-7"
    >
      <div id="wallpapers-heading">
        <PanelHeader
          description="Choose a local background image for the portfolio desktop."
          title="Wallpaper"
          type="wallpaper"
        />
      </div>

      <section className="space-y-1">
        <h3 className="px-3 text-[10.5px] font-semibold tracking-[0.04em] text-black/35 uppercase dark:text-white/32">
          MehdiOS Wallpapers
        </h3>
        <div className="grid grid-cols-2 gap-3 rounded-lg border border-black/7 bg-white/75 p-3 dark:border-white/7 dark:bg-white/[0.055]">
          {wallpapers.map((option) => {
            const selected =
              wallpaper?.dark.src === option.dark.src &&
              wallpaper?.light.src === option.light.src

            return (
              <button
                aria-label={`Use ${option.name} wallpaper`}
                aria-pressed={selected}
                className="group min-w-0 text-left"
                key={option.name}
                onClick={() => {
                  dispatch(
                    setWallpaper({ dark: option.dark, light: option.light })
                  )
                }}
                type="button"
              >
                <span
                  className={`relative block aspect-video overflow-hidden rounded-[7px] border-2 bg-zinc-200 transition group-hover:-translate-y-px dark:bg-zinc-900 ${
                    selected
                      ? 'border-[#007aff] ring-2 ring-[#007aff]/20'
                      : 'border-transparent group-hover:border-black/10 dark:group-hover:border-white/15'
                  }`}
                >
                  <Image
                    alt=""
                    className="object-cover object-center"
                    fill
                    sizes="150px"
                    src={resolvedTheme === 'light' ? option.light : option.dark}
                  />
                  {selected && (
                    <span className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-[#007aff] text-white shadow-md">
                      <IconCheck
                        aria-hidden
                        className="size-3.5"
                        stroke={2.4}
                      />
                    </span>
                  )}
                </span>
                <span className="mt-1.5 block truncate text-[11px] font-medium text-zinc-700 dark:text-white/75">
                  {option.name}
                </span>
              </button>
            )
          })}
        </div>
      </section>
    </section>
  )
}

export function Wallpaper() {
  return (
    <div className="space-y-8">
      <AppearanceSettings />
      <WallpaperGrid />
    </div>
  )
}
