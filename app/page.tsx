'use client'

import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { Draggable } from 'gsap/Draggable'
import dynamic from 'next/dynamic'
import { MouseEvent, useEffect, useRef, useState, useCallback } from 'react'
import { FaApple } from 'react-icons/fa'
import { Contact } from './components/contact'
import { Messages } from './components/messages'
import { ContextMenu } from './components/context-menu'
import { Folder } from './components/folder'
import { INotes } from './components/inotes'
import { LockScreen } from './components/lock-screen'
import { Projects } from './components/projects'
import { Settings } from './components/settings'
import { Skill } from './components/skill'
import { Terminal } from './components/terminal'
import { TrashBin } from './components/trash-bin'
import { TypingMaster } from './components/typing-master'
import { WindowFrame } from './components/window-frame'
import { BrowserFrame } from './components/window-frame/browser-frame'
import { CalculatorFrame } from './components/window-frame/calculator-frame'
import { setScreenMode } from './features/settings'
import { useDispatch, useSelector } from './store'

const PDFViewer = dynamic(
  () => import('./components/pdf-viewer').then((m) => m.PDFViewer),
  { ssr: false }
)

gsap.registerPlugin(useGSAP, Draggable)

type ScreenState = 'loading' | 'desktop' | 'lock'

const MIN_SCREEN_WIDTH = 320
const MIN_SCREEN_HEIGHT = 480

