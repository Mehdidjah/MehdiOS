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
  IconLayoutGrid,
  IconListDetails,
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
import { MacTrafficLights } from './mac-traffic-lights'

type FinderLocationId = 'projects' | 'skills' | 'trash'
type FinderViewMode = 'list' | 'grid'

type FinderLocation = {
  id: FinderLocationId
  label: string
  description: string
  iconSrc: string
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
  source?: 'project' | 'skill' | 'trash'
  trashItem?: Folder
  onOpen?: () => void
}

type SkillRecord = {
  id: string
  name: string
  group: string
  level: string
  description: string
  accent: string
  initials: string
}

const FINDER_FRAME_SIZE: Size = { minW: 720, minH: 500 }

const FINDER_LOCATIONS: FinderLocation[] = [
  {
    id: 'projects',
    label: 'Projects',
    description: 'Shipped work, experiments, and product case studies.',
    iconSrc: '/assets/icons/windowicon/project.svg',
  },
  {
    id: 'skills',
    label: 'Skills',
    description:
      'Core engineering strengths across frontend, backend, and tooling.',
    iconSrc: '/assets/icons/windowicon/skill.svg',
  },
  {
    id: 'trash',
    label: 'Trash',
    description: 'Items removed from the desktop that can still be recovered.',
    iconSrc: '/assets/icons/windowicon/trash.svg',
  },
]

