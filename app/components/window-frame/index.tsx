'use client'

import { useGSAP } from '@gsap/react'
import {
  IconBracketsAngle,
  IconChevronLeft,
  IconChevronRight,
  IconLayoutBoard,
  IconListDetails,
  IconMinus,
  IconX,
} from '@tabler/icons-react'
import gsap from 'gsap'
import { Draggable } from 'gsap/Draggable'
import {
  createContext,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Status } from '../folder/folders'
import { useDispatch, useSelector } from '@/app/store'
import { closeFolder, minimizeFolder } from '@/app/features/window-slice'
import { Size, useResize } from '@/app/hooks/use-resize'
import { setActiveApp, setZIndex } from '@/app/features/settings'
import { useClickOutside } from '@/app/hooks/use-click-outside'
import { MacTrafficLights } from './mac-traffic-lights'

type WindowChromeContextValue = {
  frameHeader: RefObject<HTMLDivElement | null>
  isFocused: boolean
  isFullscreen: boolean
  onClose: () => void
  onMinimize: () => void
  onZoom: () => void
}

export const WindowChromeContext =
  createContext<WindowChromeContextValue | null>(null)

const DEFAULT_FRAME_SIZE: Size = { minW: 750, minH: 300 }
const MEDIA_FRAME_SIZE: Size = { minW: 720, minH: 520 }
const SETTINGS_FRAME_SIZE: Size = { minW: 500, minH: 380 }

const getSize = (frameId: string): Size => {
  if (typeof window === 'undefined') {
    if (frameId === 'inotes' || frameId === 'music') return MEDIA_FRAME_SIZE
    if (frameId === 'settings') return SETTINGS_FRAME_SIZE
    return DEFAULT_FRAME_SIZE
  }

  if (window.innerWidth < 768) {
    return {
      minW: 320,
      minH:
        frameId === 'inotes' || frameId === 'music'
          ? 480
          : frameId === 'settings'
            ? 420
            : 300,
    }
  }

  if (frameId === 'inotes' || frameId === 'music') return MEDIA_FRAME_SIZE
  if (frameId === 'settings') return SETTINGS_FRAME_SIZE
  return DEFAULT_FRAME_SIZE
}

const getInitialFrameBounds = (
  frameId: string,
  screenWidth: number,
  screenHeight: number
) => {
  if (frameId === 'inotes' || frameId === 'music') {
    const topbarHeight = 28

    if (screenWidth < 768) {
      return {
        width: screenWidth,
        height: screenHeight - topbarHeight,
        left: 0,
        top: topbarHeight,
      }
    }

    const width = Math.min(
      screenWidth - 32,
      Math.max(760, Math.round(screenWidth * 0.7))
    )
    const height = Math.min(
      screenHeight - topbarHeight - 72,
      Math.max(520, Math.round(screenHeight * 0.76))
    )

    return {
      width,
      height,
      left: Math.max(16, Math.floor((screenWidth - width) / 2)),
      top: Math.max(
        topbarHeight + 12,
        Math.floor((screenHeight - height) / 2 - 20)
      ),
    }
  }

  if (frameId === 'settings') {
    const topbarHeight = 28

    if (screenWidth < 768) {
      return {
        width: screenWidth,
        height: screenHeight - topbarHeight,
        left: 0,
        top: topbarHeight,
      }
    }

    const width = Math.min(520, screenWidth - 32)
    const height = Math.min(400, screenHeight - topbarHeight - 88)

    return {
      width,
      height,
      left: Math.max(16, Math.min(260, screenWidth - width - 24)),
      top: Math.max(
        topbarHeight + 8,
        Math.min(100, screenHeight - height - 80)
      ),
    }
  }

  const width = screenWidth < 768 ? screenWidth : Math.floor(screenWidth / 2)

  return {
    width: null,
    height: null,
    left: Math.max(0, Math.floor((screenWidth - width) / 2)),
    top: Math.max(0, Math.floor((screenHeight - 300) / 4)),
  }
}

