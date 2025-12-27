'use client'

import { setZIndex } from '@/app/features/settings'
import { minimizeFolder, openFolder, FolderControler } from '@/app/features/window-slice'
import { useDispatch, useSelector } from '@/app/store'
import acrobat from '@/public/assets/icons/Acrobat.png'
import calculator from '@/public/assets/icons/calculator.png'
import contactIcon from '@/public/assets/icons/Contacts.png'
import finder from '@/public/assets/icons/Finder.png'
import folderIcon from '@/public/assets/icons/Folder.png'
import messageIcon from '@/public/assets/icons/Messages.png'
import notes from '@/public/assets/icons/Notes.png'
import safari from '@/public/assets/icons/Safari.png'
import settings from '@/public/assets/icons/Settings.png'
import terminalIcon from '@/public/assets/icons/Terminal.png'
import trashEmpty from '@/public/assets/icons/TrashEmpty.png'
import trashFull from '@/public/assets/icons/TrashFull.png'
import typingMaterIcon from '@/public/assets/icons/typing-master.png'
import { IconBrandGithub } from '@tabler/icons-react'
import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { isDesktopDevice } from './dock-magnification'
import { DockItem } from './dock-item'

const getFolderIcon = (type: string, id: string): string | null => {
  if (type === 'folder') {
    if (id === 'settings') return settings.src
    if (id === 'contact') return contactIcon.src
    if (id === 'trash') return null
    if (id === 'inotes') return notes.src
    if (id === 'terminal') return terminalIcon.src
    if (id === 'typing-master') return typingMaterIcon.src
    if (id === 'messages') return messageIcon.src
    return folderIcon.src
  }
  if (type === 'browser') return safari.src
  if (type === 'calculator') return calculator.src
  if (type === 'pdf') return acrobat.src
  return folderIcon.src
}

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
  const trashItems = useSelector((state) => state.trash.items).length
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
      { id: 'finder', type: 'static', name: 'Finder', iconSrc: finder.src },
    ]

    taskbarApps.forEach((folder) => {
      const iconSrc =
        folder.type === 'folder' && folder.id === 'trash'
          ? trashItems > 0
            ? trashFull.src
            : trashEmpty.src
          : getFolderIcon(folder.type, folder.id)

      if (iconSrc) {
        icons.push({
          id: folder.id,
          type: 'folder',
          name: folder.name,
          iconSrc,
          folder,
          onClick: () => handleFolderClick(folder),
          showIndicator: folder.status === 'open' || folder.status === 'minimize',
        })
      }
    })

    minimizeFolders.forEach((folder) => {
      const iconSrc =
        folder.type === 'folder' && folder.id === 'typing-master'
          ? typingMaterIcon.src
          : folder.type === 'pdf'
            ? acrobat.src
            : folderIcon.src

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
            : 'object-cover object-center',
      })
    })

    icons.push({ id: 'github', type: 'link', name: 'Github', iconSrc: null, href: 'https://github.com/Mehdidjah' })

    return icons
  }, [taskbarApps, minimizeFolders, trashItems, handleFolderClick, dispatch])

  return (
    <div
      ref={dockContainerRef}
      className="pointer-events-none fixed bottom-0 left-0 flex w-full justify-center pb-3"
      style={{ height: '5.2rem', paddingBottom: '0.7rem' }}
    >
      <div
        ref={dockElRef}
        className={`pointer-events-auto flex items-end gap-1 rounded-3xl bg-white dark:bg-black p-2 shadow-[inset_0_0_0_0.2px_rgba(0,0,0,0.1),0_0_0_0.2px_rgba(0,0,0,0.1),rgba(0,0,0,0.3)_2px_5px_19px_7px] backdrop-blur-md transition-transform duration-300 ease-in-out ${isDockHidden ? 'translate-y-[200%]' : ''}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ position: 'relative', height: '100%' }}
      >
        <div className="absolute inset-0 rounded-3xl backdrop-blur-md" style={{ zIndex: -1, margin: '1px', width: 'calc(100% - 2px)', height: 'calc(100% - 2px)' }} />
        <div className="flex items-end gap-1" style={{ overflow: 'visible' }}>
          {dockIcons.map((icon) => {
            if (icon.type === 'link' && icon.href) {
              return (
                <DockItem key={icon.id} mouseX={isDesktop ? mouseX : null} iconSrc={null} name={icon.name} href={icon.href} isLink>
                  <IconBrandGithub stroke={1} className="size-10 text-dark-text" />
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
      </div>
    </div>
  )
}