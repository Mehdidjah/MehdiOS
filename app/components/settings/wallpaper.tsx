'use client'

import { setWallpaper } from '@/app/features/settings'
import { useDispatch, useSelector } from '@/app/store'
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

export function AppearanceSettings() {
  const wallpaper = useSelector((state) => state.settings.wallpaper)
  const { theme, resolvedTheme, setTheme } = useTheme()

  return (
    <section aria-labelledby="appearance-heading" className="space-y-5">
      <div>
        <h2
          className="text-[22px] font-semibold tracking-[-0.02em] text-zinc-900 dark:text-white"
          id="appearance-heading"
        >
          Appearance
        </h2>
        <p className="mt-1 text-[13px] text-zinc-500 dark:text-white/50">
          Choose how MehdiOS looks on this device.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-black/8 bg-white/70 shadow-sm dark:border-white/8 dark:bg-white/5">
        <div className="grid gap-5 p-4 sm:grid-cols-[minmax(220px,1fr)_minmax(210px,0.7fr)] sm:p-5">
          <div>
            <p className="text-[13px] font-medium text-zinc-800 dark:text-white/90">
              Current desktop
            </p>
            <div className="relative mt-3 aspect-video overflow-hidden rounded-lg border border-black/10 bg-zinc-200 shadow-inner dark:border-white/10 dark:bg-zinc-900">
              {wallpaper && (
                <Image
                  alt="Current MehdiOS wallpaper"
                  className="object-cover object-center"
                  fill
                  sizes="(max-width: 640px) 100vw, 420px"
                  src={
                    resolvedTheme === 'dark' ? wallpaper.dark : wallpaper.light
                  }
                />
              )}
              <div className="absolute inset-x-0 top-0 h-3 bg-black/25 backdrop-blur-sm" />
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <label
              className="text-[13px] font-medium text-zinc-800 dark:text-white/90"
              htmlFor="settings-theme-mode"
            >
              Theme mode
            </label>
            <p className="mt-1 text-[12px] leading-5 text-zinc-500 dark:text-white/45">
              Automatic follows your operating system preference.
            </p>
            <select
              className="mt-3 h-9 rounded-lg border border-black/10 bg-white px-3 text-[13px] text-zinc-800 outline-hidden transition focus:border-[#007aff] focus:ring-2 focus:ring-[#007aff]/20 dark:border-white/10 dark:bg-[#323235] dark:text-white"
              id="settings-theme-mode"
              onChange={(event) => setTheme(event.target.value)}
              value={theme ?? 'system'}
            >
              <option value="system">Automatic</option>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
        </div>
      </div>
    </section>
  )
}

export function WallpaperGrid() {
  const dispatch = useDispatch()
  const wallpaper = useSelector((state) => state.settings.wallpaper)
  const { resolvedTheme } = useTheme()

  return (
    <section aria-labelledby="wallpapers-heading" className="space-y-5">
      <div>
        <h2
          className="text-[22px] font-semibold tracking-[-0.02em] text-zinc-900 dark:text-white"
          id="wallpapers-heading"
        >
          Wallpapers
        </h2>
        <p className="mt-1 text-[13px] text-zinc-500 dark:text-white/50">
          Select a local image for the MehdiOS desktop.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
        {wallpapers.map((option) => {
          const selected =
            wallpaper?.dark.src === option.dark.src &&
            wallpaper?.light.src === option.light.src

          return (
            <button
              aria-label={`Use ${option.name} wallpaper`}
              aria-pressed={selected}
              className="group text-left"
              key={option.name}
              onClick={() => {
                dispatch(
                  setWallpaper({ dark: option.dark, light: option.light })
                )
              }}
              type="button"
            >
              <span
                className={`relative block aspect-video overflow-hidden rounded-lg border-2 bg-zinc-200 shadow-sm transition group-hover:-translate-y-0.5 group-hover:shadow-md dark:bg-zinc-900 ${
                  selected
                    ? 'border-[#007aff] ring-2 ring-[#007aff]/20'
                    : 'border-transparent group-hover:border-black/10 dark:group-hover:border-white/15'
                }`}
              >
                <Image
                  alt=""
                  className="object-cover object-center"
                  fill
                  sizes="(max-width: 640px) 50vw, 220px"
                  src={resolvedTheme === 'light' ? option.light : option.dark}
                />
                {selected && (
                  <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-[#007aff] text-white shadow-md">
                    <IconCheck aria-hidden className="size-4" stroke={2.4} />
                  </span>
                )}
              </span>
              <span className="mt-2 block truncate text-[12px] font-medium text-zinc-700 dark:text-white/75">
                {option.name}
              </span>
            </button>
          )
        })}
      </div>
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
