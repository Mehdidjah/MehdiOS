'use client'

import { setBrightness, setMusicStatus, setVolume } from '@/app/features/settings'
import { useClickOutside } from '@/app/hooks/use-click-outside'
import { useDispatch, useSelector } from '@/app/store'
import musicIcon from '@/public/assets/icons/Music.png'
import { IconCast, IconDots } from '@tabler/icons-react'
import Image from 'next/image'
import {
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react'
import { FaBluetoothB, FaWifi } from 'react-icons/fa'
import { HiMiniSpeakerWave, HiMiniSpeakerXMark } from 'react-icons/hi2'
import { IoIosBatteryFull, IoIosMoon } from 'react-icons/io'
import {
  IoCalculatorOutline,
  IoCameraOutline,
  IoColorPaletteOutline,
  IoPowerOutline,
  IoSearch,
} from 'react-icons/io5'
import { BlurFade } from '@/registry/magicui/blur-fade'
import { AnimatePresence, motion } from 'framer-motion'
import { TaskbarClock } from '../taskbar/clock'
import { Weather } from '../taskbar/weather'
import { BrandApple } from './brand-apple'
import { ControlCenter } from './control-center'

const menuButtonClassName =
  'mac-tahoe-panel-button flex h-[22px] items-center rounded-full px-2 text-[13px] font-medium text-white/95 whitespace-nowrap sm:px-2.5'

const topbarGlassButtonClassName =
  'flex h-[22px] items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-2 text-white/92 [box-shadow:inset_1px_1px_4px_0_rgba(0,0,0,0.14),inset_-1px_-1px_5px_0_rgba(255,255,255,0.14)] backdrop-blur-[18px] transition hover:bg-white/[0.09] active:scale-[0.98]'

const tileClassName =
  'relative overflow-hidden bg-[rgba(255,255,255,0.01)] opacity-90 [box-shadow:inset_1px_1px_4px_0_rgba(0,0,0,0.14),inset_-1px_-1px_6px_0_rgba(255,255,255,0.16)] backdrop-blur-[18px]'

export function Topbar() {
  const [isOpenCC, setIsOpenCC] = useState(false)
  const [wifiEnabled, setWifiEnabled] = useState(true)
  const [bluetoothEnabled, setBluetoothEnabled] = useState(true)
  const [focusEnabled, setFocusEnabled] = useState(false)
  const [mirrorEnabled, setMirrorEnabled] = useState(false)
  const [duplicateEnabled, setDuplicateEnabled] = useState(false)
  const ccRef = useRef<HTMLDivElement>(null)
  const audio = useRef<HTMLAudioElement | null>(null)
  const previousVolume = useRef(50)
  const dispatch = useDispatch()
  const { activeApp, brightness, music_status, volume } = useSelector(
    (state) => state.settings
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    const player = new Audio('/assets/music/starboy.mp3')
    player.loop = true
    player.volume = 0.5
    audio.current = player

    const handlePlay = () => dispatch(setMusicStatus('playing'))
    const handlePause = () => dispatch(setMusicStatus('paused'))

    player.addEventListener('play', handlePlay)
    player.addEventListener('pause', handlePause)
    player.addEventListener('ended', handlePause)

    return () => {
      player.pause()
      player.removeEventListener('play', handlePlay)
      player.removeEventListener('pause', handlePause)
      player.removeEventListener('ended', handlePause)
      audio.current = null
    }
  }, [dispatch])

  useEffect(() => {
    if (audio.current instanceof HTMLAudioElement) {
      audio.current.volume = Math.max(0, Math.min(1, volume / 100))
    }
  }, [volume])

  useEffect(() => {
    if (typeof document === 'undefined') return

    document.body.style.filter = `brightness(${Math.max(35, brightness)}%)`

    return () => {
      document.body.style.filter = ''
    }
  }, [brightness])

  useClickOutside(() => {
    setIsOpenCC(false)
  }, ccRef)

  const updateBrightness = (value: number) => {
    dispatch(setBrightness(value))
  }

  const updateVolume = (value: number) => {
    if (value > 0) {
      previousVolume.current = value
    }

    dispatch(setVolume(value))
  }

  const toggleMute = () => {
    if (volume > 0) {
      previousVolume.current = volume
      updateVolume(0)
      return
    }

    updateVolume(previousVolume.current || 50)
  }

  const toggleMusic = () => {
    const player = audio.current
    if (!(player instanceof HTMLAudioElement)) return

    if (music_status === 'playing') {
      player.pause()
      return
    }

    player.play().catch((error) => console.error('Failed to play audio:', error))
  }

  return (
    <div className="mac-tahoe-panel-flat sticky top-0 z-[3000] flex h-7 items-center justify-between overflow-visible px-2 text-xs font-medium text-white sm:px-4 sm:text-sm">
      <div className="relative z-10 flex h-full items-center gap-0.5 overflow-x-auto sm:gap-1">
        <BrandApple />
        <button className={`${menuButtonClassName} font-semibold`} type="button">
          {activeApp ? activeApp.name : 'Finder'}
        </button>
        <button className={`hidden ${menuButtonClassName} sm:flex`} type="button">
          File
        </button>
        <button className={`hidden ${menuButtonClassName} sm:flex`} type="button">
          Edit
        </button>
        <button className={`hidden ${menuButtonClassName} md:flex`} type="button">
          View
        </button>
        <button className={`hidden ${menuButtonClassName} md:flex`} type="button">
          Go
        </button>
        <button className={`hidden ${menuButtonClassName} lg:flex`} type="button">
          Window
        </button>
        <button className={`hidden ${menuButtonClassName} lg:flex`} type="button">
          Help
        </button>
      </div>

      <div className="relative z-10 flex h-full items-center gap-1.5">
        <TopbarIconButton
          active={wifiEnabled}
          ariaLabel="Toggle Wi-Fi"
          onClick={() => setWifiEnabled((prev) => !prev)}
        >
          <FaWifi className="text-[11px]" />
        </TopbarIconButton>

        <TopbarIconButton
          active={bluetoothEnabled}
          ariaLabel="Toggle Bluetooth"
          onClick={() => setBluetoothEnabled((prev) => !prev)}
        >
          <FaBluetoothB className="text-[12px]" />
        </TopbarIconButton>

        <TopbarIconButton
          active={volume > 0}
          ariaLabel="Toggle sound"
          onClick={toggleMute}
        >
          {volume > 0 ? (
            <HiMiniSpeakerWave className="text-[13px]" />
          ) : (
            <HiMiniSpeakerXMark className="text-[13px]" />
          )}
        </TopbarIconButton>

        <TopbarIconButton ariaLabel="Battery status">
          <IoIosBatteryFull className="text-[16px]" />
        </TopbarIconButton>

        <TopbarIconButton ariaLabel="Search">
          <IoSearch className="text-[13px]" />
        </TopbarIconButton>

        <TopbarIconButton
          active={isOpenCC}
          ariaLabel="Open control center"
          onClick={() => setIsOpenCC((prev) => !prev)}
        >
          <ControlCenter className="size-3.5 fill-white/92" />
        </TopbarIconButton>

        <TopbarPill>
          <Weather />
        </TopbarPill>

        <TopbarPill>
          <TaskbarClock />
        </TopbarPill>
      </div>

      <AnimatePresence>
        {isOpenCC && (
          <motion.div
            key="cc-panel"
            initial={{ opacity: 0, scale: 0.94, y: -8, filter: 'blur(12px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.94, y: -8, filter: 'blur(12px)' }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-2 top-7 z-[3100] max-h-[calc(100dvh-44px)] w-[351px] max-w-[calc(100vw-0.75rem)] overflow-y-auto p-[6.5px] text-white"
          >
            <div ref={ccRef} className="w-full">
              <div className="grid grid-cols-4 grid-rows-[74px_74px_74px_74px_74px_74px_28px] gap-[14px]">
                <BlurFade delay={0.04} className="col-span-2 contents">
                  <WideNetworkTile
                    className="col-span-2"
                    active={wifiEnabled}
                    icon={<FaWifi className="text-[18px]" />}
                    subtitle={wifiEnabled ? 'Home' : 'Off'}
                    title="Wi-Fi"
                    onClick={() => setWifiEnabled((prev) => !prev)}
                  />
                </BlurFade>

                <BlurFade delay={0.08} className="col-span-2 col-start-3 row-span-2 row-start-1 contents">
                  <MusicTile
                    className="col-span-2 col-start-3 row-span-2 row-start-1"
                    isPlaying={music_status === 'playing'}
                    onToggle={toggleMusic}
                  />
                </BlurFade>

                <BlurFade delay={0.12} className="col-span-2 row-start-2 contents">
                  <WideNetworkTile
                    className="col-span-2 row-start-2"
                    active={bluetoothEnabled}
                    icon={<FaBluetoothB className="text-[19px]" />}
                    subtitle={bluetoothEnabled ? 'On' : 'Off'}
                    title="Bluetooth"
                    onClick={() => setBluetoothEnabled((prev) => !prev)}
                  />
                </BlurFade>

                <BlurFade delay={0.16} className="col-span-2 row-start-3 contents">
                  <WideFocusTile
                    className="col-span-2 row-start-3"
                    active={focusEnabled}
                    onClick={() => setFocusEnabled((prev) => !prev)}
                  />
                </BlurFade>

                <BlurFade delay={0.2} className="col-start-3 row-start-3 contents">
                  <RoundToggleTile
                    className="col-start-3 row-start-3"
                    active={mirrorEnabled}
                    icon={<IconCast className="size-5" stroke={1.8} />}
                    onClick={() => setMirrorEnabled((prev) => !prev)}
                  />
                </BlurFade>

                <BlurFade delay={0.23} className="col-start-4 row-start-3 contents">
                  <RoundToggleTile
                    className="col-start-4 row-start-3"
                    active={duplicateEnabled}
                    icon={<IconRectangleDouble className="size-5" />}
                    onClick={() => setDuplicateEnabled((prev) => !prev)}
                  />
                </BlurFade>

                <BlurFade delay={0.27} className="col-span-4 row-start-4 contents">
                  <SliderTile
                    className="col-span-4 row-start-4"
                    label="Display"
                    leading={<SmallSunIcon className="size-4" />}
                    trailing={<LargeSunIcon className="size-4" />}
                    value={brightness}
                    onChange={updateBrightness}
                  />
                </BlurFade>

                <BlurFade delay={0.31} className="col-span-4 row-start-5 contents">
                  <SliderTile
                    className="col-span-4 row-start-5"
                    label="Sound"
                    leading={
                      volume > 0 ? (
                        <HiMiniSpeakerWave className="text-[16px]" />
                      ) : (
                        <HiMiniSpeakerXMark className="text-[16px]" />
                      )
                    }
                    trailing={<IconCast className="size-4" stroke={1.8} />}
                    value={volume}
                    onChange={updateVolume}
                  />
                </BlurFade>

                <BlurFade delay={0.35} className="col-span-4 row-start-6 contents">
                  <UtilityTile
                    className="col-start-1 row-start-6"
                    icon={<IoColorPaletteOutline className="text-[18px]" />}
                  />
                  <UtilityTile
                    className="col-start-2 row-start-6"
                    icon={<IoCalculatorOutline className="text-[18px]" />}
                  />
                  <UtilityTile
                    className="col-start-3 row-start-6"
                    icon={<IoPowerOutline className="text-[18px]" />}
                  />
                  <UtilityTile
                    className="col-start-4 row-start-6"
                    icon={<IoCameraOutline className="text-[18px]" />}
                  />
                </BlurFade>

                <BlurFade delay={0.39} className="col-span-4 row-start-7 contents">
                  <div className="col-span-4 row-start-7 flex items-center justify-center">
                    <button
                      className={`flex h-[28px] w-[111px] items-center justify-center rounded-full text-[12px] font-medium text-white/85 transition hover:bg-white/[0.08] ${tileClassName}`}
                      type="button"
                    >
                      Edit Controls
                    </button>
                  </div>
                </BlurFade>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function TopbarIconButton({
  active = false,
  ariaLabel,
  children,
  onClick,
}: {
  active?: boolean
  ariaLabel: string
  children: ReactNode
  onClick?: () => void
}) {
  return (
    <button
      aria-label={ariaLabel}
      className={`${topbarGlassButtonClassName} ${
        active ? 'bg-white/[0.12] text-white' : ''
      } size-[22px] px-0`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}

function TopbarPill({ children }: { children: ReactNode }) {
  return (
    <div className={`${topbarGlassButtonClassName} px-2.5 text-[12px] font-medium`}>
      {children}
    </div>
  )
}

function WideNetworkTile({
  active,
  className = '',
  icon,
  subtitle,
  title,
  onClick,
}: {
  active: boolean
  className?: string
  icon: ReactNode
  subtitle: string
  title: string
  onClick: () => void
}) {
  return (
    <button
      className={`flex items-center gap-2 rounded-full px-[18px] text-left ${tileClassName} ${className}`}
      onClick={onClick}
      type="button"
    >
      <SymbolBubble active={active}>{icon}</SymbolBubble>
      <div className="min-w-0">
        <p className="text-[14px] font-semibold tracking-[-0.2px] text-white/90">
          {title}
        </p>
        <p className="truncate text-[12px] tracking-[-0.08px] text-white/35">
          {subtitle}
        </p>
      </div>
    </button>
  )
}

function WideFocusTile({
  active,
  className = '',
  onClick,
}: {
  active: boolean
  className?: string
  onClick: () => void
}) {
  return (
    <button
      className={`flex items-center gap-2 rounded-full px-[18px] text-left ${tileClassName} ${className}`}
      onClick={onClick}
      type="button"
    >
      <SymbolBubble active={active} accent="amber">
        <IoIosMoon className="text-[18px]" />
      </SymbolBubble>
      <div className="min-w-0">
        <p className="text-[14px] font-semibold tracking-[-0.2px] text-white/90">
          Focus
        </p>
        <p className="truncate text-[12px] tracking-[-0.08px] text-white/35">
          {active ? 'On' : 'Off'}
        </p>
      </div>
    </button>
  )
}

function RoundToggleTile({
  active,
  className = '',
  icon,
  onClick,
}: {
  active: boolean
  className?: string
  icon: ReactNode
  onClick: () => void
}) {
  return (
    <button
      className={`relative flex items-center justify-center overflow-hidden rounded-full border border-white/[0.12] bg-transparent text-center text-white/90 [box-shadow:inset_1px_1px_4px_0_rgba(255,255,255,0.12),inset_-1px_-1px_4px_0_rgba(255,255,255,0.03)] backdrop-blur-[18px] transition hover:bg-white/[0.03] ${
        active ? 'border-white/[0.22] bg-white/[0.06] brightness-110' : ''
      } ${className}`}
      onClick={onClick}
      type="button"
    >
      <div className="text-white/90">{icon}</div>
    </button>
  )
}

function MusicTile({
  className = '',
  isPlaying,
  onToggle,
}: {
  className?: string
  isPlaying: boolean
  onToggle: () => void
}) {
  return (
    <div className={`rounded-[28px] px-[20px] py-[17px] ${tileClassName} ${className}`}>
      <div className="flex h-full flex-col justify-between">
        <div className="flex size-12 items-center justify-center overflow-hidden rounded-[16px] bg-white/[0.06]">
          <Image alt="" src={musicIcon} width={34} height={34} />
        </div>

        <div className="space-y-0.5">
          <p className="text-[14px] font-semibold tracking-[-0.2px] text-white/90">
            Starboy
          </p>
          <p className="truncate text-[12px] tracking-[-0.08px] text-white/35">
            The Weeknd
          </p>
        </div>

        <div className="flex items-center justify-between">
          <button
            className="text-white/75 transition hover:text-white"
            type="button"
          >
            <IconDots className="size-4" stroke={1.8} />
          </button>
          <button
            className="rounded-full bg-white/[0.08] px-3 py-1 text-[12px] font-semibold text-white transition hover:bg-white/[0.14]"
            onClick={onToggle}
            type="button"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SliderTile({
  className = '',
  label,
  leading,
  trailing,
  value,
  onChange,
}: {
  className?: string
  label: string
  leading: ReactNode
  trailing: ReactNode
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className={`rounded-[28px] px-[20px] py-[14px] ${tileClassName} ${className}`}>
      <p className="text-[14px] font-semibold tracking-[-0.2px] text-white/90">
        {label}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-white/75">{leading}</span>
        <GlassSliderTrack value={value} onChange={onChange} />
        <span className="text-white/55">{trailing}</span>
      </div>
    </div>
  )
}

function UtilityTile({
  className = '',
  icon,
}: {
  className?: string
  icon: ReactNode
}) {
  return (
    <button
      className={`flex items-center justify-center rounded-full text-white/82 transition hover:bg-white/[0.06] ${tileClassName} ${className}`}
      type="button"
    >
      {icon}
    </button>
  )
}

function SymbolBubble({
  active,
  accent = 'blue',
  children,
}: {
  active: boolean
  accent?: 'blue' | 'amber'
  children: ReactNode
}) {
  const activeClass =
    accent === 'amber'
      ? 'bg-[rgba(255,140,0,0.5)] text-white'
      : 'bg-white text-[#007aff]'

  return (
    <div
      className={`flex size-10 items-center justify-center rounded-full ${
        active
          ? activeClass
          : 'bg-[rgba(255,255,255,0.01)] text-white/85 [box-shadow:inset_1px_1px_4px_0_rgba(0,0,0,0.14),inset_-1px_-1px_6px_0_rgba(255,255,255,0.16)]'
      }`}
    >
      {children}
    </div>
  )
}

function GlassSliderTrack({
  value,
  onChange,
}: {
  value: number
  onChange: (value: number) => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)

  const updateValue = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return

    const nextValue = Math.max(
      0,
      Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)
    )

    onChange(Math.round(nextValue))
  }

  return (
    <div
      ref={trackRef}
      className="relative h-[10px] flex-1 cursor-pointer overflow-hidden rounded-full"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId)
        updateValue(event)
      }}
      onPointerMove={(event) => {
        if (event.buttons !== 1) return
        updateValue(event)
      }}
    >
      <div className="absolute inset-0 rounded-full bg-[rgba(255,255,255,0.06)]" />
      <div
        className="absolute left-[-1px] top-0 h-[10px] rounded-full bg-white transition-[width] duration-75"
        style={{ width: `calc(${value}% + 1px)` }}
      />
    </div>
  )
}

function IconRectangleDouble({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-x-[2px] top-[1px] h-[12px] rounded-[3px] border border-current opacity-60" />
      <div className="absolute inset-x-0 bottom-0 h-[12px] rounded-[3px] border border-current" />
    </div>
  )
}

function SmallSunIcon({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-[3px] rounded-full bg-current" />
    </div>
  )
}

function LargeSunIcon({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-[1px] rounded-full border border-current" />
      <div className="absolute inset-[4px] rounded-full bg-current" />
    </div>
  )
}
