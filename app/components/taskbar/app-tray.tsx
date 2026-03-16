'use client'

import { setZIndex } from '@/app/features/settings'
import { minimizeFolder, openFolder, FolderControler } from '@/app/features/window-slice'
import { useDispatch, useSelector } from '@/app/store'
import { newIconSrc } from '@/app/utils/icon-paths'
import acrobat from '@/public/assets/icons/Acrobat.png'
import typingMaterIcon from '@/public/assets/icons/typing-master.png'
import { IconBrandGithub } from '@tabler/icons-react'
import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { isDesktopDevice } from './dock-magnification'
import { DockItem } from './dock-item'
import { LiquidGlassShell } from '../ui/liquid-glass-shell'

const NEW_STYLE_DOCK_ICON_CLASS = 'object-contain object-center p-[4px] sm:p-[5px]'

const getFolderIcon = (type: string, id: string): string | null => {
  if (type === 'folder') {
    if (id === 'settings') return newIconSrc.settings
    if (id === 'contact') return newIconSrc.contact
    if (id === 'trash') return newIconSrc.trash
    if (id === 'inotes') return newIconSrc.notes
    if (id === 'terminal') return newIconSrc.terminal
    if (id === 'typing-master') return typingMaterIcon.src
    if (id === 'messages') return newIconSrc.messages
    return newIconSrc.folder
  }
  if (type === 'browser') return newIconSrc.safari
  if (type === 'calculator') return newIconSrc.calculator
  if (type === 'pdf') return acrobat.src
  return newIconSrc.folder
}

const isNewStyleIcon = (iconSrc: string) =>
  iconSrc.startsWith('/assets/new%20icon%20style/')

interface DockIcon {
  id: string
  type: 'static' | 'folder' | 'link'
  name: string
  iconSrc: string | null
  folder?: FolderControler
  href?: string
  onClick?: () => void
  showIndicator?: boolean
  customClassName?: string
}

const HIDDEN_DOCK_THRESHOLD = 30