export default function Home() {
  const folders = useSelector((state) => state.windowFrame)
  const desktopFolders = folders.filter((f) => f.placement === 'desktop')
  const frames = folders.filter((folder) => folder.status !== 'close')
  const [screenSize, setScreenSize] = useState<{ w: number; h: number } | null>(
    null
  )
  const { desktop } = useSelector((state) => state.settings)
  const [ctxPosition, setCtxPosition] = useState<{ x: number; y: number } | null>(
    null
  )
  const bodyRef = useRef<HTMLDivElement>(null)
  const loaderRef = useRef<HTMLDivElement>(null)
  const dispatch = useDispatch()

  const handleContextMenu = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      
      const menuWidth = 256
      const menuHeight = 294
      const coX =
        window.innerWidth - event.clientX > menuWidth
          ? event.clientX
          : event.clientX - menuWidth
      const coY =
        window.innerHeight - event.clientY > menuHeight
          ? event.clientY
          : event.clientY - menuHeight
      setCtxPosition({ x: coX, y: coY })
    },
    []
  )

  useEffect(() => {
    const onCloseCtx = (event: globalThis.MouseEvent) => {
      if (bodyRef.current && !bodyRef.current.contains(event.target as Node)) {
        setCtxPosition(null)
      }
    }
    const onReset = () => setCtxPosition(null)

    document.addEventListener('contextmenu', onCloseCtx)
    document.addEventListener('click', onReset)
    document.addEventListener('dblclick', onReset)

    return () => {
      document.removeEventListener('contextmenu', onCloseCtx)
      document.removeEventListener('click', onReset)
      document.removeEventListener('dblclick', onReset)
    }
  }, [])

  const [screen, setScreen] = useState<ScreenState>('loading')

  useGSAP(() => {
    gsap.to(loaderRef.current, {
      width: '100%',
      duration: 2,
      onComplete: () => {
        setScreen('lock')
      },
    })
  })

  useEffect(() => {
    const onFullscreen = () => {
      dispatch(
        setScreenMode(
          document.fullscreenElement ? 'fullscreen' : 'default'
        )
      )
    }

    document.addEventListener('fullscreenchange', onFullscreen)

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreen)
    }
  }, [dispatch])

  useEffect(() => {
    const trackSize = () => {
      setScreenSize({ w: innerWidth, h: innerHeight })
    }

    window.addEventListener('resize', trackSize)
    trackSize()

    return () => {
      window.removeEventListener('resize', trackSize)
    }
  }, [])

  const sortedFolders = [...desktopFolders].sort((a, b) => {
    if (desktop.sort === 'name') {
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    }
    return 0
  })

  const isScreenSizeValid =
    screenSize &&
    screenSize.w >= MIN_SCREEN_WIDTH &&
    screenSize.h >= MIN_SCREEN_HEIGHT

  return (
    <>
      {screen === 'loading' && (
        <div className="fixed inset-0 z-9999 flex flex-col items-center justify-center gap-5 bg-black overflow-x-hidden">
          <FaApple className="text-6xl sm:text-8xl text-white" />
          <div className="h-[5px] w-36 sm:w-44 rounded-full bg-[#414141]">
            <div ref={loaderRef} className="h-full w-0 rounded-full bg-white" />
          </div>
        </div>
      )}

      {screen === 'lock' && (
        <LockScreen
          next={() => {
            setScreen('desktop')
          }}
        />
      )}

      {screen === 'desktop' && isScreenSizeValid && (
        <div
          ref={bodyRef}
          onContextMenu={handleContextMenu}
          className="h-[calc(100vh-28px)] overflow-auto"
        >
          <div
            className={`flex flex-wrap ${
              desktop.view === 'vertical'
                ? 'h-full w-fit flex-col pb-10'
                : 'h-fit w-full p-2 sm:p-4'
            }`}
          >
            {sortedFolders.map((folder) => (
              <Folder
                status={folder.status}
                onMinimizeRestore={folder.onMinimizeRestore}
                id={folder.id}
                name={folder.name}
                key={folder.name}
                type={folder.type}
              />
            ))}
          </div>

          {ctxPosition && <ContextMenu position={ctxPosition} />}

          {frames.map((frame) => {
            if (frame.type === 'browser') {
              return (
                <BrowserFrame
                  key={frame.id}
                  frame_id={frame.id}
                  status={frame.status}
                  frameName={frame.name}
                />
              )
            }

            if (frame.type === 'calculator') {
              return (
                <CalculatorFrame
                  key={frame.id}
                  frame_id={frame.id}
                  status={frame.status}
                  frameName={frame.name}
                />
              )
            }

            const enableSidebar =
              frame.id === 'skills' ||
              frame.id === 'trash' ||
              frame.id === 'inotes' ||
              frame.id === 'settings' ||
              frame.id === 'messages'

            return (
              <WindowFrame
                enableSidebar={enableSidebar}
                frame_id={frame.id}
                status={frame.status}
                frameName={frame.name}
                key={frame.id}
              >
                {frame.id === 'skills' && <Skill />}
                {frame.id === 'trash' && <TrashBin />}
                {frame.id === 'inotes' && <INotes />}
                {frame.id === 'settings' && <Settings />}
                {frame.id === 'terminal' && <Terminal />}
                {frame.id === 'projects' && <Projects />}
                {frame.id === 'typing-master' && <TypingMaster />}
                {frame.id === 'contact' && <Contact />}
                {frame.id === 'messages' && <Messages />}
                {frame.type === 'pdf' && <PDFViewer id={frame.id} />}
              </WindowFrame>
            )
          })}
        </div>
      )}

      {screen === 'desktop' && screenSize && !isScreenSizeValid && (
        <div className="fixed inset-0 z-9999 flex flex-col items-center justify-center gap-4 sm:gap-5 bg-black p-4 overflow-x-hidden">
          <h1 className="text-base sm:text-lg md:text-2xl font-medium text-white text-center">
            Screen size too small
          </h1>
          <h2 className="text-xs sm:text-sm md:text-xl font-medium text-rose-400 text-center">
            Minimum: {MIN_SCREEN_WIDTH}x{MIN_SCREEN_HEIGHT}px
          </h2>
          <h2 className="text-xs sm:text-sm md:text-xl font-medium text-gray-400 text-center">
            Current: {screenSize.w}x{screenSize.h}px
          </h2>
        </div>
      )}
    </>
  )
}