const SKILL_RECORDS: SkillRecord[] = [
  {
    id: 'typescript',
    name: 'TypeScript',
    group: 'Languages',
    level: '90%',
    description:
      'Strong day-to-day typing discipline for React, Next.js, and API work.',
    accent: 'from-[#2f74c0] to-[#4ea7ff]',
    initials: 'TS',
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    group: 'Languages',
    level: '84%',
    description:
      'Comfortable across browser APIs, app architecture, and runtime debugging.',
    accent: 'from-[#d19b00] to-[#f5d85f]',
    initials: 'JS',
  },
  {
    id: 'react',
    name: 'React',
    group: 'Frontend',
    level: '88%',
    description:
      'Component systems, state composition, and polished interaction design.',
    accent: 'from-[#0a6f90] to-[#63d5ff]',
    initials: 'R',
  },
  {
    id: 'nextjs',
    name: 'Next.js',
    group: 'Frontend',
    level: '82%',
    description:
      'App Router, hybrid rendering, and deployment-oriented architecture.',
    accent: 'from-[#111111] to-[#545454]',
    initials: 'N',
  },
  {
    id: 'tailwind',
    name: 'Tailwind CSS',
    group: 'Frontend',
    level: '87%',
    description:
      'Rapid UI implementation with deliberate visual systems and responsive layouts.',
    accent: 'from-[#0891b2] to-[#67e8f9]',
    initials: 'TW',
  },
  {
    id: 'redux',
    name: 'Redux Toolkit',
    group: 'Frontend',
    level: '78%',
    description:
      'Predictable state flows for multi-window interfaces and complex UI state.',
    accent: 'from-[#5f3dc4] to-[#9f7aea]',
    initials: 'RT',
  },
  {
    id: 'node',
    name: 'Node.js',
    group: 'Backend',
    level: '81%',
    description:
      'Server logic, tooling automation, and API integrations in TypeScript.',
    accent: 'from-[#2f855a] to-[#68d391]',
    initials: 'N',
  },
  {
    id: 'nestjs',
    name: 'NestJS',
    group: 'Backend',
    level: '72%',
    description:
      'Structured backend services with modules, DI, and maintainable organization.',
    accent: 'from-[#be123c] to-[#fb7185]',
    initials: 'NE',
  },
  {
    id: 'graphql',
    name: 'GraphQL',
    group: 'Backend',
    level: '45%',
    description:
      'Comfortable shipping practical schemas and typed client integrations.',
    accent: 'from-[#b5179e] to-[#f472b6]',
    initials: 'G',
  },
  {
    id: 'docker',
    name: 'Docker',
    group: 'Tools',
    level: '52%',
    description:
      'Enough containerization experience for local orchestration and deployment workflows.',
    accent: 'from-[#0f5db8] to-[#60a5fa]',
    initials: 'D',
  },
  {
    id: 'figma',
    name: 'Figma',
    group: 'Tools',
    level: '70%',
    description:
      'Can bridge design systems, flows, and implementation details without handoff friction.',
    accent: 'from-[#f97316] to-[#f43f5e]',
    initials: 'F',
  },
  {
    id: 'git',
    name: 'Git',
    group: 'Tools',
    level: '86%',
    description:
      'Comfortable with clean branching, review workflows, and change isolation.',
    accent: 'from-[#ea580c] to-[#fdba74]',
    initials: 'G',
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

  const width = Math.min(Math.max(720, Math.floor(screenWidth * 0.58)), 1180)
  const height = Math.min(
    Math.max(500, Math.floor(screenHeight * 0.72)),
    screenHeight - topbarHeight - 32
  )

  return {
    width,
    height,
    left: Math.max(0, Math.floor((screenWidth - width) / 2)),
    top: Math.max(
      topbarHeight + 10,
      Math.floor((screenHeight - height + topbarHeight) / 2)
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
  const minimizeTL = useRef<gsap.core.Timeline>(gsap.timeline())
  const fullscreenTL = useRef<gsap.core.Timeline>(gsap.timeline())
  const dragRef = useRef<globalThis.Draggable[] | null>(null)
  const dispatch = useDispatch()
  const { activeApp, zIndex } = useSelector((state) => state.settings)
  const trashItems = useSelector((state) => state.trash.items)
  const [isFocused, setIsFocused] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [viewMode, setViewMode] = useState<FinderViewMode>('grid')
  const initialLocation = FINDER_LOCATIONS.some(
    (location) => location.id === frame_id
  )
    ? (frame_id as FinderLocationId)
    : 'projects'
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
      height: `${window.innerHeight - 28}px`,
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
      height: `${window.innerHeight - 28}px`,
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
      height: `${window.innerHeight - 28}px`,
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

  useEffect(() => {
    if (activeApp?.id === frame_id && frame.current) {
      frame.current.style.zIndex = `${zIndex}`
    }
  }, [activeApp?.id, frame_id, zIndex])

  useEffect(() => {
    setSelectedItemId(null)
  }, [currentLocationId, searchQuery, viewMode])

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

  const skillItems: FinderItem[] = SKILL_RECORDS.map((skill) => ({
    id: `skill-${skill.id}`,
    name: skill.name,
    meta: skill.group,
    detail: skill.level,
    description: skill.description,
    accent: skill.accent,
    initials: skill.initials,
    source: 'skill',
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

  if (currentLocationId === 'skills') {
    items = skillItems
    columnLabels = {
      primary: 'Skill',
      secondary: 'Category',
      tertiary: 'Level',
    }
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
      className={`absolute min-h-[420px] max-w-full min-w-0 overflow-hidden border border-black/10 bg-[#f7f7f8] text-[#1d1d1f] dark:border-white/10 dark:bg-[#28282a] dark:text-[#f5f5f7] ${
        isFullscreen ? 'rounded-none' : 'rounded-none sm:rounded-[12px]'
      } ${
        isFocused
          ? 'shadow-[0_24px_60px_rgba(0,0,0,0.28)]'
          : 'shadow-[0_12px_36px_rgba(0,0,0,0.22)]'
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
      <div className="grid h-full min-h-0 grid-cols-[92px_minmax(0,1fr)] grid-rows-[48px_minmax(0,1fr)] sm:grid-cols-[208px_minmax(0,1fr)]">
        <div
          ref={frameHeader}
          onDoubleClick={onFullScreen}
          className="col-span-2 grid grid-cols-[92px_minmax(0,1fr)] border-b border-black/10 bg-[#ededee] sm:grid-cols-[208px_minmax(0,1fr)] dark:border-white/10 dark:bg-[#323234]"
        >
          <div className="flex items-center px-1 sm:px-3">
            <MacTrafficLights
              appName="Finder"
              isFullscreen={isFullscreen}
              onClose={onClose}
              onMinimize={onMinimize}
              onZoom={onFullScreen}
            />
          </div>
          <div className="flex min-w-0 items-center gap-1 overflow-hidden border-l border-black/10 px-1 sm:gap-2 sm:px-3 dark:border-white/10">
            <div className="flex overflow-hidden rounded-md border border-black/10 bg-white/70 dark:border-white/10 dark:bg-black/20">
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
            <span className="hidden min-w-0 flex-1 truncate text-center text-[13px] font-semibold xl:block">
              {currentLocation.label}
            </span>
            <div className="flex overflow-hidden rounded-md border border-black/10 bg-white/70 dark:border-white/10 dark:bg-black/20">
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
            </div>
            <div className="hidden overflow-hidden rounded-md border border-black/10 bg-white/70 xl:flex dark:border-white/10 dark:bg-black/20">
              <ToolbarButton
                ariaLabel="Tile Finder left"
                active={false}
                onClick={onLeftScreen}
              >
                <span
                  aria-hidden
                  className="relative h-3.5 w-4 rounded-[3px] border border-current"
                >
                  <span className="absolute inset-y-0 left-0 w-1/2 border-r border-current bg-current/20" />
                </span>
              </ToolbarButton>
              <ToolbarButton
                ariaLabel="Tile Finder right"
                active={false}
                onClick={onRightScreen}
              >
                <span
                  aria-hidden
                  className="relative h-3.5 w-4 rounded-[3px] border border-current"
                >
                  <span className="absolute inset-y-0 right-0 w-1/2 border-l border-current bg-current/20" />
                </span>
              </ToolbarButton>
            </div>
            {currentLocationId === 'trash' && trashItems.length > 0 && (
              <button
                aria-label="Empty Trash"
                onClick={() => dispatch(cleanTrash())}
                className="hidden rounded-md border border-black/10 bg-white/70 px-2 py-1.5 text-[11px] font-medium text-black/70 transition hover:bg-white md:block dark:border-white/10 dark:bg-black/20 dark:text-white/70 dark:hover:bg-white/10"
                type="button"
              >
                Empty
              </button>
            )}
            {primaryActionLabel && (
              <button
                aria-label={primaryActionLabel}
                onClick={runPrimaryAction}
                className="hidden rounded-md border border-black/10 bg-white/70 px-2 py-1.5 text-[11px] font-medium text-black/70 transition hover:bg-white md:block dark:border-white/10 dark:bg-black/20 dark:text-white/70 dark:hover:bg-white/10"
                type="button"
              >
                {primaryActionLabel}
              </button>
            )}
            <label className="hidden w-[148px] shrink-0 items-center gap-1.5 rounded-md border border-black/10 bg-white/75 px-2 py-1.5 sm:flex dark:border-white/10 dark:bg-black/20">
              <IconSearch
                aria-hidden
                stroke={2}
                className="size-3.5 text-black/45 dark:text-white/45"
              />
              <input
                aria-label={`Search ${currentLocation.label}`}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search"
                className="w-full min-w-0 bg-transparent text-[12px] outline-hidden placeholder:text-black/40 dark:placeholder:text-white/40"
                type="search"
              />
            </label>
          </div>
        </div>
        <aside
          aria-label="Finder locations"
          className="min-h-0 overflow-auto border-r border-black/10 bg-[#e8e8ea] px-1 py-3 sm:px-2 dark:border-white/10 dark:bg-[#252527]"
        >
          <p className="hidden px-2 pb-1 text-[10px] font-semibold tracking-wide text-black/45 uppercase sm:block dark:text-white/45">
            Favorites
          </p>
          <div className="space-y-0.5">
            {FINDER_LOCATIONS.map((location) => (
              <SidebarItem
                key={location.id}
                active={location.id === currentLocationId}
                label={location.label}
                iconSrc={location.iconSrc}
                onClick={() => navigateTo(location.id)}
              />
            ))}
          </div>
        </aside>
        <main className="grid min-h-0 grid-rows-[minmax(0,1fr)_28px] overflow-hidden bg-[#fbfbfc] dark:bg-[#1e1e20]">
          <div className="min-h-0 overflow-auto">
            {filteredItems.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-black/50 dark:text-white/50">
                <IconSearch aria-hidden stroke={1.7} className="size-6" />
                <p className="text-[13px]">No matching items</p>
              </div>
            ) : viewMode === 'list' ? (
              <div className="min-w-[500px]">
                <div className="sticky top-0 z-10 grid grid-cols-[minmax(0,1fr)_130px_110px] border-b border-black/10 bg-[#f2f2f3] px-3 py-1.5 text-[10px] font-medium text-black/50 dark:border-white/10 dark:bg-[#29292b] dark:text-white/50">
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
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-x-2 gap-y-4 px-4 py-4 sm:grid-cols-[repeat(auto-fill,minmax(116px,1fr))]">
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
            )}
          </div>
          <div className="flex items-center justify-between border-t border-black/10 bg-[#f2f2f3] px-3 text-[10px] text-black/50 dark:border-white/10 dark:bg-[#29292b] dark:text-white/50">
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
  iconSrc,
  label,
  onClick,
}: {
  active: boolean
  iconSrc: string
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-center gap-3 rounded-[8px] px-1 py-2 text-left transition sm:justify-start sm:px-2.5 ${
        active
          ? 'bg-[#2962d9]/12 text-[#2962d9] shadow-[inset_0_0_0_1px_rgba(41,98,217,0.1)]'
          : 'text-black/70 hover:bg-black/[0.04] dark:text-white/70 dark:hover:bg-white/[0.06]'
      }`}
      type="button"
    >
      <div
        className={`flex size-7 shrink-0 items-center justify-center rounded-lg transition ${
          active
            ? 'bg-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_4px_10px_rgba(41,98,217,0.12)]'
            : 'bg-white/65 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] dark:bg-white/10'
        }`}
      >
        <span
          aria-hidden
          className={`${active ? 'bg-[#2962d9]' : 'bg-black/55 dark:bg-white/60'} size-[18px]`}
          style={{
            WebkitMaskImage: `url(${iconSrc})`,
            maskImage: `url(${iconSrc})`,
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
          }}
        />
      </div>
      <span
        className={`hidden text-[13px] sm:inline ${active ? 'font-semibold' : 'font-medium'}`}
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
      className={`flex h-7 w-8 items-center justify-center transition ${active ? 'bg-[#d8d8da] text-black/80 dark:bg-white/20 dark:text-white' : 'bg-transparent text-black/55 hover:bg-black/[0.06] hover:text-black/80 dark:text-white/55 dark:hover:bg-white/[0.08] dark:hover:text-white'} ${disabled ? 'opacity-30' : ''}`}
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
      className={`grid w-full grid-cols-[minmax(0,1fr)_130px_110px] items-center px-3 py-1.5 text-left transition ${
        selected
          ? 'bg-[#2962d9] text-white'
          : 'bg-transparent text-black/75 hover:bg-black/[0.035] dark:text-white/75 dark:hover:bg-white/[0.04]'
      }`}
      type="button"
    >
      <div className="flex min-w-0 items-center gap-3">
        <FinderItemIcon item={item} selected={selected} compact />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium">{item.name}</p>
          <p
            className={`truncate text-[11px] ${selected ? 'text-white/72' : 'text-black/40 dark:text-white/40'}`}
          >
            {item.description}
          </p>
        </div>
      </div>
      <span
        className={`truncate text-[12px] ${selected ? 'text-white/78' : 'text-black/52 dark:text-white/52'}`}
      >
        {item.meta}
      </span>
      <span
        className={`truncate text-[12px] ${selected ? 'text-white/78' : 'text-black/52 dark:text-white/52'}`}
      >
        {item.detail}
      </span>
    </button>
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
