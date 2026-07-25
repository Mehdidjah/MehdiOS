'use client'

import { setMusicStatus, setVolume } from '@/app/features/settings'
import { useDispatch, useSelector } from '@/app/store'
import { newIconSrc } from '@/app/utils/icon-paths'
import { getMusicPlayer } from '@/app/utils/music-player'
import { WindowChromeContext } from '@/app/components/window-frame'
import { MacTrafficLights } from '@/app/components/window-frame/mac-traffic-lights'
import author from '@/public/assets/images/author.webp'
import {
  IconAlbum,
  IconClock,
  IconHome,
  IconMusic,
  IconPin,
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconPlayerSkipBackFilled,
  IconPlayerSkipForwardFilled,
  IconPlus,
  IconRadio,
  IconSearch,
  IconSparkles,
  IconUsers,
  IconVideo,
  IconVolume,
} from '@tabler/icons-react'
import Image from 'next/image'
import { useContext, useEffect, useMemo, useRef, useState } from 'react'

const track = {
  album: 'Starboy',
  artist: 'The Weeknd',
  duration: '3:50',
  title: 'Starboy',
}

const navigation = [
  { icon: IconSearch, label: 'Search' },
  { icon: IconHome, label: 'Home' },
  { icon: IconPlus, label: 'New' },
  { icon: IconRadio, label: 'Radio' },
]

const library = [
  { icon: IconPin, label: 'Pins' },
  { icon: IconClock, label: 'Recently Added' },
  { icon: IconUsers, label: 'Artists' },
  { icon: IconAlbum, label: 'Albums' },
  { icon: IconMusic, label: 'Songs' },
  { icon: IconVideo, label: 'Music Videos' },
  { icon: IconSparkles, label: 'Made for You' },
]

