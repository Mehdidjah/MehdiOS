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
  IconBracketsAngle,
  IconChevronLeft,
  IconChevronRight,
  IconLayoutGrid,
  IconListDetails,
  IconMinus,
  IconSearch,
  IconX,
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

const FINDER_FRAME_SIZE: Size = { minW: 860, minH: 540 }

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
    description: 'Core engineering strengths across frontend, backend, and tooling.',
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
    description: 'Strong day-to-day typing discipline for React, Next.js, and API work.',
    accent: 'from-[#2f74c0] to-[#4ea7ff]',
    initials: 'TS',
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    group: 'Languages',
    level: '84%',
    description: 'Comfortable across browser APIs, app architecture, and runtime debugging.',
    accent: 'from-[#d19b00] to-[#f5d85f]',
    initials: 'JS',
  },
  {
    id: 'react',
    name: 'React',
    group: 'Frontend',
    level: '88%',
    description: 'Component systems, state composition, and polished interaction design.',
    accent: 'from-[#0a6f90] to-[#63d5ff]',
    initials: 'R',
  },
  {
    id: 'nextjs',
    name: 'Next.js',
    group: 'Frontend',
    level: '82%',
    description: 'App Router, hybrid rendering, and deployment-oriented architecture.',
    accent: 'from-[#111111] to-[#545454]',
    initials: 'N',
  },
  {
    id: 'tailwind',
    name: 'Tailwind CSS',
    group: 'Frontend',
    level: '87%',
    description: 'Rapid UI implementation with deliberate visual systems and responsive layouts.',
    accent: 'from-[#0891b2] to-[#67e8f9]',
    initials: 'TW',
  },
  {
    id: 'redux',
    name: 'Redux Toolkit',
    group: 'Frontend',
    level: '78%',
    description: 'Predictable state flows for multi-window interfaces and complex UI state.',
    accent: 'from-[#5f3dc4] to-[#9f7aea]',
    initials: 'RT',
  },
  {
    id: 'node',
    name: 'Node.js',
    group: 'Backend',
    level: '81%',
    description: 'Server logic, tooling automation, and API integrations in TypeScript.',
    accent: 'from-[#2f855a] to-[#68d391]',
    initials: 'N',
  },
  {
    id: 'nestjs',
    name: 'NestJS',
    group: 'Backend',
    level: '72%',
    description: 'Structured backend services with modules, DI, and maintainable organization.',
    accent: 'from-[#be123c] to-[#fb7185]',
    initials: 'NE',
  },
  {
    id: 'graphql',
    name: 'GraphQL',
    group: 'Backend',
    level: '45%',
    description: 'Comfortable shipping practical schemas and typed client integrations.',
    accent: 'from-[#b5179e] to-[#f472b6]',
    initials: 'G',
  },
  {
    id: 'docker',
    name: 'Docker',
    group: 'Tools',
    level: '52%',
    description: 'Enough containerization experience for local orchestration and deployment workflows.',
    accent: 'from-[#0f5db8] to-[#60a5fa]',
    initials: 'D',
  },
  {
    id: 'figma',
    name: 'Figma',
    group: 'Tools',
    level: '70%',
    description: 'Can bridge design systems, flows, and implementation details without handoff friction.',
    accent: 'from-[#f97316] to-[#f43f5e]',
    initials: 'F',
  },
  {
    id: 'git',
    name: 'Git',
    group: 'Tools',
    level: '86%',
    description: 'Comfortable with clean branching, review workflows, and change isolation.',
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

  const width = Math.min(Math.max(900, Math.floor(screenWidth * 0.72)), 1180)
  const height = Math.min(
    Math.max(560, Math.floor(screenHeight * 0.72)),
    screenHeight - topbarHeight - 32
  )

  return {
    width,
    height,
    left: Math.max(0, Math.floor((screenWidth - width) / 2)),
    top: Math.max(topbarHeight + 10, Math.floor((screenHeight - height + topbarHeight) / 2)),
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
  const { zIndex } = useSelector((state) => state.settings)
  const trashItems = useSelector((state) => state.trash.items)
  const [isFocused, setIsFocused] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [viewMode, setViewMode] = useState<FinderViewMode>('grid')
  const initialLocation = FINDER_LOCATIONS.some((location) => location.id === frame_id)
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
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 1080
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
        scale: 0.82,
      },
      {
        opacity: 1,
        scale: 1,
        ease: 'back.inOut(1.45)',
        duration: 0.5,
      }
    )

    dragRef.current = Draggable.create(frame.current, {
      trigger: frameHeader.current,
      zIndexBoost: false,
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
    if (frame.current) {
      frame.current.style.zIndex = `${zIndex}`
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setSelectedItemId(null)
  }, [currentLocationId, searchQuery, viewMode])

  const navigateTo = (locationId: FinderLocationId) => {
    if (locationId === currentLocationId) return

    const nextStack = [...navigationStack.slice(0, navigationIndex + 1), locationId]
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
    accent: item.type === 'pdf' ? 'from-[#dc2626] to-[#fb7185]' : 'from-[#2f74c0] to-[#7dd3fc]',
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
    const haystack = `${item.name} ${item.meta} ${item.detail} ${item.description}`.toLowerCase()
    return haystack.includes(searchQuery.trim().toLowerCase())
  })

  const selectedItem =
    filteredItems.find((item) => item.id === selectedItemId) ?? filteredItems[0] ?? null
  const canGoBack = navigationIndex > 0
  const canGoForward = navigationIndex < navigationStack.length - 1
  const itemCountLabel = `${filteredItems.length} item${filteredItems.length === 1 ? '' : 's'}`

  const primaryActionLabel =
    currentLocationId === 'trash'
      ? selectedItem?.trashItem
        ? 'Put Back'
        : 'Empty Trash'
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
      onContextMenu={(event) => {
        event.stopPropagation()
      }}
      onMouseDown={() => {
        dispatch(setActiveApp({ name: 'Finder' }))
        handleZIndex()
        setIsFocused(true)
      }}
      ref={frame}
      className={`absolute min-h-[420px] min-w-0 max-w-full overflow-hidden rounded-[24px] border border-white/40 bg-white/58 shadow-[0_32px_80px_rgba(15,23,42,0.28)] backdrop-blur-[34px] ${
        isFocused ? 'brightness-100' : 'brightness-90 saturate-75'
      } ${status === 'minimize' ? 'hidden' : ''}`}
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif",
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.92),_rgba(255,255,255,0.58)_38%,_rgba(227,235,247,0.44)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.75),rgba(255,255,255,0.36)_42%,rgba(214,226,242,0.26))]" />
      {!isFullscreen && (
        <>
          <div ref={t} className="absolute top-0 z-20 h-1 w-full cursor-ns-resize bg-transparent" />
          <div ref={b} className="absolute bottom-0 z-20 h-1 w-full cursor-ns-resize bg-transparent" />
          <div ref={r} className="absolute right-0 z-20 h-full w-1 cursor-ew-resize bg-transparent" />
          <div ref={l} className="absolute left-0 z-20 h-full w-1 cursor-ew-resize bg-transparent" />
          <div ref={tl} className="absolute left-0 top-0 z-20 size-2 cursor-nwse-resize bg-transparent" />
          <div ref={tr} className="absolute right-0 top-0 z-20 size-2 cursor-nesw-resize bg-transparent" />
          <div ref={bl} className="absolute bottom-0 left-0 z-20 size-2 cursor-nesw-resize bg-transparent" />
          <div ref={br} className="absolute bottom-0 right-0 z-20 size-2 cursor-nwse-resize bg-transparent" />
        </>
      )}

      <div className="relative grid h-full grid-rows-[54px_1fr]">
        <div
          ref={frameHeader}
          onDoubleClick={onFullScreen}
          className="grid cursor-custom-auto! grid-cols-[auto_1fr_auto] items-center border-b border-black/7 bg-white/45 px-4 backdrop-blur-xl"
        >
          <div className="group flex items-center gap-2">
            <TrafficLightButton color="bg-rose-500" onClick={onClose}>
              <IconX className="size-3 text-black/75 opacity-0 transition-opacity group-hover:opacity-100" />
            </TrafficLightButton>
            <TrafficLightButton color="bg-amber-400" onClick={onMinimize}>
              <IconMinus className="size-3 text-black/75 opacity-0 transition-opacity group-hover:opacity-100" />
            </TrafficLightButton>
            <TrafficLightButton color="bg-emerald-500" onClick={onFullScreen}>
              <IconBracketsAngle className="size-3 -rotate-45 text-black/75 opacity-0 transition-opacity group-hover:opacity-100" />
            </TrafficLightButton>
          </div>

          <div />

          <div className="hidden items-center gap-2 md:flex">
            <WindowActionChip label="Left Half" onClick={onLeftScreen} />
            <WindowActionChip label="Right Half" onClick={onRightScreen} />
          </div>
        </div>

        <div className="grid min-h-0 grid-cols-[210px_1fr] bg-white/38">
          <aside className="relative min-h-0 overflow-hidden border-r border-black/7 bg-[linear-gradient(180deg,rgba(246,247,250,0.82),rgba(232,235,240,0.74))]">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.64),rgba(255,255,255,0)_58%)]" />
            <div className="relative flex h-full flex-col px-3 pb-4 pt-5">
              <p className="px-3 text-[11px] font-semibold tracking-[0.18em] text-black/35 uppercase">
                Favorites
              </p>
              <div className="mt-3 space-y-1">
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

              <div className="mt-auto rounded-[18px] border border-white/55 bg-white/48 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                <p className="text-[11px] font-semibold tracking-[0.16em] text-black/35 uppercase">
                  Status
                </p>
                <p className="mt-2 text-[13px] font-semibold text-black/80">
                  {currentLocation.label}
                </p>
                <p className="mt-1 text-[11px] leading-4 text-black/45">
                  {currentLocation.description}
                </p>
              </div>
            </div>
          </aside>

          <main className="grid min-h-0 grid-rows-[52px_auto_1fr_36px] overflow-hidden">
            <div className="flex items-center gap-3 border-b border-black/7 bg-white/42 px-4 backdrop-blur-xl">
              <div className="flex items-center overflow-hidden rounded-[10px] border border-black/8 bg-white/78 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <ToolbarButton
                  active={false}
                  disabled={!canGoBack}
                  onClick={() => navigateHistory('back')}
                >
                  <IconChevronLeft stroke={2} className="size-4" />
                </ToolbarButton>
                <div className="h-4 w-px bg-black/10" />
                <ToolbarButton
                  active={false}
                  disabled={!canGoForward}
                  onClick={() => navigateHistory('forward')}
                >
                  <IconChevronRight stroke={2} className="size-4" />
                </ToolbarButton>
              </div>

              <div className="flex items-center overflow-hidden rounded-[10px] border border-black/8 bg-white/78 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <ToolbarButton
                  active={viewMode === 'list'}
                  onClick={() => setViewMode('list')}
                >
                  <IconListDetails stroke={2} className="size-4" />
                </ToolbarButton>
                <div className="h-4 w-px bg-black/10" />
                <ToolbarButton
                  active={viewMode === 'grid'}
                  onClick={() => setViewMode('grid')}
                >
                  <IconLayoutGrid stroke={2} className="size-4" />
                </ToolbarButton>
              </div>

              <div className="hidden min-w-0 items-center rounded-full border border-black/8 bg-white/72 px-3 py-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:flex">
                <span className="truncate text-[12px] font-medium text-black/70">
                  {currentLocation.label}
                </span>
              </div>

              <div className="ml-auto flex min-w-[130px] items-center gap-2 rounded-full border border-black/8 bg-white/75 px-3 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
                <IconSearch stroke={1.8} className="size-3.5 text-black/40" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={`Search ${currentLocation.label}`}
                  className="w-full bg-transparent text-[12px] text-black/80 outline-hidden placeholder:text-black/35"
                  type="text"
                />
              </div>
            </div>

            <div className="mx-3 mt-3 mb-4 flex items-end justify-between rounded-[20px] border border-white/55 bg-[linear-gradient(180deg,rgba(255,255,255,0.7),rgba(247,249,252,0.88))] px-5 pb-4 pt-6 shadow-[0_12px_28px_rgba(15,23,42,0.07),inset_0_1px_0_rgba(255,255,255,0.82)]">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold tracking-[0.18em] text-black/35 uppercase">
                  {currentLocation.label}
                </p>
                <h2 className="mt-1 truncate text-[24px] font-semibold tracking-[-0.03em] text-slate-900">
                  {selectedItem?.name || currentLocation.label}
                </h2>
                <p className="mt-1 line-clamp-2 max-w-2xl text-[13px] leading-5 text-slate-500">
                  {selectedItem?.description || currentLocation.description}
                </p>
              </div>

              <div className="ml-4 flex shrink-0 items-center gap-3">
                <div className="hidden rounded-full bg-slate-900/[0.04] px-3 py-1 text-[12px] font-medium text-slate-500 sm:block">
                  {itemCountLabel}
                </div>
                {primaryActionLabel && (
                  <button
                    onClick={runPrimaryAction}
                    className="rounded-[9px] bg-[#2962d9] px-4 py-2 text-[12px] font-semibold text-white shadow-[0_8px_18px_rgba(41,98,217,0.22)] transition hover:bg-[#2154c2] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                    disabled={currentLocationId === 'trash' && filteredItems.length === 0}
                    type="button"
                  >
                    {primaryActionLabel}
                  </button>
                )}
              </div>
            </div>

            <div className="min-h-0 overflow-auto bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(247,248,252,0.9))] px-3 pb-5">
              {filteredItems.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                  <div className="flex size-14 items-center justify-center rounded-full bg-black/5 text-black/35">
                    <IconSearch stroke={1.7} className="size-6" />
                  </div>
                  <div>
                    <p className="text-[16px] font-semibold text-black/75">No matching items</p>
                    <p className="mt-1 text-[13px] text-black/45">
                      Try another search or switch to a different Finder section.
                    </p>
                  </div>
                </div>
              ) : viewMode === 'list' ? (
                <div className="min-w-[520px] overflow-hidden rounded-[20px] border border-white/50 bg-white/44 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
                  <div className="sticky top-0 z-10 grid grid-cols-[minmax(0,1fr)_180px_160px] border-b border-black/7 bg-white/86 px-3 py-2 text-[11px] font-semibold tracking-[0.14em] text-black/35 uppercase backdrop-blur-xl">
                    <span>{columnLabels.primary}</span>
                    <span>{columnLabels.secondary}</span>
                    <span>{columnLabels.tertiary}</span>
                  </div>
                  <div className="divide-y divide-black/[0.04]">
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
                </div>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-4 px-5 pb-5 pt-7">
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

            <div className="flex items-center justify-between border-t border-black/7 bg-white/52 px-4 text-[12px] text-black/45 backdrop-blur-xl">
              <span>{itemCountLabel}</span>
              <span className="truncate">
                {searchQuery ? `Filtered by “${searchQuery}”` : `Browsing ${currentLocation.label}`}
              </span>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

function TrafficLightButton({
  children,
  color,
  onClick,
}: {
  children: ReactNode
  color: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex size-3.5 items-center justify-center rounded-full"
      type="button"
    >
      <span className={`flex size-3.5 items-center justify-center rounded-full ${color}`}>
        {children}
      </span>
    </button>
  )
}

function WindowActionChip({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-full bg-black/[0.04] px-3 py-1 text-[11px] font-medium text-black/50 transition hover:bg-black/[0.07] hover:text-black/75"
      type="button"
    >
      {label}
    </button>
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
      className={`flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-left transition ${
        active
          ? 'bg-[#2962d9]/12 text-[#2962d9] shadow-[inset_0_0_0_1px_rgba(41,98,217,0.1)]'
          : 'text-black/70 hover:bg-black/[0.04]'
      }`}
      type="button"
    >
      <div
        className={`flex size-7 shrink-0 items-center justify-center rounded-lg transition ${
          active
            ? 'bg-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_4px_10px_rgba(41,98,217,0.12)]'
            : 'bg-white/65 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]'
        }`}
      >
        <span
          aria-hidden
          className={`${active ? 'bg-[#2962d9]' : 'bg-black/55'} size-[18px]`}
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
      <span className={`text-[13px] ${active ? 'font-semibold' : 'font-medium'}`}>
        {label}
      </span>
    </button>
  )
}

function ToolbarButton({
  active,
  children,
  disabled = false,
  onClick,
}: {
  active: boolean
  children: ReactNode
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex h-8 w-9 items-center justify-center transition ${
        active
          ? 'bg-black/[0.09] text-black/75'
          : 'bg-transparent text-black/55 hover:bg-black/[0.05] hover:text-black/75'
      } ${disabled ? 'pointer-events-none opacity-30' : ''}`}
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
      className={`grid w-full grid-cols-[minmax(0,1fr)_180px_160px] items-center px-3 py-2 text-left transition ${
        selected
          ? 'bg-[#2962d9] text-white'
          : 'bg-transparent text-black/75 hover:bg-black/[0.035]'
      }`}
      type="button"
    >
      <div className="flex min-w-0 items-center gap-3">
        <FinderItemIcon item={item} selected={selected} compact />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium">{item.name}</p>
          <p className={`truncate text-[11px] ${selected ? 'text-white/72' : 'text-black/40'}`}>
            {item.description}
          </p>
        </div>
      </div>
      <span className={`truncate text-[12px] ${selected ? 'text-white/78' : 'text-black/52'}`}>
        {item.meta}
      </span>
      <span className={`truncate text-[12px] ${selected ? 'text-white/78' : 'text-black/52'}`}>
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
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`group flex min-h-[190px] flex-col rounded-[20px] border px-4 py-4 text-left transition ${
        selected
          ? 'border-[#2962d9]/35 bg-[#2962d9]/10 shadow-[0_20px_36px_rgba(41,98,217,0.12)]'
          : 'border-black/5 bg-white/75 shadow-[0_14px_30px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:border-black/10 hover:shadow-[0_20px_40px_rgba(15,23,42,0.1)]'
      }`}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <FinderItemIcon item={item} selected={selected} />
        <span className="rounded-full bg-black/[0.04] px-2 py-1 text-[10px] font-semibold tracking-[0.16em] text-black/40 uppercase">
          {item.meta}
        </span>
      </div>
      <div className="mt-4 min-w-0">
        <p className="truncate text-[15px] font-semibold tracking-[-0.02em] text-slate-900">
          {item.name}
        </p>
        <p className="mt-1 text-[12px] font-medium text-slate-500">{item.detail}</p>
      </div>
      <p className="mt-3 line-clamp-3 text-[12px] leading-5 text-slate-500">
        {item.description}
      </p>
      <div className="mt-auto pt-4">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            selected ? 'bg-white/80 text-[#2154c2]' : 'bg-black/[0.04] text-black/50'
          }`}
        >
          {item.onOpen ? 'Double-click to open' : 'Click to inspect'}
        </span>
      </div>
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
  const sizeClass = compact ? 'size-10 rounded-[12px]' : 'size-14 rounded-[18px]'
  const imageClass = compact ? 'size-8' : 'size-12'

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
      <span className={`font-semibold ${compact ? 'text-[13px]' : 'text-[18px]'}`}>
        {item.initials || item.name.slice(0, 1)}
      </span>
      {selected && !compact && (
        <span className="absolute right-2 top-2 size-2 rounded-full bg-white/80" />
      )}
    </div>
  )
}
