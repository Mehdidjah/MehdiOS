'use client'

import { openUrlTab } from '@/app/features/chrome'
import { setActiveApp, setZIndex } from '@/app/features/settings'
import { cleanTrash, removeFromTrash } from '@/app/features/trash'
import {
  closeFolder,
  minimizeFolder,
  openFolder,
  restoreFolder,
} from '@/app/features/window-slice'
import { Size, useResize } from '@/app/hooks/use-resize'
import { useDispatch, useSelector } from '@/app/store'
import { useGSAP } from '@gsap/react'
import {
  IconChevronLeft,
  IconChevronRight,
  IconColumns3,
  IconDots,
  IconLayoutGrid,
  IconListDetails,
  IconPlus,
  IconSearch,
} from '@tabler/icons-react'
import gsap from 'gsap'
import { Draggable } from 'gsap/Draggable'
import Image, { StaticImageData } from 'next/image'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { projects } from '../projects/projects'
import { useClickOutside } from '@/app/hooks/use-click-outside'
import { Folder, Status } from '../folder/folders'
import acrobat from '@/public/assets/icons/Acrobat.png'
import typingMasterIcon from '@/public/assets/icons/typing-master.png'
import { newIconSrc } from '@/app/utils/icon-paths'
import {
  FinderSidebarIcon,
  type FinderSidebarIconName,
} from './finder-sidebar-icon'
import { MacTrafficLights } from './mac-traffic-lights'

type FinderLocationId = 'projects' | 'trash'
type FinderViewMode = 'list' | 'grid' | 'columns'

type FinderLocation = {
  id: FinderLocationId
  label: string
  description: string
  icon: FinderSidebarIconName
}

type FinderItem = {
  id: string
  name: string
  meta: string
  detail: string
  description: string
  accent: string
  initials?: string
  thumbnail?: StaticImageData
  source?: 'project' | 'trash'
  trashItem?: Folder
  onOpen?: () => void
}

const FINDER_FRAME_SIZE: Size = { minW: 720, minH: 500 }

const FINDER_LOCATIONS: FinderLocation[] = [
  {
    id: 'projects',
    label: 'Projects',
    description: 'Shipped work, experiments, and product case studies.',
    icon: 'recents',
  },
  {
    id: 'trash',
    label: 'Trash',
    description: 'Items removed from the desktop that can still be recovered.',
    icon: 'downloads',
  },
]

const getFinderSize = () => {
  if (typeof window === 'undefined') {
    return FINDER_FRAME_SIZE
  }

  if (window.innerWidth < 768) {
    return {
      minW: 320,
      minH: 420,
    }
  }

  return FINDER_FRAME_SIZE
}

const getInitialFrameBounds = (screenWidth: number, screenHeight: number) => {
  const topbarHeight = 28

  if (screenWidth < 768) {
    return {
      width: screenWidth,
      height: screenHeight - topbarHeight,
      left: 0,
      top: topbarHeight,
    }
  }

  return {
    width: 740,
    height: 500,
    left: 80,
    top: 56,
  }
}

const toHostName = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

const toTrashKind = (item: Folder) => {
  if (item.type === 'pdf') return 'PDF'
  if (item.type === 'calculator' || item.type === 'browser') return 'App'
  return 'Folder'
}

const getTrashIcon = (item: Folder) => {
  if (item.type === 'pdf') {
    return acrobat
  }

  if (item.id === 'typing-master') {
    return typingMasterIcon
  }

  return newIconSrc.folder
}