export function Music() {
  const windowChrome = useContext(WindowChromeContext)
  const fallbackHeaderRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const dispatch = useDispatch()
  const { music_status, volume } = useSelector((state) => state.settings)
  const [query, setQuery] = useState('')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const dragHandleRef = windowChrome?.frameHeader ?? fallbackHeaderRef

  useEffect(() => {
    const player = getMusicPlayer()
    if (!player) return

    player.volume = Math.max(0, Math.min(1, volume / 100))
    const syncPlaying = () => dispatch(setMusicStatus('playing'))
    const syncPaused = () => dispatch(setMusicStatus('paused'))
    const syncTime = () => setCurrentTime(player.currentTime)
    const syncDuration = () => setDuration(player.duration || 0)

    player.addEventListener('play', syncPlaying)
    player.addEventListener('pause', syncPaused)
    player.addEventListener('ended', syncPaused)
    player.addEventListener('timeupdate', syncTime)
    player.addEventListener('loadedmetadata', syncDuration)
    syncTime()
    syncDuration()

    return () => {
      player.removeEventListener('play', syncPlaying)
      player.removeEventListener('pause', syncPaused)
      player.removeEventListener('ended', syncPaused)
      player.removeEventListener('timeupdate', syncTime)
      player.removeEventListener('loadedmetadata', syncDuration)
    }
  }, [dispatch, volume])

  const isVisible = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return (
      !normalized ||
      `${track.title} ${track.artist} ${track.album}`
        .toLowerCase()
        .includes(normalized)
    )
  }, [query])

  const togglePlayback = () => {
    const player = getMusicPlayer()
    if (!player) return
    if (player.paused) {
      player.play().catch(() => dispatch(setMusicStatus('paused')))
    } else {
      player.pause()
    }
  }

  const restart = () => {
    const player = getMusicPlayer()
    if (!player) return
    player.currentTime = 0
    player.play().catch(() => dispatch(setMusicStatus('paused')))
  }

  const seek = (value: number) => {
    const player = getMusicPlayer()
    if (!player || !Number.isFinite(player.duration)) return
    player.currentTime = value
    setCurrentTime(value)
  }

  const updateVolume = (value: number) => {
    const player = getMusicPlayer()
    if (player) player.volume = Math.max(0, Math.min(1, value / 100))
    dispatch(setVolume(value))
  }

  const elapsed = formatTime(currentTime)
  const total = duration ? formatTime(duration) : track.duration

  return (
    <div className="grid h-full min-h-0 grid-cols-[88px_minmax(0,1fr)] overflow-hidden bg-[#fafafa] text-[#292929] md:grid-cols-[224px_minmax(0,1fr)] dark:bg-[#1c1c1e] dark:text-[#f5f5f7]">
      <aside className="flex min-h-0 flex-col border-r border-black/8 bg-[#f5f5f7]/95 dark:border-white/8 dark:bg-[#252527]">
        <div
          ref={dragHandleRef}
          className="flex h-[52px] shrink-0 items-center px-1.5 md:px-4"
          onDoubleClick={windowChrome?.onZoom}
        >
          <MacTrafficLights
            appName="Music"
            isActive={windowChrome?.isFocused ?? true}
            isFullscreen={windowChrome?.isFullscreen}
            onClose={windowChrome?.onClose ?? (() => {})}
            onMinimize={windowChrome?.onMinimize ?? (() => {})}
            onZoom={windowChrome?.onZoom ?? (() => {})}
          />
        </div>

        <nav aria-label="Music navigation" className="space-y-4 px-2 py-2">
          <div className="space-y-0.5">
            {navigation.map(({ icon: Icon, label }) => (
              <SidebarItem
                icon={<Icon className="size-[17px]" stroke={1.8} />}
                key={label}
                label={label}
                onClick={
                  label === 'Search'
                    ? () => searchRef.current?.focus()
                    : undefined
                }
              />
            ))}
          </div>
          <div>
            <p className="hidden px-2 pb-1 text-[10px] font-semibold tracking-[0.08em] text-black/35 uppercase md:block dark:text-white/35">
              Library
            </p>
            <div className="space-y-0.5">
              {library.map(({ icon: Icon, label }) => (
                <SidebarItem
                  active={label === 'Songs'}
                  icon={<Icon className="size-[17px]" stroke={1.8} />}
                  key={label}
                  label={label}
                />
              ))}
            </div>
          </div>
          <p className="hidden px-2 text-[10px] font-semibold tracking-[0.08em] text-black/35 uppercase md:block dark:text-white/35">
            Playlists
          </p>
        </nav>

        <button
          aria-label="Music profile"
          className="mt-auto flex items-center justify-center gap-2 border-t border-black/7 p-3 text-left md:justify-start dark:border-white/7"
          type="button"
        >
          <Image
            alt="Mehdi Djahraoui"
            className="size-7 rounded-full object-cover"
            height={28}
            src={author}
            width={28}
          />
          <span className="hidden min-w-0 text-xs font-medium md:block">
            Mehdi Djahraoui
          </span>
        </button>
      </aside>

      <section className="relative flex min-w-0 flex-col bg-white dark:bg-[#1c1c1e]">
        <header
          ref={fallbackHeaderRef}
          className="flex h-[52px] shrink-0 items-center justify-between border-b border-black/7 px-4 md:px-6 dark:border-white/7"
          onDoubleClick={windowChrome?.onZoom}
        >
          <h1 className="text-[13px] font-bold">Songs</h1>
          <label className="relative">
            <IconSearch
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-black/40 dark:text-white/40"
            />
            <input
              aria-label="Search songs"
              className="h-7 w-36 rounded-full border border-black/10 bg-[#f6f6f6] pr-2 pl-8 text-[11px] outline-none focus:border-rose-300 sm:w-44 dark:border-white/10 dark:bg-white/8"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find in Songs"
              ref={searchRef}
              type="search"
              value={query}
            />
          </label>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 pb-32 [scrollbar-width:none] md:px-6 md:py-6 [&::-webkit-scrollbar]:hidden">
          {isVisible ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              <button
                aria-label={`Play ${track.title} by ${track.artist}`}
                className="group flex min-w-0 flex-col text-left"
                onClick={togglePlayback}
                type="button"
              >
                <span className="relative mb-2 block aspect-square w-full overflow-hidden rounded-lg border border-black/5 bg-gradient-to-br from-rose-400 to-rose-600 shadow-sm dark:border-white/5 dark:from-rose-500 dark:to-[#4d1425]">
                  <Image
                    alt="Starboy artwork"
                    className="object-contain p-[12%] transition group-hover:brightness-95"
                    fill
                    sizes="160px"
                    src={newIconSrc.music}
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 transition group-hover:opacity-100">
                    <span className="flex size-10 items-center justify-center rounded-full bg-white/95 text-zinc-900 shadow-md transition group-hover:scale-105">
                      {music_status === 'playing' ? (
                        <IconPlayerPauseFilled className="size-4" />
                      ) : (
                        <IconPlayerPlayFilled className="ml-0.5 size-4" />
                      )}
                    </span>
                  </span>
                </span>
                <span className="w-full truncate text-[12px] font-semibold text-zinc-900 dark:text-white">
                  {track.title}
                </span>
                <span className="mt-0.5 w-full truncate text-[11px] leading-none text-zinc-500 dark:text-zinc-400">
                  {track.artist}
                </span>
              </button>
            </div>
          ) : (
            <div className="flex h-full min-h-56 flex-col items-center justify-center text-center text-black/45 dark:text-white/45">
              <IconMusic
                className="size-10 text-zinc-300 dark:text-zinc-700"
                stroke={1.4}
              />
              <p className="mt-3 text-sm">No songs match “{query}”.</p>
            </div>
          )}
        </div>

        <div className="absolute right-3 bottom-3 left-3 mx-auto flex max-w-[620px] items-center gap-3 rounded-full border border-black/10 bg-white/90 px-3 py-2 shadow-[0_12px_35px_rgba(0,0,0,0.18)] backdrop-blur-xl md:right-6 md:bottom-5 md:left-6 dark:border-white/10 dark:bg-[#343438]/92">
          <Image
            alt="Starboy artwork"
            className="size-11 shrink-0 rounded-md object-cover"
            height={44}
            src={newIconSrc.music}
            width={44}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold">{track.title}</p>
            <p className="truncate text-[11px] text-black/55 dark:text-white/55">
              {track.artist}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className="w-8 text-right text-[10px] text-black/45 tabular-nums dark:text-white/45">
                {elapsed}
              </span>
              <input
                aria-label="Song progress"
                className="h-1.5 min-w-0 flex-1 accent-rose-500"
                max={duration || 0}
                min="0"
                onChange={(event) => seek(Number(event.target.value))}
                step="0.1"
                type="range"
                value={Math.min(currentTime, duration || 0)}
              />
              <span className="w-8 text-[10px] text-black/45 tabular-nums dark:text-white/45">
                {total}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              aria-label="Previous track: restart Starboy"
              className="rounded-full p-2 hover:bg-black/6 dark:hover:bg-white/10"
              onClick={restart}
              type="button"
            >
              <IconPlayerSkipBackFilled className="size-4" />
            </button>
            <button
              aria-label={
                music_status === 'playing' ? 'Pause Starboy' : 'Play Starboy'
              }
              className="rounded-full bg-rose-500 p-2.5 text-white shadow-sm transition hover:bg-rose-600"
              onClick={togglePlayback}
              type="button"
            >
              {music_status === 'playing' ? (
                <IconPlayerPauseFilled className="size-4" />
              ) : (
                <IconPlayerPlayFilled className="size-4" />
              )}
            </button>
            <button
              aria-label="Next track: restart Starboy"
              className="rounded-full p-2 hover:bg-black/6 dark:hover:bg-white/10"
              onClick={restart}
              type="button"
            >
              <IconPlayerSkipForwardFilled className="size-4" />
            </button>
          </div>
          <label className="hidden items-center gap-1.5 lg:flex">
            <IconVolume
              aria-hidden
              className="size-4 text-black/55 dark:text-white/55"
            />
            <input
              aria-label="Music volume"
              className="w-16 accent-rose-500"
              max="100"
              min="0"
              onChange={(event) => updateVolume(Number(event.target.value))}
              type="range"
              value={volume}
            />
          </label>
        </div>
      </section>
    </div>
  )
}

function SidebarItem({
  active = false,
  icon,
  label,
  onClick,
}: {
  active?: boolean
  icon: React.ReactNode
  label: string
  onClick?: () => void
}) {
  return (
    <button
      aria-current={active ? 'page' : undefined}
      aria-label={label}
      className={`flex w-full items-center justify-center gap-2 rounded-lg px-2 py-1.5 text-[13px] font-medium transition md:justify-start md:px-3 ${active ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'text-black/65 hover:bg-black/4 dark:text-white/68 dark:hover:bg-white/5'}`}
      onClick={onClick}
      type="button"
    >
      {icon}
      <span className="hidden md:block">{label}</span>
    </button>
  )
}

function formatTime(value: number) {
  if (!Number.isFinite(value)) return '0:00'
  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value % 60)
    .toString()
    .padStart(2, '0')
  return `${minutes}:${seconds}`
}
