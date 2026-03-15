'use client'

import notch from '@/public/assets/icons/Сhelka.svg'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { IoIosBatteryFull, IoIosMoon } from 'react-icons/io'
import { IoSearch } from 'react-icons/io5'
import { TaskbarClock } from '../taskbar/clock'
import { Weather } from '../taskbar/weather'
import { BrightnessRange } from './brightness-range'
import { ControlCenter } from './control-center'
import { connections } from './control-center-data'
import { InternetConnection } from './internet-connection'
import { SoundRange } from './sound-range'
import { useClickOutside } from '@/app/hooks/use-click-outside'
import { IconCast, IconRectangle } from '@tabler/icons-react'
import { useSelector } from '@/app/store'
import { BrandApple } from './brand-apple'
import { LiquidGlassShell } from '../ui/liquid-glass-shell'

const panelButtonClassName =
  'mac-tahoe-panel-button h-[22px] items-center rounded-full px-2 text-[13px] font-medium text-white/95 whitespace-nowrap sm:px-2.5'

const panelStatusButtonClassName =
  'mac-tahoe-panel-button h-[22px] items-center rounded-full px-2 text-white/92'

export function Topbar() {
  const [isOpenCC, setIsOpenCC] = useState(false)
  const ccRef = useRef<HTMLDivElement>(null)
  const { activeApp } = useSelector((state) => state.settings)
  const audio = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audio.current = new Audio('/assets/music/starboy.mp3')
    }
  }, [])

  useClickOutside(() => {
    setIsOpenCC(false)
  }, ccRef)

  return (
    <div className="mac-tahoe-panel-flat relative flex h-7 items-center justify-between overflow-visible px-2 text-xs font-medium text-white sm:px-4 sm:text-sm">
        <div className="relative z-10 flex h-full items-center gap-0.5 overflow-x-auto sm:gap-1">
          <BrandApple />
          <button
            className={`flex ${panelButtonClassName} font-semibold`}
            type="button"
          >
            {activeApp ? activeApp.name : 'Finder'}
          </button>
          <button className={`hidden ${panelButtonClassName} sm:flex`} type="button">
            File
          </button>
          <button className={`hidden ${panelButtonClassName} sm:flex`} type="button">
            Edit
          </button>
          <button className={`hidden ${panelButtonClassName} md:flex`} type="button">
            View
          </button>
          <button className={`hidden ${panelButtonClassName} md:flex`} type="button">
            Go
          </button>
          <button className={`hidden ${panelButtonClassName} lg:flex`} type="button">
            Window
          </button>
          <button className={`hidden ${panelButtonClassName} lg:flex`} type="button">
            Help
          </button>
        </div>
        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 hidden sm:block">
          <div className="relative">
            <Image alt="" src={notch} className="w-36" />
            <span className="absolute left-2/3 top-2 size-1 rounded-full bg-green-500" />
          </div>
        </div>
        <div className="relative z-10 flex h-full items-center gap-1 sm:gap-2">
          <div className="flex h-full items-center gap-1 sm:gap-2">
            <div className={`flex ${panelStatusButtonClassName}`}>
              <IoIosBatteryFull className="text-lg sm:text-xl" />
            </div>
            <div className={`flex ${panelStatusButtonClassName}`}>
              <InternetConnection />
            </div>
            <div className={`hidden ${panelStatusButtonClassName} sm:flex`}>
              <IoSearch className="text-[15px]" />
            </div>
            <button
              onClick={() => void setIsOpenCC((pre) => !pre)}
              className={`flex ${panelStatusButtonClassName}`}
              data-state={isOpenCC ? 'active' : undefined}
              type="button"
            >
              <ControlCenter className="size-3 sm:size-4 fill-white/90" />
            </button>
          </div>
          <div className={`flex ${panelStatusButtonClassName}`}>
            <Weather />
          </div>
          <div className={`flex ${panelStatusButtonClassName}`}>
            <TaskbarClock />
          </div>
        </div>
        {isOpenCC && (
          <LiquidGlassShell
            className="absolute right-1 top-9 z-20 sm:right-2"
            contentClassName="mac-tahoe-menu-overlay flex w-[calc(100vw-0.5rem)] max-w-sm flex-col gap-4 overflow-hidden rounded-[24px] p-3 text-white sm:w-full sm:p-4"
            displacementScale={42}
            blurAmount={0.2}
            saturation={155}
            aberrationIntensity={1.5}
            elasticity={0}
            cornerRadius={24}
            overLight
            mode="prominent"
          >
            <div ref={ccRef}>
              <div className="grid grid-cols-2 gap-4">
                <div className="mac-tahoe-surface space-y-3 rounded-[20px] border border-white/10 p-2 py-4">
                  {connections.map((c) => (
                    <div
                      key={c.id}
                      className="grid grid-cols-[auto_1fr] items-center gap-2"
                    >
                      <div className="flex size-9 items-center justify-center rounded-full bg-[#007AFF]">
                        <c.Icon className="text-xl text-white" />
                      </div>
                      <div>
                        <h2 className="font-medium text-white">{c.label}</h2>
                        <p className="text-xs text-white/65">{c.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-rows-2 gap-4">
                  <div className="mac-tahoe-surface flex items-center gap-2 rounded-[20px] border border-white/10 p-4">
                    <button
                      className="mac-tahoe-panel-button flex size-9 items-center justify-center rounded-full bg-white/5"
                      type="button"
                    >
                      <IoIosMoon className="text-xl" />
                    </button>
                    <span className="text-lg font-medium text-white">Focus</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="mac-tahoe-surface flex flex-col items-center rounded-[20px] border border-white/10 p-2">
                      <IconRectangle stroke={2} />
                      <h2 className="text-center font-medium leading-none text-white">
                        Stage Manager
                      </h2>
                    </div>
                    <div className="mac-tahoe-surface flex flex-col items-center rounded-[20px] border border-white/10 p-2">
                      <IconCast stroke={2} />
                      <h2 className="text-center font-medium leading-none text-white">
                        Stage Manager
                      </h2>
                    </div>
                  </div>
                </div>
              </div>
              <BrightnessRange />
              <SoundRange audio={audio.current} />
            </div>
          </LiquidGlassShell>
        )}
    </div>
  )
}