export function WindowFrame({
  enableSidebar = true,
  children,
  frameName,
  frame_id,
  status,
}: {
  children: ReactNode
  frameName: string
  frame_id: string
  status: Status
  enableSidebar?: boolean
}) {
  const timeline = useRef<gsap.core.Timeline>(gsap.timeline())
  const frame = useRef<HTMLDivElement>(null)
  const frameHeader = useRef<HTMLDivElement>(null)
  const dispatch = useDispatch()
  const minimizeTL = useRef<gsap.core.Timeline>(gsap.timeline())
  const fullscreenTL = useRef<gsap.core.Timeline>(gsap.timeline())
  const [isFullscreen, setIsFullscreen] = useState(false)
  const dragRef = useRef<globalThis.Draggable[] | null>(null)
  const { activeApp, zIndex } = useSelector((state) => state.settings)
  const [isFocused, setIsFocused] = useState(true)
  const isNotesFrame = frame_id === 'inotes'
  const isMusicFrame = frame_id === 'music'
  const isMediaFrame = isNotesFrame || isMusicFrame
  const isSettingsFrame = frame_id === 'settings'
  const isIntegratedFrame = isSettingsFrame || isMediaFrame
  const size = getSize(frame_id)

  const { contextSafe } = useGSAP(() => {
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1920
    const screenHeight =
      typeof window !== 'undefined' ? window.innerHeight : 1080
    const initialBounds = getInitialFrameBounds(
      frame_id,
      screenWidth,
      screenHeight
    )

    if (frame.current) {
      const initialFrameStyles: gsap.TweenVars = {
        left: `${initialBounds.left}px`,
        top: `${initialBounds.top}px`,
      }

      if (initialBounds.width !== null) {
        initialFrameStyles.width = `${initialBounds.width}px`
      }

      if (initialBounds.height !== null) {
        initialFrameStyles.height = `${initialBounds.height}px`
      }

      gsap.set(frame.current, initialFrameStyles)
    }

    timeline.current.fromTo(
      frame.current,
      {
        opacity: 0,
        scale: isIntegratedFrame ? 0.92 : 0.8,
        y: isIntegratedFrame ? 18 : 0,
      },
      {
        scale: 1,
        opacity: 1,
        y: 0,
        ease: isIntegratedFrame ? 'power3.out' : 'back.inOut(1.7)',
        duration: isIntegratedFrame ? 0.28 : 0.5,
      }
    )
    dragRef.current = Draggable.create(frame.current, {
      trigger: frameHeader.current,
      zIndexBoost: false,
      dragClickables: false,
      allowEventDefault: true,
    })
  })

  const onDragEnable = () => {
    if (dragRef.current) {
      dragRef.current[0].enable()
    }
  }

  const syncPosition = () => {
    if (dragRef.current && frame.current) {
      const rect = frame.current.getBoundingClientRect()
      const left = rect.left
      const top = rect.top
      gsap.set(frame.current, { left, top, x: 0, y: 0 })
    }
  }

  const onDragDisable = () => {
    if (dragRef.current) {
      syncPosition()
      dragRef.current[0].kill()
    }
  }

  const handleZIndex = () => {
    if (frame.current) {
      dispatch(setZIndex(zIndex + 1))
      frame.current.style.zIndex = `${zIndex + 1}`
    }
  }

  const onClose = contextSafe(() => {
    dispatch(setActiveApp(null))
    timeline.current.reverse()
    timeline.current.eventCallback('onReverseComplete', () => {
      dispatch(closeFolder(frame_id))
    })
  })

  const onMinimize = contextSafe(() => {
    syncPosition()
    minimizeTL.current.to(frame.current, {
      yPercent: 100,
      scale: isSettingsFrame ? 0.6 : 0.3,
      opacity: isSettingsFrame ? 0 : 1,
      xPercent: -50,
      left: '50%',
      duration: isSettingsFrame ? 0.28 : 0.5,
      ease: isSettingsFrame ? 'power3.in' : 'expo.in',
    })
    minimizeTL.current.eventCallback('onComplete', () => {
      dispatch(
        minimizeFolder({
          id: frame_id,
          onRestore: () => {
            minimizeTL.current.reverse()
            minimizeTL.current.eventCallback('onReverseComplete', () => {
              minimizeTL.current = gsap.timeline()
            })
          },
        })
      )
    })
  })

  const onFullScreen = contextSafe(() => {
    if (frame.current instanceof HTMLDivElement) {
      if (isFullscreen) {
        fullscreenTL.current.reverse()
        fullscreenTL.current.eventCallback('onReverseComplete', () => {
          fullscreenTL.current = gsap.timeline()
          if (dragRef.current) {
            dragRef.current[0].enable()
          }
        })
        setIsFullscreen(false)
      } else {
        fullscreenTL.current.to(frame.current, {
          width: '100vw',
          height: `${innerHeight - 28 - ((isSettingsFrame || isMediaFrame) && innerWidth >= 768 ? 80 : 0)}px`,
          x: 0,
          y: 0,
          left: '0px',
          top: '28px',
          duration: isIntegratedFrame ? 0.3 : 0.5,
          ease: isIntegratedFrame ? 'power3.inOut' : 'expo.inOut',
        })
        if (dragRef.current) {
          dragRef.current[0].kill()
        }
        setIsFullscreen(true)
      }
    }
  })

  const onLeftScreen = contextSafe(() => {
    if (typeof window === 'undefined' || window.innerWidth < 768) return
    setIsFullscreen(false)
    if (frame.current instanceof HTMLDivElement) {
      const topbarHeight = 28
      fullscreenTL.current.clear()
      gsap.to(frame.current, {
        width: '50vw',
        height: `${window.innerHeight - topbarHeight}px`,
        x: 0,
        y: 0,
        left: '0px',
        top: `${topbarHeight}px`,
        duration: 0.5,
        ease: 'expo.inOut',
      })
    }
  })

  const onRightScreen = contextSafe(() => {
    if (typeof window === 'undefined' || window.innerWidth < 768) return
    setIsFullscreen(false)
    if (frame.current instanceof HTMLDivElement) {
      const topbarHeight = 28
      fullscreenTL.current.clear()
      gsap.to(frame.current, {
        width: '50vw',
        height: `${window.innerHeight - topbarHeight}px`,
        x: 0,
        y: 0,
        left: '50%',
        top: `${topbarHeight}px`,
        duration: 0.5,
        ease: 'expo.inOut',
      })
    }
  })

  const onTopScreen = contextSafe(() => {
    if (typeof window === 'undefined' || window.innerWidth < 768) return
    setIsFullscreen(false)
    if (frame.current instanceof HTMLDivElement) {
      const topbarHeight = 28
      fullscreenTL.current.clear()
      gsap.to(frame.current, {
        width: '100vw',
        height: `${(window.innerHeight - topbarHeight) / 2}px`,
        x: 0,
        y: 0,
        left: '0px',
        top: `${topbarHeight}px`,
        duration: 0.5,
        ease: 'expo.inOut',
      })
    }
  })

  const onBottomScreen = contextSafe(() => {
    if (typeof window === 'undefined' || window.innerWidth < 768) return
    setIsFullscreen(false)
    if (frame.current instanceof HTMLDivElement) {
      const topbarHeight = 28
      fullscreenTL.current.clear()
      gsap.to(frame.current, {
        width: '100vw',
        height: `${(window.innerHeight - topbarHeight) / 2}px`,
        x: 0,
        y: 0,
        left: '0px',
        top: `${(window.innerHeight - topbarHeight) / 2 + topbarHeight}px`,
        duration: 0.5,
        ease: 'expo.inOut',
      })
    }
  })

  const t = useResize({ frame, place: 't', size, onDragEnable, onDragDisable })
  const tr = useResize({
    frame,
    place: 'tr',
    size,
    onDragEnable,
    onDragDisable,
  })
  const tl = useResize({
    frame,
    place: 'tl',
    size,
    onDragEnable,
    onDragDisable,
  })
  const r = useResize({ frame, place: 'r', size, onDragEnable, onDragDisable })
  const l = useResize({ frame, place: 'l', size, onDragEnable, onDragDisable })
  const bl = useResize({
    frame,
    place: 'bl',
    size,
    onDragEnable,
    onDragDisable,
  })
  const b = useResize({ frame, place: 'b', size, onDragEnable, onDragDisable })
  const br = useResize({
    frame,
    place: 'br',
    size,
    onDragEnable,
    onDragDisable,
  })

  useClickOutside(() => {
    setIsFocused(false)
  }, frame)

  useEffect(() => {
    if (activeApp?.id === frame_id && frame.current) {
      frame.current.style.zIndex = `${zIndex}`
    }
  }, [activeApp?.id, frame_id, zIndex])

  const windowChromeValue: WindowChromeContextValue = {
    frameHeader,
    isFocused,
    isFullscreen,
    onClose,
    onMinimize,
    onZoom: onFullScreen,
  }

  const frameSurfaceClass = isMediaFrame
    ? `min-h-[480px] ${isFullscreen ? 'rounded-none' : 'rounded-none md:rounded-xl'} border border-black/10 bg-white text-zinc-900 dark:border-white/10 dark:bg-[#1e1e1e] dark:text-white ${
        isFocused
          ? 'shadow-[0_28px_80px_rgba(0,0,0,0.48)]'
          : 'shadow-[0_14px_40px_rgba(0,0,0,0.3)]'
      }`
    : isSettingsFrame
      ? `min-h-[380px] rounded-none border border-black/10 bg-white/82 backdrop-blur-[40px] backdrop-saturate-150 md:rounded-[20px] dark:border-white/10 dark:bg-[rgba(25,25,28,0.88)] ${
          isFocused
            ? 'shadow-[0_32px_100px_rgba(0,0,0,0.75),0_0_0_1px_rgba(255,255,255,0.05)]'
            : 'shadow-[0_14px_40px_rgba(0,0,0,0.45)]'
        }`
      : 'h-1/2 rounded-[21.33px] bg-white/20 shadow-2xl backdrop-blur-xl sm:w-2/4 sm:min-w-[750px]'

  return (
    <div
      aria-label={`${frameName} window`}
      onContextMenu={(e) => {
        e.stopPropagation()
      }}
      onMouseDown={() => {
        dispatch(setActiveApp({ id: frame_id, name: frameName }))
        handleZIndex()
        setIsFocused(true)
      }}
      ref={frame}
      className={`absolute min-h-[300px] w-full max-w-full min-w-0 overflow-hidden ${frameSurfaceClass} ${
        isIntegratedFrame || isFocused ? 'brightness-100' : 'brightness-90'
      } ${status === 'minimize' ? 'hidden' : ''}`}
    >
      <div className="relative h-full">
        {!isFullscreen && (
          <>
            <div
              ref={t}
              className="absolute top-0 z-10 h-1 w-full cursor-ns-resize bg-transparent"
            />
            <div
              ref={b}
              className="absolute bottom-0 z-10 h-1 w-full cursor-ns-resize bg-transparent"
            />
            <div
              ref={r}
              className="absolute right-0 z-10 h-full w-1 cursor-ew-resize bg-transparent"
            />
            <div
              ref={l}
              className="absolute left-0 z-10 h-full w-1 cursor-ew-resize bg-transparent"
            />
            <div
              ref={tl}
              className="absolute top-0 left-0 z-20 size-2 cursor-nwse-resize bg-transparent"
            />
            <div
              ref={tr}
              className="absolute top-0 right-0 z-20 size-2 cursor-nesw-resize bg-transparent"
            />
            <div
              ref={bl}
              className="absolute bottom-0 left-0 z-20 size-2 cursor-nesw-resize bg-transparent"
            />
            <div
              ref={br}
              className="absolute right-0 bottom-0 z-20 size-2 cursor-nwse-resize bg-transparent"
            />
          </>
        )}
        <div
          ref={isIntegratedFrame ? undefined : frameHeader}
          onDoubleClick={onFullScreen}
          className={`cursor-custom-auto! relative grid ${
            isIntegratedFrame
              ? 'hidden'
              : 'grid-cols-[auto_1fr] sm:grid-cols-[200px_1fr] lg:grid-cols-[250px_1fr]'
          }`}
        >
          <div
            className={`group flex items-center ${
              isIntegratedFrame
                ? ''
                : `p-3 ${
                    isNotesFrame
                      ? 'bg-[#252734]'
                      : enableSidebar
                        ? 'bg-light-foreground dark:bg-dark-foreground'
                        : 'bg-light-background dark:bg-dark-background'
                  }`
            }`}
          >
            {isIntegratedFrame ? (
              <MacTrafficLights
                appName={frameName}
                isFullscreen={isFullscreen}
                onClose={onClose}
                onMinimize={onMinimize}
                onZoom={onFullScreen}
              />
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="cursor-custom-auto! p-1"
                  type="button"
                >
                  <div className="size-3 rounded-full bg-rose-500">
                    <IconX className="size-full text-black opacity-0 group-hover:opacity-100" />
                  </div>
                </button>
                <button
                  onClick={onMinimize}
                  className="cursor-custom-auto! p-1"
                  type="button"
                >
                  <div className="size-3 rounded-full bg-yellow-500">
                    <IconMinus className="size-full text-black opacity-0 group-hover:opacity-100" />
                  </div>
                </button>
                <button
                  onClick={onFullScreen}
                  className="group/fullscreen cursor-custom-auto! relative p-1"
                  type="button"
                >
                  <div className="size-3 rounded-full bg-green-500">
                    <IconBracketsAngle className="size-full -rotate-45 text-black opacity-0 group-hover:opacity-100" />
                  </div>
                  <div
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                    className="invisible absolute top-7 -left-5 z-1000 transition-all delay-200 group-hover/fullscreen:visible"
                  >
                    <div className="relative w-56 rounded-md border-2 border-[#e1e1e1] bg-[#f3f3f3] p-2 shadow-xl dark:border-[#3e3e3e] dark:bg-[#181818]">
                      <span className="absolute -top-[9px] left-5 block size-4 rotate-45 rounded-tl border-t-2 border-l-2 border-[#e1e1e1] bg-[#f3f3f3] dark:border-[#3e3e3e] dark:bg-[#181818]" />
                      <h2 className="text-start text-sm font-medium text-[#afafaf]">
                        Move & Resize
                      </h2>
                      <div className="grid grid-cols-4 items-center gap-5 p-4">
                        <div
                          onClick={onLeftScreen}
                          className="border-dark-background dark:border-light-background/80 flex h-5 justify-start rounded-sm border-2 p-px"
                        >
                          <div className="bg-dark-background dark:bg-light-background/80 h-full w-1/2 rounded-xs"></div>
                        </div>
                        <div
                          onClick={onRightScreen}
                          className="border-dark-background dark:border-light-background/80 flex h-5 justify-end rounded-sm border-2 p-px"
                        >
                          <div className="bg-dark-background dark:bg-light-background/80 h-full w-1/2 rounded-xs"></div>
                        </div>
                        <div
                          onClick={onTopScreen}
                          className="border-dark-background dark:border-light-background/80 flex h-5 items-start rounded-sm border-2 p-px"
                        >
                          <div className="bg-dark-background dark:bg-light-background/80 h-1/2 w-full rounded-xs"></div>
                        </div>
                        <div
                          onClick={onBottomScreen}
                          className="border-dark-background dark:border-light-background/80 flex h-5 items-end rounded-sm border-2 p-px"
                        >
                          <div className="bg-dark-background dark:bg-light-background/80 h-1/2 w-full rounded-xs"></div>
                        </div>
                      </div>
                      <div className="mb-1 h-px bg-[#bbb] dark:bg-[#5b5b5b]" />
                      <div>
                        <div
                          onClick={onFullScreen}
                          className="bg-primary flex w-full items-center justify-between rounded-md px-2 py-[2px] text-sm text-white"
                        >
                          <span>
                            {isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
                          </span>
                          <IconChevronRight stroke={2} className="size-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              </>
            )}
          </div>
          {!enableSidebar && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <h3 className="truncate text-[13px] font-semibold text-zinc-800 dark:text-white/90">
                {frameName}
              </h3>
            </div>
          )}
          <div
            className={
              isIntegratedFrame
                ? 'flex min-w-[60px] items-center justify-end'
                : `text-light-text items-center px-2 sm:px-4 ${
                    isNotesFrame
                      ? 'bg-[#252734] text-[#eef2ff]'
                      : 'bg-light-background dark:bg-dark-background dark:text-dark-text'
                  } ${enableSidebar ? 'grid grid-cols-[1fr_auto] justify-between' : 'flex justify-end'}`
            }
          >
            {!isSettingsFrame && enableSidebar && (
              <div
                className={`cursor-custom-auto! flex items-center gap-1 sm:gap-2 ${
                  isNotesFrame
                    ? 'text-[#c7cfea]'
                    : 'text-dark-primary dark:text-light-primary'
                }`}
              >
                <div className="flex items-center">
                  <button className="hidden sm:block">
                    <IconChevronLeft stroke={2} />
                  </button>
                  <button className="hidden sm:block">
                    <IconChevronRight stroke={2} />
                  </button>
                </div>
                <h3 className="truncate text-xs font-semibold sm:text-base">
                  {frameName}
                </h3>
              </div>
            )}
            {!isSettingsFrame && (
              <div
                className={`flex items-center gap-2 ${isNotesFrame ? 'text-[#8f96b8]' : 'text-[#8d8d8d]'}`}
              >
                <button aria-label="List view" type="button">
                  <IconListDetails stroke={2} />
                </button>
                <button aria-label="Board view" type="button">
                  <IconLayoutBoard stroke={2} />
                </button>
              </div>
            )}
          </div>
        </div>
        <div
          className={`${isIntegratedFrame ? 'h-full max-h-full' : 'h-full max-h-[calc(100%-44px)]'} ${
            isMediaFrame
              ? 'bg-transparent text-zinc-900 dark:text-white'
              : isSettingsFrame
                ? 'bg-transparent text-zinc-900 dark:text-white'
                : 'bg-light-background text-light-text dark:bg-dark-background dark:text-dark-text'
          }`}
        >
          <WindowChromeContext.Provider value={windowChromeValue}>
            {children}
          </WindowChromeContext.Provider>
        </div>
      </div>
    </div>
  )
}
