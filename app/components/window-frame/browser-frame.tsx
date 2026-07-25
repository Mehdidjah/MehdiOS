'use client'

import {
  addNewtab,
  focusTab,
  removeTab,
  resetChrome,
  updateTab,
} from '@/app/features/chrome'
import { setActiveApp, setZIndex } from '@/app/features/settings'
import { closeFolder, minimizeFolder } from '@/app/features/window-slice'
import { Size, useResize } from '@/app/hooks/use-resize'
import { useClickOutside } from '@/app/hooks/use-click-outside'
import { useDispatch, useSelector } from '@/app/store'
import { newIconSrc } from '@/app/utils/icon-paths'
import { useGSAP } from '@gsap/react'
import { useTheme } from 'next-themes'
import {
  IconArrowLeft,
  IconArrowRight,
  IconBookmark,
  IconCheck,
  IconHome,
  IconLayoutSidebarLeftExpand,
  IconLock,
  IconPlus,
  IconReload,
  IconSearch,
  IconShare,
  IconShieldCheck,
  IconX,
} from '@tabler/icons-react'
import gsap from 'gsap'
import { Draggable } from 'gsap/Draggable'
import Image, { type StaticImageData } from 'next/image'
import {
  type CSSProperties,
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { MacTrafficLights } from './mac-traffic-lights'
import { projects } from '../projects/projects'
import { Status } from '../folder/folders'

type TabHistoryState = {
  entries: string[]
  index: number
}

type TabHistoryMap = Record<string, TabHistoryState>

type BrowserShortcut = {
  id: string
  label: string
  subtitle: string
  description: string
  url: string
  thumbnail?: StaticImageData
}

type SearchResult = {
  title: string
  url: string
  snippet: string
  source: string
}

const BROWSER_FRAME_SIZE: Size = { minW: 720, minH: 480 }
const DESKTOP_DOCK_SPACE = 80

const getBrowserSize = () => {
  if (typeof window === 'undefined') {
    return BROWSER_FRAME_SIZE
  }

  if (window.innerWidth < 768) {
    return {
      minW: 320,
      minH: 420,
    }
  }

  return BROWSER_FRAME_SIZE
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
    width: 780,
    height: 520,
    left: 100,
    top: 60,
  }
}

const BROWSER_PROXY_PATH = '/api/browser/proxy'
const SEARCH_URL_PREFIX = 'search:'

const isSearchUrl = (rawUrl: string) => rawUrl.startsWith(SEARCH_URL_PREFIX)

const buildProxyUrl = (rawUrl: string) =>
  `${BROWSER_PROXY_PATH}?url=${encodeURIComponent(rawUrl)}`

const getHostname = (rawUrl: string) => {
  if (isSearchUrl(rawUrl)) {
    return 'Search results'
  }

  try {
    return new URL(rawUrl).hostname.replace(/^www\./, '')
  } catch {
    return rawUrl
  }
}

const isLikelyUrl = (value: string) => {
  try {
    new URL(value)
    return true
  } catch {
    return value.includes('.') && !value.includes(' ')
  }
}

const formatBrowserUrl = (input: string) => {
  const trimmed = input.trim()

  if (!trimmed) return ''

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }

  if (isLikelyUrl(trimmed)) {
    return `https://${trimmed}`
  }

  return ''
}

const getSearchToken = (query: string) =>
  `${SEARCH_URL_PREFIX}${encodeURIComponent(query.trim())}`

const getSearchQuery = (rawUrl: string) =>
  isSearchUrl(rawUrl)
    ? decodeURIComponent(rawUrl.slice(SEARCH_URL_PREFIX.length))
    : ''

const normalizeHistoryUrl = (rawUrl?: string) => {
  if (!rawUrl) return ''
  if (isSearchUrl(rawUrl)) return rawUrl

  try {
    return new URL(rawUrl).href
  } catch {
    return rawUrl
  }
}

