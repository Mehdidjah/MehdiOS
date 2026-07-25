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
import gsap from 'gsap'
import { Draggable } from 'gsap/Draggable'
import Image, { StaticImageData } from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { projects } from '../projects/projects'
import { useClickOutside } from '@/app/hooks/use-click-outside'
import { Folder, Status } from '../folder/folders'
import acrobat from '@/public/assets/icons/Acrobat.png'
import typingMasterIcon from '@/public/assets/icons/typing-master.png'
import {
  FinderSidebarIcon,
  type FinderSidebarIconName,
} from './finder-sidebar-icon'
import { MacTrafficLights } from './mac-traffic-lights'
import { FinderToolbarIcon } from './finder-toolbar-icon'

type FinderLocationId = 'projects' | 'trash'
type FinderViewMode = 'list' | 'grid' | 'columns' | 'gallery'

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

  const width = Math.min(792, screenWidth - 24)
  const height = Math.min(648, screenHeight - topbarHeight - 56)

  return {
    width,
    height,
    left: Math.max(12, Math.round((screenWidth - width) / 2)),
    top: Math.max(
      topbarHeight + 16,
      Math.round((screenHeight - height) / 2) - 20
    ),
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

  return '/assets/macx-icons/FinderFolder.png'
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
  const [viewMode, setViewMode] = useState<FinderViewMode>('grid')
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
    filteredItems.find((item) => item.id === selectedItemId) ?? null
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
      className={`absolute min-h-[420px] max-w-full min-w-0 overflow-hidden border bg-white text-gray-900 transition-colors duration-150 dark:bg-[#1E1E1E] dark:text-gray-100 ${
        isFullscreen
          ? 'rounded-none border-white/10'
          : 'rounded-none border-black/10 md:rounded-[14px] dark:border-white/10'
      } ${
        isFocused
          ? 'shadow-[0_10px_40px_-10px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.1)]'
          : 'shadow-[0_10px_30px_-12px_rgba(0,0,0,0.3)]'
      } ${status === 'minimize' ? 'hidden' : ''}`}
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
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

      <div className="relative flex h-full min-h-0 bg-white text-gray-800 transition-colors duration-150 select-none dark:bg-[#1E1E1E] dark:text-gray-200">
        <aside
          aria-label="Finder locations"
          className="flex w-[76px] shrink-0 flex-col border-r border-[#E5E5E5] bg-[#F3F3F3]/90 backdrop-blur-md transition-colors duration-150 md:w-52 dark:border-white/10 dark:bg-[#1E1E1E]/95"
        >
          <div className="flex h-12 shrink-0 items-center px-3 md:px-4">
            <MacTrafficLights
              appName="Finder"
              isActive={isFocused}
              isFullscreen={isFullscreen}
              onClose={onClose}
              onMinimize={onMinimize}
              onZoom={onFullScreen}
            />
          </div>
          <nav
            className="flex-1 space-y-4 overflow-y-auto px-2 pb-4"
            style={{ scrollbarWidth: 'none' }}
          >
            <div>
              <p className="hidden px-2.5 py-1 text-[11px] font-bold tracking-wide text-gray-400 uppercase md:block">
                Favorites
              </p>
              <div className="mt-1 space-y-0.5">
                {FINDER_LOCATIONS.map((location) => (
                  <SidebarItem
                    key={location.id}
                    active={location.id === currentLocationId}
                    icon={location.icon}
                    label={location.label}
                    onClick={() => navigateTo(location.id)}
                  />
                ))}
              </div>
            </div>
          </nav>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white transition-colors duration-150 dark:bg-[#1E1E1E]">
          <header
            ref={frameHeader}
            onDoubleClick={onFullScreen}
            className="flex h-12 shrink-0 cursor-grab items-center justify-between border-b border-[#E5E5E5] bg-[#F6F6F6] px-4 text-gray-800 transition-colors duration-150 active:cursor-grabbing dark:border-white/10 dark:bg-[#2D2D2D] dark:text-white"
          >
            <div className="flex items-center gap-4">
              <div className="flex shrink-0 items-center gap-1.5">
                <FinderNavigationButton
                  ariaLabel="Back"
                  disabled={!canGoBack}
                  icon="back"
                  onClick={() => navigateHistory('back')}
                />
                <FinderNavigationButton
                  ariaLabel="Forward"
                  disabled={!canGoForward}
                  icon="forward"
                  onClick={() => navigateHistory('forward')}
                />
              </div>
              <span className="text-[14px] font-semibold whitespace-nowrap text-gray-800 dark:text-white">
                {currentLocation.label}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-2 lg:gap-4">
              <div className="hidden shrink-0 items-center rounded-xl border border-[#D5D5D5] bg-[#EBEBEB] p-0.5 shadow-sm transition md:flex dark:border-white/10 dark:bg-[#1E1E1E]">
                <FinderViewButton
                  active={viewMode === 'grid'}
                  icon="grid"
                  label="Icon View"
                  onClick={() => setViewMode('grid')}
                />
                <FinderViewButton
                  active={viewMode === 'list'}
                  icon="list"
                  label="List View"
                  onClick={() => setViewMode('list')}
                />
                <FinderViewButton
                  active={viewMode === 'columns'}
                  icon="columns"
                  label="Column View"
                  onClick={() => setViewMode('columns')}
                />
                <FinderViewButton
                  active={viewMode === 'gallery'}
                  icon="gallery"
                  label="Gallery View"
                  onClick={() => setViewMode('gallery')}
                />
              </div>

              <button
                aria-label="New Finder tab"
                className="hidden items-center gap-0.5 rounded-lg border border-[#D5D5D5] px-1.5 py-1 text-[11px] text-gray-700 transition hover:bg-black/5 lg:flex dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
                onClick={addTab}
                title="New Finder tab"
                type="button"
              >
                <FinderToolbarIcon name="grid" size={13} />
                <FinderToolbarIcon name="chevron-down" size={10} />
              </button>

              <div className="hidden items-center gap-1.5 lg:flex">
                <FinderToolbarButton
                  ariaLabel="Share selected item unavailable"
                  disabled
                  icon="share"
                  onClick={() => undefined}
                />
                <FinderToolbarButton
                  ariaLabel="Show item details"
                  disabled={!selectedItem}
                  icon="tag"
                  onClick={() => setViewMode('columns')}
                />
                <div
                  className="relative flex shrink-0 items-center"
                  ref={windowActionsMenu}
                >
                  <FinderToolbarButton
                    ariaLabel="More Finder actions"
                    active={isWindowActionsOpen}
                    icon="more"
                    onClick={() => setIsWindowActionsOpen((isOpen) => !isOpen)}
                  />
                  {isWindowActionsOpen && (
                    <div
                      className="absolute top-9 right-0 z-50 w-40 rounded-lg border border-[#D5D5D5] bg-white py-1 text-[12px] text-gray-700 shadow-lg dark:border-white/10 dark:bg-[#1E1E1E] dark:text-gray-300"
                      role="menu"
                    >
                      <FinderMenuButton
                        label="New Tab"
                        onClick={() => {
                          addTab()
                          setIsWindowActionsOpen(false)
                        }}
                      />
                      {primaryActionLabel && (
                        <FinderMenuButton
                          label={primaryActionLabel}
                          onClick={() => {
                            runPrimaryAction()
                            setIsWindowActionsOpen(false)
                          }}
                        />
                      )}
                      {currentLocationId === 'trash' &&
                        trashItems.length > 0 && (
                          <FinderMenuButton
                            danger
                            label="Empty Trash"
                            onClick={() => {
                              dispatch(cleanTrash())
                              setIsWindowActionsOpen(false)
                            }}
                          />
                        )}
                      <div className="my-1 border-t border-[#E5E5E5] dark:border-white/10" />
                      <FinderMenuButton
                        label="Tile Left"
                        onClick={() => {
                          onLeftScreen()
                          setIsWindowActionsOpen(false)
                        }}
                      />
                      <FinderMenuButton
                        label="Tile Right"
                        onClick={() => {
                          onRightScreen()
                          setIsWindowActionsOpen(false)
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <label className="relative hidden shrink-0 items-center xl:flex">
                <FinderToolbarIcon
                  className="pointer-events-none absolute left-2.5 text-gray-400"
                  name="search"
                  size={13}
                />
                <input
                  aria-label={`Search ${currentLocation.label}`}
                  className="w-40 rounded-full border border-[#D0D0D0] bg-[#EAEAEA] py-1 pr-2.5 pl-8 text-[11px] text-gray-800 transition outline-none placeholder:text-gray-500 focus:bg-white focus:ring-1 focus:ring-blue-400 dark:border-white/10 dark:bg-[#1E1E1E] dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-[#2D2D2D] dark:focus:ring-blue-500"
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search"
                  type="search"
                  value={searchQuery}
                />
              </label>
            </div>
          </header>

          {tabs.length > 1 && (
            <div className="flex h-8 min-w-0 shrink-0 items-stretch border-b border-[#E5E5E5] bg-[#F9F9F9] dark:border-white/10 dark:bg-[#191919]">
              {tabs.map((tab) => {
                const label =
                  FINDER_LOCATIONS.find(
                    (location) => location.id === tab.location
                  )?.label || 'Finder'

                return (
                  <button
                    key={tab.id}
                    aria-label={`${label} tab`}
                    className={`min-w-[104px] border-r border-[#E5E5E5] px-4 text-center text-[12px] transition dark:border-white/10 ${
                      tab.id === activeTabId
                        ? 'bg-white text-gray-900 shadow-[inset_0_-2px_0_#007AFF] dark:bg-white/10 dark:text-white'
                        : 'text-gray-500 hover:bg-black/5 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200'
                    }`}
                    onClick={() => selectTab(tab.id, tab.location)}
                    type="button"
                  >
                    <span className="truncate">{label}</span>
                  </button>
                )
              })}
            </div>
          )}

          <div
            className="relative min-h-0 flex-1 overflow-auto bg-white transition-colors duration-150 dark:bg-[#121212]"
            onClick={(event) => {
              if (event.target === event.currentTarget) setSelectedItemId(null)
            }}
          >
            {filteredItems.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-8 text-gray-400">
                <Image
                  alt=""
                  className="mb-3 size-12 object-contain opacity-35"
                  height={48}
                  src="/assets/macx-icons/FinderFolder.png"
                  width={48}
                />
                <p className="text-[14px]">No items found</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-6 p-6">
                {filteredItems.map((item) => (
                  <FinderGridCard
                    key={item.id}
                    item={item}
                    onClick={() => setSelectedItemId(item.id)}
                    onDoubleClick={() => item.onOpen?.()}
                    selected={selectedItem?.id === item.id}
                  />
                ))}
              </div>
            ) : viewMode === 'list' ? (
              <div className="flex min-w-[560px] flex-col">
                <div className="sticky top-0 z-10 flex items-center border-b border-[#E5E5E5] bg-white px-4 py-2 text-[11px] font-bold tracking-wider text-gray-400 uppercase dark:border-white/10 dark:bg-[#121212]">
                  <span className="min-w-[220px] flex-1">
                    {columnLabels.primary}
                  </span>
                  <span className="w-40 shrink-0">
                    {columnLabels.secondary}
                  </span>
                  <span className="w-36 shrink-0">{columnLabels.tertiary}</span>
                </div>
                <div className="divide-y divide-[#F0F0F0] dark:divide-white/5">
                  {filteredItems.map((item) => (
                    <FinderListRow
                      key={item.id}
                      item={item}
                      onClick={() => setSelectedItemId(item.id)}
                      onDoubleClick={() => item.onOpen?.()}
                      selected={selectedItem?.id === item.id}
                    />
                  ))}
                </div>
              </div>
            ) : viewMode === 'columns' ? (
              <FinderColumnView
                items={filteredItems}
                onSelect={setSelectedItemId}
                selectedItem={selectedItem}
              />
            ) : (
              <FinderGalleryView
                items={filteredItems}
                onOpen={(item) => item.onOpen?.()}
                onSelect={setSelectedItemId}
                selectedItem={selectedItem}
              />
            )}
          </div>

          {selectedItem && viewMode !== 'gallery' && (
            <div className="flex h-6 shrink-0 items-center justify-between border-t border-[#E5E5E5] bg-[#F9F9F9] px-3 text-[10px] text-gray-500 dark:border-white/10 dark:bg-[#191919] dark:text-gray-400">
              <span>{itemCountLabel}</span>
              <span className="hidden max-w-[60%] truncate sm:block">
                {selectedItem.name} · {selectedItem.description}
              </span>
            </div>
          )}
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
  const iconColor =
    icon === 'downloads' ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'

  return (
    <button
      aria-label={label}
      className={`flex w-full items-center justify-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] font-medium transition-all md:justify-start ${
        active
          ? 'bg-black/10 text-black dark:bg-white/10 dark:text-white'
          : 'text-[#4A4A4A] hover:bg-black/5 dark:text-[#D0D0D0] dark:hover:bg-white/5'
      }`}
      onClick={onClick}
      type="button"
    >
      <FinderSidebarIcon className={iconColor} name={icon} />
      <span className="hidden truncate md:inline">{label}</span>
    </button>
  )
}

function FinderNavigationButton({
  ariaLabel,
  disabled,
  icon,
  onClick,
}: {
  ariaLabel: string
  disabled: boolean
  icon: 'back' | 'forward'
  onClick: () => void
}) {
  return (
    <button
      aria-label={ariaLabel}
      className="rounded-lg p-1 text-[#5F5F5F] transition hover:bg-black/5 disabled:opacity-35 disabled:hover:bg-transparent dark:text-gray-300 dark:hover:bg-white/5"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <FinderToolbarIcon name={icon} size={18} />
    </button>
  )
}

function FinderViewButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean
  icon: 'columns' | 'gallery' | 'grid' | 'list'
  label: string
  onClick: () => void
}) {
  return (
    <button
      aria-label={label}
      className={`rounded-lg p-1 transition ${
        active
          ? 'bg-white text-gray-800 shadow-sm dark:bg-[#2D2D2D] dark:text-white dark:shadow-md'
          : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'
      }`}
      onClick={onClick}
      title={label}
      type="button"
    >
      <FinderToolbarIcon name={icon} size={13} />
    </button>
  )
}

function FinderToolbarButton({
  active = false,
  ariaLabel,
  disabled = false,
  icon,
  onClick,
}: {
  active?: boolean
  ariaLabel: string
  disabled?: boolean
  icon: 'more' | 'share' | 'tag'
  onClick: () => void
}) {
  return (
    <button
      aria-label={ariaLabel}
      className={`rounded-lg border p-1.5 transition disabled:cursor-default ${
        active
          ? 'border-[#B8CDE9] bg-[#E0EEFF] text-[#004BB3] dark:border-white/15 dark:bg-white/10 dark:text-white'
          : 'border-[#D5D5D5] text-gray-600 hover:bg-black/5 disabled:hover:bg-transparent dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5 dark:disabled:hover:bg-transparent'
      }`}
      disabled={disabled}
      onClick={onClick}
      title={ariaLabel}
      type="button"
    >
      <FinderToolbarIcon name={icon} size={14} />
    </button>
  )
}

function FinderMenuButton({
  danger = false,
  label,
  onClick,
}: {
  danger?: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      className={`w-full px-3 py-1.5 text-left transition ${
        danger
          ? 'text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/15 dark:hover:text-red-400'
          : 'hover:bg-[#007AFF] hover:text-white'
      }`}
      onClick={onClick}
      role="menuitem"
      type="button"
    >
      {label}
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
      className={`flex w-full cursor-pointer items-center px-4 py-1.5 text-left text-[12px] transition ${
        selected
          ? 'bg-[#E0EEFF] text-[#004BB3] dark:bg-white/10 dark:text-white'
          : 'hover:bg-[#F3F3F3] dark:text-gray-300 dark:hover:bg-white/5'
      }`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      title={item.description}
      type="button"
    >
      <div className="flex min-w-[220px] flex-1 items-center gap-2.5 truncate">
        <FinderItemIcon item={item} size="compact" />
        <span className="truncate">{item.name}</span>
      </div>
      <span
        className={`w-40 shrink-0 truncate ${selected ? 'text-[#004BB3] dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}
      >
        {item.meta}
      </span>
      <span
        className={`w-36 shrink-0 truncate ${selected ? 'text-[#004BB3] dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}
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
    <div className="flex h-full min-w-max divide-x divide-[#E5E5E5] bg-white transition dark:divide-white/10 dark:bg-[#121212]">
      <div className="w-64 space-y-0.5 overflow-y-auto p-1.5 select-none">
        {items.map((item) => (
          <button
            key={item.id}
            className={`flex w-full items-center justify-between rounded-md px-2.5 py-1 text-left text-[12px] transition-all ${
              selectedItem?.id === item.id
                ? 'bg-[#007AFF] text-white'
                : 'text-gray-800 hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/5'
            }`}
            onClick={() => onSelect(item.id)}
            onDoubleClick={() => item.onOpen?.()}
            type="button"
          >
            <span className="flex min-w-0 items-center gap-2">
              <FinderItemIcon item={item} size="small" />
              <span className="truncate">{item.name}</span>
            </span>
            <FinderToolbarIcon
              className={
                selectedItem?.id === item.id ? 'text-white' : 'text-gray-400'
              }
              name="forward"
              size={13}
            />
          </button>
        ))}
      </div>

      {selectedItem ? (
        <div className="flex w-64 flex-col items-center justify-center overflow-y-auto bg-[#FAF9F9] p-4 text-center dark:bg-[#1A1A1A]">
          <FinderItemIcon item={selectedItem} size="large" />
          <span className="mt-2 max-w-full truncate text-[13px] font-medium text-gray-600 dark:text-gray-300">
            {selectedItem.name}
          </span>
          <span className="mt-1 text-[11px] text-gray-400">
            {selectedItem.meta}
          </span>
          <p className="mt-3 line-clamp-4 text-[11px] leading-4 text-gray-500 dark:text-gray-400">
            {selectedItem.description}
          </p>
        </div>
      ) : (
        <div className="flex w-64 items-center justify-center bg-[#FAF9F9] text-[12px] text-gray-400 dark:bg-[#1A1A1A]">
          Select an item
        </div>
      )}
    </div>
  )
}

function FinderGalleryView({
  items,
  selectedItem,
  onOpen,
  onSelect,
}: {
  items: FinderItem[]
  selectedItem: FinderItem | null
  onOpen: (item: FinderItem) => void
  onSelect: (id: string) => void
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-white transition dark:bg-[#121212]">
      <div className="flex min-h-0 flex-1 items-center justify-center p-6">
        {selectedItem ? (
          selectedItem.thumbnail ? (
            <button
              aria-label={`Open ${selectedItem.name}`}
              className="relative h-full max-h-[400px] w-full max-w-[480px]"
              onDoubleClick={() => onOpen(selectedItem)}
              type="button"
            >
              <Image
                alt={selectedItem.name}
                className="rounded-xl object-contain shadow-lg"
                fill
                sizes="480px"
                src={selectedItem.thumbnail}
              />
            </button>
          ) : (
            <button
              aria-label={`Open ${selectedItem.name}`}
              className="flex size-48 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 shadow-inner dark:border-white/5 dark:bg-[#1E1E1E]"
              onDoubleClick={() => onOpen(selectedItem)}
              type="button"
            >
              <FinderItemIcon item={selectedItem} size="preview" />
            </button>
          )
        ) : (
          <div className="text-center text-gray-400">
            <FinderToolbarIcon
              className="mx-auto mb-2 opacity-30"
              name="gallery"
              size={48}
            />
            <p className="text-[13px]">Select a file to preview</p>
          </div>
        )}
      </div>

      <div className="flex h-20 shrink-0 items-center overflow-x-auto border-t border-[#E5E5E5] bg-[#F9F9F9] px-4 transition dark:border-white/10 dark:bg-[#1E1E1E]">
        <div className="mx-auto flex gap-2 py-1">
          {items.map((item) => (
            <button
              key={item.id}
              aria-label={`Preview ${item.name}`}
              className={`flex size-14 shrink-0 items-center justify-center rounded-lg border-2 p-1 transition-all ${
                selectedItem?.id === item.id
                  ? 'scale-105 border-[#007AFF] bg-white shadow-md dark:bg-[#2A2A2A]'
                  : 'border-transparent bg-white opacity-70 hover:opacity-100 dark:bg-[#2A2A2A]'
              }`}
              onClick={() => onSelect(item.id)}
              onDoubleClick={() => onOpen(item)}
              type="button"
            >
              <FinderItemIcon item={item} size="strip" />
            </button>
          ))}
        </div>
      </div>
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
      className="group flex min-w-0 cursor-pointer flex-col items-center text-center"
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      title={item.description}
      type="button"
    >
      <span
        className={`relative mb-1.5 flex size-[72px] items-center justify-center rounded-xl p-2 transition-all ${
          selected
            ? 'bg-[#E0EEFF] ring-2 ring-[#007AFF]/30 dark:bg-white/10 dark:ring-blue-500'
            : 'group-hover:bg-black/5 dark:group-hover:bg-white/5'
        }`}
      >
        <FinderItemIcon item={item} size="standard" />
      </span>
      <span
        className={`max-w-full truncate rounded px-1.5 py-0.5 text-[11px] leading-tight font-normal ${
          selected
            ? 'bg-[#007AFF] text-white'
            : 'text-gray-800 dark:text-gray-300'
        }`}
      >
        {item.name}
      </span>
    </button>
  )
}

type FinderItemIconSize =
  | 'compact'
  | 'large'
  | 'preview'
  | 'small'
  | 'standard'
  | 'strip'

const finderIconSizeClass: Record<FinderItemIconSize, string> = {
  compact: 'size-6',
  small: 'size-5',
  standard: 'size-14',
  large: 'size-16',
  preview: 'size-24',
  strip: 'size-full',
}

function FinderItemIcon({
  item,
  size,
}: {
  item: FinderItem
  size: FinderItemIconSize
}) {
  const sizeClass = finderIconSizeClass[size]

  if (item.thumbnail) {
    return (
      <span
        className={`relative block shrink-0 overflow-hidden rounded-md border border-black/5 bg-white shadow-sm dark:border-white/10 ${sizeClass}`}
      >
        <Image
          alt=""
          className="object-cover"
          fill
          sizes={size === 'preview' ? '96px' : '64px'}
          src={item.thumbnail}
        />
      </span>
    )
  }

  const icon = item.trashItem
    ? getTrashIcon(item.trashItem)
    : '/assets/macx-icons/FinderFolder.png'

  return (
    <Image
      alt=""
      className={`shrink-0 object-contain ${sizeClass}`}
      height={size === 'preview' ? 96 : 64}
      src={icon}
      width={size === 'preview' ? 96 : 64}
    />
  )
}
