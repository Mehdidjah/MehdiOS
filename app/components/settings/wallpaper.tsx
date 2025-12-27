import { setWallpaper } from '@/app/features/settings'
import { useDispatch, useSelector } from '@/app/store'
import vd from '@/public/assets/background/ventura-dark.jpg'
import vl from '@/public/assets/background/ventura-light.jpg'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import { StaticImageData } from 'next/image'

const createWallpaper = (
  name: string,
  image: StaticImageData
): { name: string; dark: StaticImageData; light: StaticImageData } => ({
  name,
  dark: image,
  light: image,
})

import anime1 from '@/public/assets/background/anime1.webp'
import anime2 from '@/public/assets/background/anime2.webp'
import anime3 from '@/public/assets/background/anime3.webp'
import anime4 from '@/public/assets/background/anime4.webp'
import anime5 from '@/public/assets/background/anime5.webp'
import anime6 from '@/public/assets/background/anime6.webp'
import anime7 from '@/public/assets/background/anime7.webp'

const wallpapers = [
  createWallpaper('Anime 1', anime1),
  createWallpaper('Anime 2', anime2),
  createWallpaper('Anime 3', anime3),
  createWallpaper('Anime 4', anime4),
  createWallpaper('Anime 5', anime5),
  createWallpaper('Anime 6', anime6),
  createWallpaper('Anime 7', anime7),
  { name: 'Ventura', dark: vd, light: vl },
]

export function Wallpaper() {
  const dispatch = useDispatch()
  const wallpaper = useSelector((state) => state.settings.wallpaper)
  const { theme, resolvedTheme, setTheme } = useTheme()

  return (
    <div className="p-2 sm:p-4 overflow-x-hidden">
      <div className="border-light-border flex flex-col sm:flex-row gap-4 sm:gap-8 border-b pb-6 sm:pb-10 dark:border-[#4b4b4b]">
        <div className="relative h-28 w-full sm:w-60">
          {wallpaper && (
            <Image
              className="object-cover object-center"
              alt="walpaper"
              fill
              src={resolvedTheme === 'dark' ? wallpaper.dark : wallpaper.light}
              sizes="(max-width: 100px) 100vw"
            />
          )}
        </div>
        <div className="flex h-fit items-center justify-start gap-3 font-medium">
          <h3>Theme Mode</h3>
          <select
            onChange={(e) => {
              setTheme(e.target.value)
            }}
            value={theme}
            className="bg-light-background dark:bg-dark-background px-2 py-[2px] focus:outline-none"
          >
            <option value="system">Automatic</option>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>
      </div>
      <h2 className="my-4 text-base sm:text-lg font-medium">Wallpapers</h2>
      <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2 sm:gap-4">
        {wallpapers.map((wp, i) => (
          <button
            onClick={() => {
              dispatch(setWallpaper({ dark: wp.dark, light: wp.light }))
            }}
            className="relative h-28"
            key={i}
          >
            <Image
              className="object-cover object-center"
              alt={wp.name}
              fill
              src={resolvedTheme === 'light' ? wp.light : wp.dark}
              sizes="(max-width: 100px) 100vw"
            />
          </button>
        ))}
      </div>
    </div>
  )
}