const areHistoryUrlsEqual = (left: string | undefined, right: string) =>
  normalizeHistoryUrl(left) === normalizeHistoryUrl(right)

export function BrowserFrame({
  frameName,
  frame_id,
  status,
}: {
  frameName: string
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
  const { activeApp, zIndex, wallpaper } = useSelector(
    (state) => state.settings
  )
  const { resolvedTheme } = useTheme()
  const { focusedTab, tabs } = useSelector((state) => state.chrome)
  const [isFocused, setIsFocused] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [iframeRefreshKey, setIframeRefreshKey] = useState(0)
  const [historyByTab, setHistoryByTab] = useState<TabHistoryMap>({})
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searchRefreshKey, setSearchRefreshKey] = useState(0)
  const [isTabStripVisible, setIsTabStripVisible] = useState(true)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle')
  const size = getBrowserSize()
  const activeTab = tabs.find((tab) => tab.id === focusedTab)
  const activeSearchQuery = activeTab ? getSearchQuery(activeTab.url) : ''
  const activeFrameUrl = activeTab?.iframe_url || activeTab?.url || ''
  const wallpaperSrc = wallpaper
    ? (resolvedTheme === 'dark' ? wallpaper.dark : wallpaper.light).src
    : undefined

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

    const isMobile = window.innerWidth < 768
    fullscreenTL.current.to(frame.current, {
      width: '100vw',
      height: `${window.innerHeight - 28 - (isMobile ? 0 : DESKTOP_DOCK_SPACE)}px`,
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

  const seedHistoryForTab = useCallback((tabId: string, rawUrl: string) => {
    setHistoryByTab((prev) => {
      const existing = prev[tabId]

      if (!rawUrl) {
        if (existing) return prev
        return {
          ...prev,
          [tabId]: { entries: [], index: -1 },
        }
      }

      if (!existing) {
        return {
          ...prev,
          [tabId]: { entries: [rawUrl], index: 0 },
        }
      }

      const currentEntry = existing.entries[existing.index]
      if (areHistoryUrlsEqual(currentEntry, rawUrl)) {
        return prev
      }

      const knownIndex = existing.entries.findLastIndex((entry) =>
        areHistoryUrlsEqual(entry, rawUrl)
      )
      if (knownIndex !== -1) {
        return {
          ...prev,
          [tabId]: {
            ...existing,
            index: knownIndex,
          },
        }
      }

      const nextEntries = [
        ...existing.entries.slice(0, Math.max(existing.index, -1) + 1),
        rawUrl,
      ]

      return {
        ...prev,
        [tabId]: {
          entries: nextEntries,
          index: nextEntries.length - 1,
        },
      }
    })
  }, [])

  const navigateToUrl = useCallback(
    (rawInput: string, title?: string) => {
      if (!activeTab) return

      const trimmedInput = rawInput.trim()
      if (!trimmedInput) return

      if (
        !isLikelyUrl(trimmedInput) &&
        !trimmedInput.startsWith('http://') &&
        !trimmedInput.startsWith('https://')
      ) {
        const searchToken = getSearchToken(trimmedInput)

        seedHistoryForTab(activeTab.id, searchToken)
        dispatch(
          updateTab({
            iframe_url: '',
            url: searchToken,
            title: title || trimmedInput,
          })
        )
        setUrlInput(trimmedInput)
        return
      }

      const formattedUrl = formatBrowserUrl(trimmedInput)
      if (!formattedUrl) return

      seedHistoryForTab(activeTab.id, formattedUrl)
      dispatch(
        updateTab({
          iframe_url: formattedUrl,
          url: formattedUrl,
          title,
        })
      )
      setUrlInput(formattedUrl)
    },
    [activeTab, dispatch, seedHistoryForTab]
  )

  const handleUrlSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    navigateToUrl(urlInput)
  }

  const activeTabHistory = (activeTab && historyByTab[activeTab.id]) || {
    entries: [],
    index: -1,
  }

  const canGoBack = activeTabHistory.index > 0
  const canGoForward =
    activeTabHistory.index >= 0 &&
    activeTabHistory.index < activeTabHistory.entries.length - 1

  const handleHistoryMove = (direction: -1 | 1) => {
    if (!activeTab) return

    const currentHistory = historyByTab[activeTab.id]
    if (!currentHistory) return

    const nextIndex = currentHistory.index + direction
    if (nextIndex < 0 || nextIndex >= currentHistory.entries.length) return

    const nextUrl = currentHistory.entries[nextIndex]

    setHistoryByTab((prev) => ({
      ...prev,
      [activeTab.id]: {
        ...currentHistory,
        index: nextIndex,
      },
    }))

    dispatch(
      updateTab({
        iframe_url: isSearchUrl(nextUrl) ? '' : nextUrl,
        url: nextUrl,
      })
    )
    setUrlInput(isSearchUrl(nextUrl) ? getSearchQuery(nextUrl) : nextUrl)
  }

  const handleHome = () => {
    if (!activeTab) return

    setHistoryByTab((prev) => ({
      ...prev,
      [activeTab.id]: {
        entries: [],
        index: -1,
      },
    }))

    dispatch(updateTab({ iframe_url: '', url: '', title: 'Start Page' }))
    setUrlInput('')
  }

  const handleRefresh = () => {
    if (activeSearchQuery) {
      setSearchRefreshKey((prev) => prev + 1)
      return
    }

    if (!activeFrameUrl) return
    setIframeRefreshKey((prev) => prev + 1)
  }

  const handleNewTab = () => {
    dispatch(addNewtab())
    setUrlInput('')
  }

  const handleShare = async () => {
    const url = activeTab?.iframe_url || activeTab?.url
    if (!url || isSearchUrl(url)) return

    try {
      if (navigator.share) {
        await navigator.share({
          title: activeTab?.title || 'MehdiOS Safari',
          url,
        })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url)
        setShareStatus('copied')
        window.setTimeout(() => setShareStatus('idle'), 1800)
      }
    } catch {
      // A cancelled native share sheet does not need browser feedback.
    }
  }

  const handleBookmark = () => {
    if (!activeFrameUrl || activeSearchQuery) return
    setIsBookmarked((previous) => !previous)
  }

  const handleCloseTab = (tabId: string) => {
    setHistoryByTab((prev) => {
      const next = { ...prev }
      delete next[tabId]
      return next
    })

    if (tabs.length === 1) {
      dispatch(resetChrome())
      onClose()
      return
    }

    dispatch(removeTab(tabId))
  }

  const shortcuts = useMemo<BrowserShortcut[]>(
    () => [
      {
        id: 'apple',
        label: 'Apple',
        subtitle: 'apple.com',
        description: 'Browse the latest Apple product pages.',
        url: 'https://apple.com',
      },
      {
        id: 'github',
        label: 'GitHub',
        subtitle: 'github.com/Mehdidjah',
        description: 'Open MehdiOS source and related project work.',
        url: 'https://github.com/Mehdidjah',
      },
      ...projects.slice(0, 2).map((project) => ({
        id: String(project.id),
        label: project.title,
        subtitle: getHostname(project.live_url),
        description: project.description,
        url: project.live_url,
        thumbnail: project.thumbnail,
      })),
    ],
    []
  )

  useClickOutside(() => {
    setIsFocused(false)
  }, frame)

  useEffect(() => {
    if (activeApp?.id === frame_id && frame.current) {
      frame.current.style.zIndex = `${zIndex}`
    }
  }, [activeApp?.id, frame_id, zIndex])

  useEffect(() => {
    if (!activeTab) return

    setUrlInput(activeSearchQuery || activeTab.url || '')
    seedHistoryForTab(activeTab.id, activeTab.iframe_url || activeTab.url)
  }, [activeSearchQuery, activeTab, seedHistoryForTab])

  useEffect(() => {
    if (!activeSearchQuery) {
      setSearchResults([])
      setIsSearching(false)
      setSearchError(null)
      return
    }

    let cancelled = false

    const fetchResults = async () => {
      setIsSearching(true)
      setSearchError(null)

      try {
        const response = await fetch(
          `/api/browser/search?q=${encodeURIComponent(activeSearchQuery)}`,
          { cache: 'no-store' }
        )

        if (!response.ok) {
          throw new Error('Search failed')
        }

        const data = (await response.json()) as {
          results?: SearchResult[]
          error?: string
        }

        if (cancelled) return

        if (data.error) {
          setSearchError(data.error)
          setSearchResults([])
          return
        }

        setSearchResults(data.results || [])
      } catch {
        if (!cancelled) {
          setSearchError('Unable to load search results right now.')
          setSearchResults([])
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false)
        }
      }
    }

    void fetchResults()

    return () => {
      cancelled = true
    }
  }, [activeSearchQuery, searchRefreshKey])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        !activeTab ||
        activeSearchQuery
      ) {
        return
      }

      const data = event.data as {
        type?: string
        url?: string
        title?: string
      }

      if (data.type !== 'browser:page' || !data.url) {
        return
      }

      const nextUrl = data.url.trim()
      const nextTitle = data.title?.trim()

      if (!nextUrl || isSearchUrl(nextUrl)) {
        return
      }

      if (nextUrl !== activeTab.url) {
        seedHistoryForTab(activeTab.id, nextUrl)
        dispatch(
          updateTab({
            url: nextUrl,
            iframe_url: nextUrl,
            ...(nextTitle ? { title: nextTitle } : {}),
          })
        )
        setUrlInput(nextUrl)
        return
      }

      if (nextTitle && nextTitle !== activeTab.title) {
        dispatch(updateTab({ title: nextTitle }))
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [activeSearchQuery, activeTab, dispatch, seedHistoryForTab])

  return (
    <div
      aria-label={`${frameName} window`}
      onContextMenu={(event) => event.stopPropagation()}
      onMouseDown={() => {
        dispatch(setActiveApp({ id: frame_id, name: frameName }))
        handleZIndex()
        setIsFocused(true)
      }}
      ref={frame}
      className={`absolute min-h-[420px] max-w-full min-w-0 overflow-hidden border border-white/[0.14] bg-[rgba(25,25,28,0.88)] backdrop-blur-[40px] md:min-h-[480px] md:min-w-[720px] ${
        isFullscreen ? 'rounded-none' : 'md:rounded-[20px]'
      } ${
        isFocused
          ? 'shadow-[0_28px_80px_rgba(0,0,0,0.48),0_1px_0_rgba(255,255,255,0.12)_inset]'
          : 'shadow-[0_16px_44px_rgba(0,0,0,0.32),0_1px_0_rgba(255,255,255,0.06)_inset]'
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

      <div
        className={`relative grid h-full bg-[rgba(25,25,28,0.88)] ${
          isTabStripVisible
            ? 'grid-rows-[44px_32px_1fr]'
            : 'grid-rows-[44px_1fr]'
        }`}
      >
        <div
          ref={frameHeader}
          onDoubleClick={onFullScreen}
          className="grid grid-cols-[100px_minmax(0,1fr)_100px] items-center border-b border-white/[0.1] bg-[rgba(30,30,35,0.86)] px-3 backdrop-blur-[40px]"
        >
          <div className="flex w-[100px] items-center gap-2">
            <MacTrafficLights
              appName={frameName}
              isActive={isFocused}
              isFullscreen={isFullscreen}
              onClose={() => {
                dispatch(resetChrome())
                onClose()
              }}
              onMinimize={onMinimize}
              onZoom={onFullScreen}
            />
            <ToolbarIconButton
              ariaLabel={isTabStripVisible ? 'Hide tab bar' : 'Show tab bar'}
              onClick={() => setIsTabStripVisible((visible) => !visible)}
            >
              <IconLayoutSidebarLeftExpand className="size-4" stroke={1.8} />
            </ToolbarIconButton>
          </div>

          <div className="flex min-w-0 items-center justify-center gap-2">
            <div className="hidden shrink-0 items-center sm:flex">
              <ToolbarIconButton
                ariaLabel="Back"
                disabled={!canGoBack}
                onClick={() => handleHistoryMove(-1)}
              >
                <IconArrowLeft className="size-3.5" stroke={2} />
              </ToolbarIconButton>
              <ToolbarIconButton
                ariaLabel="Forward"
                disabled={!canGoForward}
                onClick={() => handleHistoryMove(1)}
              >
                <IconArrowRight className="size-3.5" stroke={2} />
              </ToolbarIconButton>
            </div>
            <form
              onSubmit={handleUrlSubmit}
              className="flex h-[30px] w-full max-w-[500px] min-w-0 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.12] px-2.5 transition focus-within:border-[#0a84ff]/60 focus-within:bg-white/[0.17] focus-within:ring-2 focus-within:ring-[#0a84ff]/20"
            >
              {activeSearchQuery || !activeTab?.iframe_url ? (
                <IconSearch
                  className="size-3.5 shrink-0 text-white/40"
                  stroke={2}
                />
              ) : (
                <IconLock
                  className="size-3.5 shrink-0 text-white/45"
                  stroke={2}
                />
              )}
              <input
                value={urlInput}
                onChange={(event) => setUrlInput(event.target.value)}
                type="text"
                placeholder="Search or enter website name"
                aria-label="Safari address and search"
                className="w-full min-w-0 bg-transparent text-center text-[12.5px] text-white/90 outline-hidden placeholder:text-white/35 focus:text-left"
              />
              <button
                type="button"
                onClick={handleRefresh}
                className={`flex size-5 shrink-0 items-center justify-center rounded text-white/45 transition hover:bg-white/[0.1] hover:text-white/85 ${
                  activeSearchQuery || activeFrameUrl
                    ? ''
                    : 'pointer-events-none opacity-40'
                }`}
                aria-label="Refresh page"
              >
                <IconReload className="size-3.5" stroke={1.8} />
              </button>
            </form>
          </div>

          <div className="flex w-[100px] items-center justify-end gap-0.5">
            <ToolbarIconButton
              ariaLabel={
                shareStatus === 'copied' ? 'Link copied' : 'Share page'
              }
              onClick={handleShare}
            >
              {shareStatus === 'copied' ? (
                <IconCheck className="size-4" stroke={2} />
              ) : (
                <IconShare className="size-4" stroke={1.8} />
              )}
            </ToolbarIconButton>
            <ToolbarIconButton
              ariaLabel={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
              onClick={handleBookmark}
            >
              <IconBookmark
                className={`size-4 ${isBookmarked ? 'fill-current' : ''}`}
                stroke={1.8}
              />
            </ToolbarIconButton>
            <ToolbarIconButton ariaLabel="Open start page" onClick={handleHome}>
              <IconHome className="size-4" stroke={1.8} />
            </ToolbarIconButton>
          </div>
        </div>

        {isTabStripVisible && (
          <div
            className="flex h-8 items-center gap-1 overflow-x-auto border-b border-white/[0.08] bg-[rgba(30,30,35,0.86)] px-2 backdrop-blur-[40px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="Safari tabs"
          >
            {tabs.map((tab) => {
              const active = tab.id === focusedTab
              return (
                <div
                  className={`group flex h-6 max-w-[200px] min-w-[104px] items-center rounded-md border px-1 transition ${
                    active
                      ? 'border-white/[0.12] bg-white/[0.18] text-white'
                      : 'border-transparent bg-white/[0.06] text-white/70 hover:bg-white/[0.12]'
                  }`}
                  key={tab.id}
                >
                  <button
                    aria-selected={active}
                    className="flex min-w-0 flex-1 items-center gap-1.5 px-1.5 text-left"
                    onClick={() => dispatch(focusTab(tab.id))}
                    role="tab"
                    type="button"
                  >
                    <Image
                      alt=""
                      className="shrink-0 object-contain"
                      height={13}
                      src={newIconSrc.safari}
                      width={13}
                    />
                    <span className="truncate text-[11px] font-medium">
                      {tab.title || 'New Tab'}
                    </span>
                  </button>
                  <button
                    aria-label={`Close ${tab.title || 'tab'}`}
                    className="flex size-4 shrink-0 items-center justify-center rounded text-white/45 hover:bg-white/[0.14] hover:text-white"
                    onClick={() => handleCloseTab(tab.id)}
                    type="button"
                  >
                    <IconX aria-hidden className="size-3" stroke={2} />
                  </button>
                </div>
              )
            })}
            <ToolbarIconButton ariaLabel="New tab" onClick={handleNewTab}>
              <IconPlus className="size-3.5" stroke={2} />
            </ToolbarIconButton>
          </div>
        )}

        <div className="min-h-0 overflow-hidden bg-[#16161a]">
          {activeSearchQuery ? (
            <div className="h-full overflow-auto bg-[#1a1a1e] px-4 py-5 text-white sm:px-7">
              <div className="mx-auto w-full max-w-3xl">
                <p className="text-[11px] font-medium tracking-[0.12em] text-white/45 uppercase">
                  Search results
                </p>
                <h2 className="mt-1 truncate text-xl font-semibold tracking-[-0.03em]">
                  {activeSearchQuery}
                </h2>
                <div className="mt-5 space-y-2.5">
                  {isSearching ? (
                    <SearchStatus>Searching for results...</SearchStatus>
                  ) : searchError ? (
                    <SearchStatus>{searchError}</SearchStatus>
                  ) : searchResults.length === 0 ? (
                    <SearchStatus>
                      No results found for this query.
                    </SearchStatus>
                  ) : (
                    searchResults.map((result, index) => (
                      <button
                        key={`${result.url}-${index}`}
                        onClick={() => navigateToUrl(result.url, result.title)}
                        className="w-full rounded-xl border border-white/[0.1] bg-white/[0.07] p-3.5 text-left transition hover:bg-white/[0.12]"
                        type="button"
                      >
                        <p className="text-[11px] font-medium text-[#64b5ff]">
                          {result.source}
                        </p>
                        <h3 className="mt-1 text-[15px] font-semibold text-white">
                          {result.title}
                        </h3>
                        <p className="mt-1.5 line-clamp-2 text-[12px] leading-5 text-white/55">
                          {result.snippet || result.url}
                        </p>
                        <p className="mt-2 truncate text-[11px] text-white/35">
                          {result.url}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : activeFrameUrl ? (
            <iframe
              key={`${activeTab?.id ?? 'tab'}:${activeFrameUrl}:${iframeRefreshKey}`}
              className="block h-full w-full border-0 bg-white"
              src={buildProxyUrl(activeFrameUrl)}
              title={activeTab?.title || 'Safari'}
              allowFullScreen
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation allow-popups-to-escape-sandbox allow-modals"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              className="relative h-full overflow-auto bg-cover bg-center [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{
                backgroundImage: wallpaperSrc
                  ? `url(${wallpaperSrc})`
                  : undefined,
              }}
            >
              <div className="absolute inset-0 bg-black/[0.42] backdrop-blur-[3px]" />
              <div className="relative mx-auto flex w-full max-w-[760px] flex-col gap-5 px-5 py-5 text-white sm:px-8">
                <section aria-labelledby="favorites-heading">
                  <h2
                    id="favorites-heading"
                    className="mb-3 text-[15px] font-semibold drop-shadow"
                  >
                    Favorites
                  </h2>
                  <div className="flex flex-wrap gap-x-4 gap-y-3">
                    {shortcuts.map((shortcut) => (
                      <button
                        key={shortcut.id}
                        onClick={() =>
                          navigateToUrl(shortcut.url, shortcut.label)
                        }
                        className="group flex w-[62px] flex-col items-center gap-1.5"
                        type="button"
                      >
                        <span className="relative flex size-11 items-center justify-center overflow-hidden rounded-xl border border-white/20 bg-white/[0.16] shadow-[0_4px_14px_rgba(0,0,0,0.32)] transition group-hover:-translate-y-0.5 group-hover:bg-white/[0.26]">
                          {shortcut.thumbnail ? (
                            <Image
                              alt=""
                              fill
                              src={shortcut.thumbnail}
                              className="object-cover"
                            />
                          ) : (
                            <span className="text-lg font-semibold text-white/85">
                              {shortcut.label.slice(0, 1)}
                            </span>
                          )}
                        </span>
                        <span className="w-full truncate text-center text-[10px] font-medium text-white/90 drop-shadow">
                          {shortcut.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>

                <section aria-labelledby="privacy-heading">
                  <h2
                    id="privacy-heading"
                    className="mb-3 text-[15px] font-semibold drop-shadow"
                  >
                    Privacy Report
                  </h2>
                  <div className="flex items-center gap-3 rounded-[13px] border border-white/[0.14] bg-[rgba(40,40,46,0.62)] px-4 py-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.2)] backdrop-blur-[20px]">
                    <IconShieldCheck
                      className="size-5 shrink-0 text-white/55"
                      stroke={1.7}
                    />
                    <p className="text-[12.5px] leading-5 text-white/70">
                      MehdiOS keeps browsing inside this window. Sites are
                      loaded through its browser proxy, and this start page does
                      not claim tracker blocking or IP masking.
                    </p>
                  </div>
                </section>

                <section aria-labelledby="portfolio-heading">
                  <h2
                    id="portfolio-heading"
                    className="mb-3 text-[15px] font-semibold drop-shadow"
                  >
                    Continue exploring
                  </h2>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {shortcuts
                      .filter((shortcut) => shortcut.id !== 'apple')
                      .slice(0, 3)
                      .map((shortcut) => (
                        <button
                          key={`continue-${shortcut.id}`}
                          onClick={() =>
                            navigateToUrl(shortcut.url, shortcut.label)
                          }
                          className="rounded-[10px] border border-white/[0.12] bg-[rgba(40,40,46,0.6)] px-3 py-2.5 text-left shadow-[0_1px_4px_rgba(0,0,0,0.18)] backdrop-blur-[16px] transition hover:-translate-y-0.5 hover:bg-[rgba(55,55,62,0.78)]"
                          type="button"
                        >
                          <p className="truncate text-[12px] font-medium text-white/85">
                            {shortcut.label}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-white/50">
                            {shortcut.subtitle}
                          </p>
                        </button>
                      ))}
                  </div>
                </section>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SearchStatus({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.1] bg-white/[0.07] p-4 text-center text-[13px] text-white/55">
      {children}
    </div>
  )
}

function ToolbarIconButton({
  ariaLabel,
  children,
  disabled = false,
  onClick,
  style,
}: {
  ariaLabel: string
  children: ReactNode
  disabled?: boolean
  onClick?: () => void
  style?: CSSProperties
}) {
  return (
    <button
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={`flex size-8 items-center justify-center rounded-full transition ${
        disabled
          ? 'text-white/20'
          : 'text-white/55 hover:bg-white/[0.08] hover:text-white/80'
      }`}
      style={style}
      type="button"
    >
      {children}
    </button>
  )
}