export default function AppTray() {
  const folders = useSelector((state) => state.windowFrame)
  const minimizeFolders = folders.filter(
    (folder) => folder.status !== 'close' && folder.placement === 'desktop'
  )
  const dispatch = useDispatch()
  const taskbarApps = folders.filter((f) => f.placement === 'taskbar')
  const { zIndex } = useSelector((state) => state.settings)

  const [mouseX, setMouseX] = useState<number | null>(null)
  const [mouseY, setMouseY] = useState(0)
  const [bodyHeight, setBodyHeight] = useState(0)
  const [isDesktop, setIsDesktop] = useState(true)
  const [isDockHidden, setIsDockHidden] = useState(false)
  const dockContainerRef = useRef<HTMLDivElement>(null)
  const dockElRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsDesktop(isDesktopDevice())
    const mediaQuery = window.matchMedia('(min-width: 768px) and (pointer: fine)')
    const handleChange = () => setIsDesktop(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    const updateBodyHeight = () => setBodyHeight(window.innerHeight)
    updateBodyHeight()
    window.addEventListener('resize', updateBodyHeight)
    return () => window.removeEventListener('resize', updateBodyHeight)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => setMouseY(e.clientY)
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    const dockHeight = dockElRef.current?.clientHeight ?? 0
    const distanceFromBottom = Math.abs(mouseY - bodyHeight)

    if (distanceFromBottom > dockHeight) setMouseX(null)

    if (mouseX !== null) {
      setIsDockHidden(false)
      return
    }

    const hasFullscreenApp = false
    if (!hasFullscreenApp) {
      setIsDockHidden(false)
      return
    }

    setIsDockHidden(distanceFromBottom > HIDDEN_DOCK_THRESHOLD)
  }, [mouseX, mouseY, bodyHeight])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDesktop) return
      setMouseX(e.clientX)
    },
    [isDesktop]
  )

  const handleMouseLeave = useCallback(() => {
    if (!isDesktop) return
    setMouseX(null)
  }, [isDesktop])

  const handleFolderClick = useCallback(
    (folder: FolderControler) => {
      if (folder.status === 'open') {
        dispatch(minimizeFolder({ id: folder.id, onRestore: folder.onMinimizeRestore || (() => {}) }))
      } else {
        dispatch(setZIndex(zIndex + 1))
        dispatch(openFolder(folder.id))
        folder.onMinimizeRestore?.()
      }
    },
    [dispatch, zIndex]
  )

  const dockIcons = useMemo<DockIcon[]>(() => {
    const icons: DockIcon[] = [
      {
        id: 'finder',
        type: 'static',
        name: 'Finder',
        iconSrc: newIconSrc.finder,
        customClassName: NEW_STYLE_DOCK_ICON_CLASS,
      },
    ]

    taskbarApps.forEach((folder) => {
      const iconSrc = getFolderIcon(folder.type, folder.id)

      if (iconSrc) {
        icons.push({
          id: folder.id,
          type: 'folder',
          name: folder.name,
          iconSrc,
          folder,
          onClick: () => handleFolderClick(folder),
          showIndicator: folder.status === 'open' || folder.status === 'minimize',
          customClassName: isNewStyleIcon(iconSrc)
            ? NEW_STYLE_DOCK_ICON_CLASS
            : undefined,
        })
      }
    })

    minimizeFolders.forEach((folder) => {
      const iconSrc =
        folder.type === 'folder' && folder.id === 'typing-master'
          ? typingMaterIcon.src
          : folder.type === 'pdf'
            ? acrobat.src
            : newIconSrc.folder

      icons.push({
        id: folder.id,
        type: 'folder',
        name: folder.name,
        iconSrc,
        folder,
        onClick: () => {
          if (folder.status === 'open') return
          dispatch(openFolder(folder.id))
          folder.onMinimizeRestore?.()
        },
        showIndicator: true,
        customClassName:
          folder.type === 'pdf' || folder.id === 'typing-master'
            ? 'object-cover object-center p-[6px]'
            : isNewStyleIcon(iconSrc)
              ? NEW_STYLE_DOCK_ICON_CLASS
              : 'object-cover object-center',
      })
    })

    icons.push({ id: 'github', type: 'link', name: 'Github', iconSrc: null, href: 'https://github.com/Mehdidjah' })

    return icons
  }, [taskbarApps, minimizeFolders, handleFolderClick, dispatch])

  return (
    <div
      ref={dockContainerRef}
      className="pointer-events-none fixed inset-x-0 bottom-[18px] z-40 flex justify-center sm:bottom-6"
    >
      <div
        ref={dockElRef}
        className={`relative transition-transform duration-200 ease-in-out ${isDockHidden ? 'translate-y-[200%]' : ''}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ position: 'relative' }}
      >
        <LiquidGlassShell
          contentClassName="mac-tahoe-dock-overlay pointer-events-auto relative flex h-[78px] items-end overflow-visible rounded-[23px] px-[7px] py-[10px]"
          hideOutline
          displacementScale={44}
          blurAmount={0.18}
          saturation={158}
          aberrationIntensity={1.45}
          elasticity={0}
          cornerRadius={23}
          mode="prominent"
        >
          <div
            className="relative z-10 flex h-full items-end justify-center gap-[3px]"
            style={{ overflow: 'visible' }}
          >
            {dockIcons.map((icon) => {
              if (icon.type === 'link' && icon.href) {
                return (
                  <DockItem key={icon.id} mouseX={isDesktop ? mouseX : null} iconSrc={null} name={icon.name} href={icon.href} isLink>
                    <IconBrandGithub stroke={1.4} className="size-8 text-white/95" />
                  </DockItem>
                )
              }

              if (!icon.iconSrc) return null

              return (
                <DockItem
                  key={icon.id}
                  mouseX={isDesktop ? mouseX : null}
                  iconSrc={icon.iconSrc}
                  name={icon.name}
                  onClick={icon.onClick}
                  showIndicator={icon.showIndicator}
                  customClassName={icon.customClassName}
                />
              )
            })}
          </div>
        </LiquidGlassShell>
      </div>
    </div>
  )
}