export function FinderFrame({
  frame_id,
  status,
}: {
  frame_id: string
  status: Status
}) {
  const timeline = useRef<gsap.core.Timeline>(gsap.timeline())
  const frame = useRef<HTMLDivElement>(null)
  const frameHeader = useRef<HTMLDivElement>(null)
  const windowActionsMenu = useRef<HTMLDivElement>(null)
  const minimizeTL = useRef<gsap.core.Timeline>(gsap.timeline())
  const fullscreenTL = useRef<gsap.core.Timeline>(gsap.timeline())
  const dragRef = useRef<globalThis.Draggable[] | null>(null)
  const dispatch = useDispatch()
  const { activeApp, zIndex } = useSelector((state) => state.settings)
  const trashItems = useSelector((state) => state.trash.items)
  const [isFocused, setIsFocused] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isWindowActionsOpen, setIsWindowActionsOpen] = useState(false)
  const [viewMode, setViewMode] = useState<FinderViewMode>('list')
  const initialLocation = FINDER_LOCATIONS.some(
    (location) => location.id === frame_id
  )
    ? (frame_id as FinderLocationId)
    : 'projects'
  const [tabs, setTabs] = useState([{ id: 0, location: initialLocation }])
  const [activeTabId, setActiveTabId] = useState(0)
  const [navigationStack, setNavigationStack] = useState<FinderLocationId[]>([
    initialLocation,
  ])
  const [navigationIndex, setNavigationIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const size = getFinderSize()

  const currentLocationId = navigationStack[navigationIndex]
  const currentLocation =
    FINDER_LOCATIONS.find((location) => location.id === currentLocationId) ||
    FINDER_LOCATIONS[0]

  const { contextSafe } = useGSAP(() => {
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1920
    const screenHeight =
      typeof window !== 'undefined' ? window.innerHeight : 1080
    const initialBounds = getInitialFrameBounds(screenWidth, screenHeight)

    if (frame.current) {
      gsap.set(frame.current, {
        left: `${initialBounds.left}px`,
        top: `${initialBounds.top}px`,
        width: `${initialBounds.width}px`,
        height: `${initialBounds.height}px`,
      })
    }

    timeline.current.fromTo(
      frame.current,
      {
        opacity: 0,
        scale: 0.9,
        y: 20,
      },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        ease: 'power2.out',
        duration: 0.25,
      }
    )

    dragRef.current = Draggable.create(frame.current, {
      trigger: frameHeader.current,
      zIndexBoost: false,
      dragClickables: false,
      allowEventDefault: true,
    })
  })

  const syncPosition = () => {
    if (dragRef.current && frame.current) {
      const rect = frame.current.getBoundingClientRect()
      gsap.set(frame.current, {
        left: rect.left,
        top: rect.top,
        x: 0,
        y: 0,
      })
    }
  }

  const onDragEnable = () => {
    if (dragRef.current) {
      dragRef.current[0].enable()
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
    timeline.current.reverse()
    timeline.current.eventCallback('onReverseComplete', () => {
      dispatch(setActiveApp(null))
      dispatch(closeFolder(frame_id))
    })
  })

  const onMinimize = contextSafe(() => {
    syncPosition()
    minimizeTL.current.to(frame.current, {
      yPercent: 100,
      scale: 0.3,
      xPercent: -50,
      left: '50%',
      duration: 0.5,
      ease: 'expo.in',
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
    if (!(frame.current instanceof HTMLDivElement)) return

    if (isFullscreen) {
      fullscreenTL.current.reverse()
      fullscreenTL.current.eventCallback('onReverseComplete', () => {
        fullscreenTL.current = gsap.timeline()
        if (dragRef.current) {
          dragRef.current[0].enable()
        }
      })
      setIsFullscreen(false)
      return
    }

    fullscreenTL.current.to(frame.current, {
      width: '100vw',
      height: `${window.innerHeight - (window.innerWidth < 768 ? 28 : 80)}px`,
      x: 0,
      y: 0,
      left: '0px',
      top: '28px',
      duration: 0.5,
      ease: 'expo.inOut',
    })

    if (dragRef.current) {
      dragRef.current[0].kill()
    }

    setIsFullscreen(true)
  })

  const onLeftScreen = contextSafe(() => {
    if (typeof window === 'undefined' || window.innerWidth < 768) return
    setIsFullscreen(false)
    fullscreenTL.current.clear()
    gsap.to(frame.current, {
      width: '50vw',
      height: `${window.innerHeight - 80}px`,
      x: 0,
      y: 0,
      left: '0px',
      top: '28px',
      duration: 0.5,
      ease: 'expo.inOut',
    })
  })

  const onRightScreen = contextSafe(() => {
    if (typeof window === 'undefined' || window.innerWidth < 768) return
    setIsFullscreen(false)
    fullscreenTL.current.clear()
    gsap.to(frame.current, {
      width: '50vw',
      height: `${window.innerHeight - 80}px`,
      x: 0,
      y: 0,
      left: '50%',
      top: '28px',
      duration: 0.5,
      ease: 'expo.inOut',
    })
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

  useClickOutside(() => {
    setIsWindowActionsOpen(false)
  }, windowActionsMenu)

  useEffect(() => {
    if (activeApp?.id === frame_id && frame.current) {
      frame.current.style.zIndex = `${zIndex}`
    }
  }, [activeApp?.id, frame_id, zIndex])

  useEffect(() => {
    setSelectedItemId(null)
  }, [currentLocationId, searchQuery, viewMode])

  useEffect(() => {
    setTabs((currentTabs) =>
      currentTabs.map((tab) =>
        tab.id === activeTabId ? { ...tab, location: currentLocationId } : tab
      )
    )
  }, [activeTabId, currentLocationId])

  const navigateTo = (locationId: FinderLocationId) => {
    if (locationId === currentLocationId) return

    const nextStack = [
      ...navigationStack.slice(0, navigationIndex + 1),
      locationId,
    ]
    setNavigationStack(nextStack)
    setNavigationIndex(nextStack.length - 1)
    setSelectedItemId(null)
    setSearchQuery('')
  }

  const navigateHistory = (direction: 'back' | 'forward') => {
    const nextIndex =
      direction === 'back' ? navigationIndex - 1 : navigationIndex + 1

    if (nextIndex < 0 || nextIndex >= navigationStack.length) return

    setNavigationIndex(nextIndex)
    setSelectedItemId(null)
  }

  const addTab = () => {
    const id = Date.now()
    setTabs((currentTabs) => [
      ...currentTabs,
      { id, location: currentLocationId },
    ])
    setActiveTabId(id)
  }

  const selectTab = (id: number, location: FinderLocationId) => {
    setActiveTabId(id)
    setNavigationStack([location])
    setNavigationIndex(0)
    setSelectedItemId(null)
    setSearchQuery('')
  }

  const openProject = (projectIndex: number) => {
    const project = projects[projectIndex]

    if (!project) return

    dispatch(setZIndex(zIndex + 1))
    dispatch(openFolder('chrome'))
    dispatch(openUrlTab({ title: project.title, live_url: project.live_url }))
    dispatch(setActiveApp({ id: 'chrome', name: 'Safari' }))
  }

  const restoreTrashItem = (item: Folder) => {
    dispatch(restoreFolder(item))
    dispatch(removeFromTrash({ id: item.id, name: item.name }))
    dispatch(openFolder(item.id))
  }

  const projectItems: FinderItem[] = projects.map((project, index) => ({
    id: `project-${project.id}`,
    name: project.title,
    meta: 'Web project',
    detail: toHostName(project.live_url),
    description: project.description,
    accent: 'from-[#2a67e8] to-[#7cc5ff]',
    thumbnail: project.thumbnail,
    source: 'project',
    onOpen: () => openProject(index),
  }))

  const trashFinderItems: FinderItem[] = trashItems.map((item) => ({
    id: `trash-${item.id}-${item.name}`,
    name: item.name,
    meta: toTrashKind(item),
    detail: item.placement === 'desktop' ? 'Desktop' : 'Dock',
    description: `${item.name} can be restored from Trash at any time.`,
    accent:
      item.type === 'pdf'
        ? 'from-[#dc2626] to-[#fb7185]'
        : 'from-[#2f74c0] to-[#7dd3fc]',
    source: 'trash',
    trashItem: item,
    onOpen: () => restoreTrashItem(item),
  }))

  let items = projectItems
  let columnLabels = {
    primary: 'Name',
    secondary: 'Kind',
    tertiary: 'Location',
  }

  if (currentLocationId === 'trash') {
    items = trashFinderItems
    columnLabels = {
      primary: 'Name',
      secondary: 'Kind',
      tertiary: 'Source',
    }
  }

  const filteredItems = items.filter((item) => {
    const haystack =
      `${item.name} ${item.meta} ${item.detail} ${item.description}`.toLowerCase()
    return haystack.includes(searchQuery.trim().toLowerCase())
  })

  const selectedItem =
    filteredItems.find((item) => item.id === selectedItemId) ??
    filteredItems[0] ??
    null
  const canGoBack = navigationIndex > 0
  const canGoForward = navigationIndex < navigationStack.length - 1
  const itemCountLabel = `${filteredItems.length} item${filteredItems.length === 1 ? '' : 's'}`

  const primaryActionLabel =
    currentLocationId === 'trash'
      ? selectedItem?.trashItem
        ? 'Put Back'
        : null
      : selectedItem?.onOpen
        ? 'Open'
        : null

  const runPrimaryAction = () => {
    if (currentLocationId === 'trash' && !selectedItem?.trashItem) {
      dispatch(cleanTrash())
      return
    }

    selectedItem?.onOpen?.()
  }

  return (
    <div
      aria-label="Finder window"
      onContextMenu={(event) => event.stopPropagation()}
      onMouseDown={() => {
        dispatch(setActiveApp({ id: frame_id, name: 'Finder' }))
        handleZIndex()
        setIsFocused(true)
      }}
      ref={frame}
      className={`absolute min-h-[420px] max-w-full min-w-0 overflow-hidden border border-white/15 bg-[rgba(25,25,28,0.88)] text-[#f5f5f7] backdrop-blur-[40px] ${
        isFullscreen ? 'rounded-none' : 'rounded-none md:rounded-[20px]'
      } ${
        isFocused
          ? 'shadow-[0_32px_100px_rgba(0,0,0,0.75),0_0_0_1px_rgba(255,255,255,0.05)]'
          : 'shadow-[0_14px_40px_rgba(0,0,0,0.45)]'
      } ${status === 'minimize' ? 'hidden' : ''}`}
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif",
      }}
    >
      {!isFullscreen && (
        <>
          <div
            ref={t}
            className="absolute top-0 z-20 h-1 w-full cursor-ns-resize"
          />
          <div
            ref={b}
            className="absolute bottom-0 z-20 h-1 w-full cursor-ns-resize"
          />
          <div
            ref={r}
            className="absolute right-0 z-20 h-full w-1 cursor-ew-resize"
          />
          <div
            ref={l}
            className="absolute left-0 z-20 h-full w-1 cursor-ew-resize"
          />
          <div
            ref={tl}
            className="absolute top-0 left-0 z-20 size-2 cursor-nwse-resize"
          />
          <div
            ref={tr}
            className="absolute top-0 right-0 z-20 size-2 cursor-nesw-resize"
          />
          <div
            ref={bl}
            className="absolute bottom-0 left-0 z-20 size-2 cursor-nesw-resize"
          />
          <div
            ref={br}
            className="absolute right-0 bottom-0 z-20 size-2 cursor-nwse-resize"
          />
        </>
      )}
      <div className="grid h-full min-h-0 grid-cols-[88px_minmax(0,1fr)] grid-rows-[52px_minmax(0,1fr)] md:grid-cols-[200px_minmax(0,1fr)]">
        <div
          ref={frameHeader}
          onDoubleClick={onFullScreen}
          className="relative z-20 col-span-2 grid grid-cols-[88px_minmax(0,1fr)] border-b border-white/10 bg-white/[0.055] md:grid-cols-[200px_minmax(0,1fr)]"
        >
          <div className="flex items-center px-1 md:px-3">
            <MacTrafficLights
              appName="Finder"
              isActive={isFocused}
              isFullscreen={isFullscreen}
              onClose={onClose}
              onMinimize={onMinimize}
              onZoom={onFullScreen}
            />
          </div>
          <div className="flex min-w-0 items-center gap-1 overflow-visible border-l border-white/10 px-1 md:gap-2 md:px-3">
            <div className="flex overflow-hidden rounded-md bg-white/[0.045] p-0.5">
              <ToolbarButton
                ariaLabel="Back"
                active={false}
                disabled={!canGoBack}
                onClick={() => navigateHistory('back')}
              >
                <IconChevronLeft aria-hidden stroke={2} className="size-4" />
              </ToolbarButton>
              <ToolbarButton
                ariaLabel="Forward"
                active={false}
                disabled={!canGoForward}
                onClick={() => navigateHistory('forward')}
              >
                <IconChevronRight aria-hidden stroke={2} className="size-4" />
              </ToolbarButton>
            </div>
            <span className="hidden min-w-[76px] flex-1 truncate text-center text-[13px] font-semibold md:block">
              {currentLocation.label}
            </span>
            <div className="flex overflow-hidden rounded-md border border-white/10 bg-black/20">
              <ToolbarButton
                ariaLabel="List view"
                active={viewMode === 'list'}
                onClick={() => setViewMode('list')}
              >
                <IconListDetails aria-hidden stroke={2} className="size-4" />
              </ToolbarButton>
              <ToolbarButton
                ariaLabel="Icon view"
                active={viewMode === 'grid'}
                onClick={() => setViewMode('grid')}
              >
                <IconLayoutGrid aria-hidden stroke={2} className="size-4" />
              </ToolbarButton>
              <ToolbarButton
                ariaLabel="Column view"
                active={viewMode === 'columns'}
                onClick={() => setViewMode('columns')}
              >
                <IconColumns3 aria-hidden stroke={2} className="size-4" />
              </ToolbarButton>
            </div>
            <div className="relative shrink-0" ref={windowActionsMenu}>
              <ToolbarButton
                ariaLabel="Window actions"
                active={isWindowActionsOpen}
                onClick={() => setIsWindowActionsOpen((isOpen) => !isOpen)}
              >
                <IconDots aria-hidden className="size-4" stroke={2} />
              </ToolbarButton>
              {isWindowActionsOpen && (
                <div
                  className="absolute top-8 right-0 z-30 w-36 overflow-hidden rounded-lg border border-white/10 bg-[rgba(36,36,40,0.96)] p-1 text-[11px] shadow-2xl backdrop-blur-2xl"
                  role="menu"
                >
                  <button
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-white/75 hover:bg-[#0a84ff] hover:text-white"
                    onClick={() => {
                      onLeftScreen()
                      setIsWindowActionsOpen(false)
                    }}
                    role="menuitem"
                    type="button"
                  >
                    <span
                      aria-hidden
                      className="h-3.5 w-4 rounded-[3px] border border-current bg-[linear-gradient(to_right,currentColor_50%,transparent_50%)] opacity-75"
                    />
                    Tile Left
                  </button>
                  <button
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-white/75 hover:bg-[#0a84ff] hover:text-white"
                    onClick={() => {
                      onRightScreen()
                      setIsWindowActionsOpen(false)
                    }}
                    role="menuitem"
                    type="button"
                  >
                    <span
                      aria-hidden
                      className="h-3.5 w-4 rounded-[3px] border border-current bg-[linear-gradient(to_left,currentColor_50%,transparent_50%)] opacity-75"
                    />
                    Tile Right
                  </button>
                </div>
              )}
            </div>
            {currentLocationId === 'trash' && trashItems.length > 0 && (
              <button
                aria-label="Empty Trash"
                onClick={() => dispatch(cleanTrash())}
                className="hidden rounded-md border border-white/10 bg-black/20 px-2 py-1.5 text-[11px] font-medium text-white/70 transition hover:bg-white/10 md:block"
                type="button"
              >
                Empty
              </button>
            )}
            {primaryActionLabel && (
              <button
                aria-label={primaryActionLabel}
                onClick={runPrimaryAction}
                className="hidden rounded-md border border-white/10 bg-black/20 px-2 py-1.5 text-[11px] font-medium text-white/70 transition hover:bg-white/10 md:block"
                type="button"
              >
                {primaryActionLabel}
              </button>
            )}
            <label className="hidden w-[140px] shrink-0 items-center gap-1.5 rounded-[8px] border border-white/10 bg-white/[0.08] px-2 py-1.5 md:flex">
              <IconSearch
                aria-hidden
                stroke={2}
                className="size-3.5 text-white/45"
              />
              <input
                aria-label={`Search ${currentLocation.label}`}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search"
                className="w-full min-w-0 bg-transparent text-[12px] outline-hidden placeholder:text-white/35"
                type="search"
              />
            </label>
          </div>
        </div>
        <aside
          aria-label="Finder locations"
          className="min-h-0 overflow-auto border-r border-white/[0.08] bg-white/[0.035] px-1 py-2 md:px-2"
        >
          <p className="hidden px-2 pb-1 text-[10px] font-bold tracking-[0.08em] text-white/30 uppercase md:block">
            Favorites
          </p>
          <div className="space-y-0.5">
            {FINDER_LOCATIONS.map((location) => (
              <SidebarItem
                key={location.id}
                active={location.id === currentLocationId}
                label={location.label}
                icon={location.icon}
                onClick={() => navigateTo(location.id)}
              />
            ))}
          </div>
        </aside>
        <main className="grid min-h-0 grid-rows-[32px_26px_minmax(0,1fr)_24px] overflow-hidden bg-black/[0.08]">
          <div className="flex min-w-0 items-stretch border-b border-white/[0.08] bg-white/[0.025]">
            {tabs.map((tab) => {
              const label =
                FINDER_LOCATIONS.find(
                  (location) => location.id === tab.location
                )?.label || 'Finder'
              return (
                <button
                  key={tab.id}
                  aria-label={`${label} tab`}
                  onClick={() => selectTab(tab.id, tab.location)}
                  className={`min-w-[104px] border-r border-white/[0.07] px-4 text-center text-[12px] transition ${tab.id === activeTabId ? 'bg-white/[0.07] text-white shadow-[inset_0_-1px_0_rgba(255,255,255,0.24)]' : 'text-white/50 hover:bg-white/[0.04] hover:text-white/80'}`}
                  type="button"
                >
                  <span className="truncate">{label}</span>
                </button>
              )
            })}
            <button
              aria-label="New Tab"
              className="flex w-10 shrink-0 items-center justify-center text-white/45 transition hover:bg-white/[0.05] hover:text-white/85"
              onClick={addTab}
              type="button"
            >
              <IconPlus aria-hidden className="size-3.5" stroke={2.5} />
            </button>
          </div>
          <div className="flex items-center gap-1 border-b border-white/[0.07] bg-white/[0.02] px-3 text-[11px] text-white/45">
            <span>MehdiOS</span>
            <span className="text-white/25">›</span>
            <span className="font-medium text-white/75">
              {currentLocation.label}
            </span>
          </div>
          <div className="min-h-0 overflow-auto">
            {filteredItems.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-white/40">
                <IconSearch aria-hidden stroke={1.7} className="size-6" />
                <p className="text-[13px]">No matching items</p>
              </div>
            ) : viewMode === 'list' ? (
              <div className="min-w-[440px]">
                <div className="sticky top-0 z-10 grid grid-cols-[minmax(0,1fr)_116px_96px] border-b border-white/[0.07] bg-[#29292c]/95 px-3 py-1.5 text-[10px] font-bold tracking-[0.04em] text-white/35 uppercase backdrop-blur-xl">
                  <span>{columnLabels.primary}</span>
                  <span>{columnLabels.secondary}</span>
                  <span>{columnLabels.tertiary}</span>
                </div>
                {filteredItems.map((item) => (
                  <FinderListRow
                    key={item.id}
                    item={item}
                    selected={selectedItem?.id === item.id}
                    onClick={() => setSelectedItemId(item.id)}
                    onDoubleClick={() => item.onOpen?.()}
                  />
                ))}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-x-2 gap-y-3 px-4 py-4 sm:grid-cols-[repeat(auto-fill,minmax(108px,1fr))]">
                {filteredItems.map((item) => (
                  <FinderGridCard
                    key={item.id}
                    item={item}
                    selected={selectedItem?.id === item.id}
                    onClick={() => setSelectedItemId(item.id)}
                    onDoubleClick={() => item.onOpen?.()}
                  />
                ))}
              </div>
            ) : (
              <FinderColumnView
                items={filteredItems}
                selectedItem={selectedItem}
                onSelect={setSelectedItemId}
              />
            )}
          </div>
          <div className="flex items-center justify-between border-t border-white/[0.07] bg-white/[0.025] px-3 text-[10px] text-white/38">
            <span>{itemCountLabel}</span>
            {selectedItem && (
              <span className="hidden max-w-[60%] truncate sm:block">
                {selectedItem.name} · {selectedItem.description}
              </span>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
function SidebarItem({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean
  icon: FinderSidebarIconName
  label: string
  onClick: () => void
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className={`flex w-full items-center justify-center gap-2 rounded-r-md px-1 py-1.5 text-left transition md:justify-start md:px-3 ${
        active
          ? 'bg-[#0a84ff]/25 text-white'
          : 'text-white/65 hover:bg-white/[0.06] hover:text-white/85'
      }`}
      type="button"
    >
      <div className="flex size-5 shrink-0 items-center justify-center text-[#00b9ff]">
        <FinderSidebarIcon name={icon} />
      </div>
      <span
        className={`hidden text-[13px] md:inline ${active ? 'font-medium' : 'font-normal'}`}
      >
        {label}
      </span>
    </button>
  )
}

function ToolbarButton({
  active,
  ariaLabel,
  children,
  disabled = false,
  onClick,
}: {
  active: boolean
  ariaLabel: string
  children: ReactNode
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-7 w-8 items-center justify-center rounded transition ${active ? 'bg-white/[0.14] text-white' : 'bg-transparent text-white/50 hover:bg-white/[0.08] hover:text-white/85'} ${disabled ? 'opacity-30' : ''}`}
      type="button"
    >
      {children}
    </button>
  )
}

function FinderListRow({
  item,
  selected,
  onClick,
  onDoubleClick,
}: {
  item: FinderItem
  selected: boolean
  onClick: () => void
  onDoubleClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`grid w-full grid-cols-[minmax(0,1fr)_116px_96px] items-center px-3 py-1 text-left transition ${
        selected
          ? 'bg-[#0a84ff]/75 text-white'
          : 'bg-transparent text-white/75 hover:bg-white/[0.045]'
      }`}
      type="button"
    >
      <div className="flex min-w-0 items-center gap-3">
        <FinderItemIcon item={item} selected={selected} compact />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium">{item.name}</p>
          <p
            className={`truncate text-[11px] ${selected ? 'text-white/72' : 'text-white/40'}`}
          >
            {item.description}
          </p>
        </div>
      </div>
      <span
        className={`truncate text-[12px] ${selected ? 'text-white/78' : 'text-white/45'}`}
      >
        {item.meta}
      </span>
      <span
        className={`truncate text-[12px] ${selected ? 'text-white/78' : 'text-white/45'}`}
      >
        {item.detail}
      </span>
    </button>
  )
}

function FinderColumnView({
  items,
  selectedItem,
  onSelect,
}: {
  items: FinderItem[]
  selectedItem: FinderItem | null
  onSelect: (id: string) => void
}) {
  return (
    <div className="grid h-full min-w-[440px] grid-cols-[220px_minmax(0,1fr)]">
      <div className="overflow-auto border-r border-white/[0.08] py-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] transition ${selectedItem?.id === item.id ? 'bg-[#0a84ff]/35 text-white' : 'text-white/72 hover:bg-white/[0.05]'}`}
            type="button"
          >
            <FinderItemIcon
              item={item}
              selected={selectedItem?.id === item.id}
              compact
            />
            <span className="min-w-0 flex-1 truncate">{item.name}</span>
            <span className="text-white/35">›</span>
          </button>
        ))}
      </div>
      {selectedItem ? (
        <div className="overflow-auto bg-white/[0.018] p-5">
          <div className="flex items-center gap-4">
            <FinderItemIcon item={selectedItem} selected compact={false} />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold text-white">
                {selectedItem.name}
              </p>
              <p className="mt-0.5 text-[11px] tracking-wide text-white/40 uppercase">
                {selectedItem.meta}
              </p>
            </div>
          </div>
          <dl className="mt-5 space-y-2 border-y border-white/[0.08] py-3 text-[12px] text-white/55">
            <div className="flex justify-between gap-4">
              <dt>Kind</dt>
              <dd className="text-white/80">{selectedItem.meta}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Location</dt>
              <dd className="text-white/80">{selectedItem.detail}</dd>
            </div>
          </dl>
          <p className="mt-4 text-[12px] leading-5 text-white/55">
            {selectedItem.description}
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-center text-[12px] text-white/35">
          Select an item
        </div>
      )}
    </div>
  )
}

function FinderGridCard({
  item,
  selected,
  onClick,
  onDoubleClick,
}: {
  item: FinderItem
  selected: boolean
  onClick: () => void
  onDoubleClick: () => void
}) {
  return (
    <button
      aria-label={`${item.name}. ${item.meta}. Double-click to open when available.`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`group flex min-w-0 flex-col items-center rounded-md px-1.5 py-1 text-center transition ${selected ? 'bg-[#0a64d8] text-white' : 'text-black/80 hover:bg-black/[0.06] dark:text-white/80 dark:hover:bg-white/[0.08]'}`}
      type="button"
    >
      <FinderItemIcon item={item} selected={selected} />
      <span className="mt-1.5 line-clamp-2 w-full text-[11px] leading-[1.2] font-medium break-words">
        {item.name}
      </span>
      <span
        className={`mt-0.5 truncate text-[10px] ${selected ? 'text-white/75' : 'text-black/45 dark:text-white/45'}`}
      >
        {item.meta}
      </span>
    </button>
  )
}
function FinderItemIcon({
  item,
  compact = false,
  selected,
}: {
  item: FinderItem
  compact?: boolean
  selected: boolean
}) {
  const sizeClass = compact ? 'size-7 rounded-md' : 'size-14 rounded-lg'
  const imageClass = compact ? 'size-6' : 'size-12'

  if (item.thumbnail) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden border border-white/60 bg-white shadow-[0_8px_18px_rgba(15,23,42,0.12)] ${sizeClass}`}
      >
        <Image alt="" src={item.thumbnail} fill className="object-cover" />
      </div>
    )
  }

  if (item.trashItem) {
    const icon = getTrashIcon(item.trashItem)

    return (
      <div
        className={`flex shrink-0 items-center justify-center border border-white/55 bg-white shadow-[0_8px_18px_rgba(15,23,42,0.08)] ${sizeClass}`}
      >
        {typeof icon === 'string' ? (
          <Image
            alt=""
            src={icon}
            width={compact ? 32 : 48}
            height={compact ? 32 : 48}
            className={`${imageClass} object-contain`}
          />
        ) : (
          <Image alt="" src={icon} className={imageClass} />
        )}
      </div>
    )
  }

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center bg-gradient-to-br ${item.accent} text-white shadow-[0_10px_22px_rgba(15,23,42,0.16)] ${sizeClass}`}
    >
      <span
        className={`font-semibold ${compact ? 'text-[13px]' : 'text-[18px]'}`}
      >
        {item.initials || item.name.slice(0, 1)}
      </span>
      {selected && !compact && (
        <span className="absolute top-2 right-2 size-2 rounded-full bg-white/80" />
      )}
    </div>
  )
}
