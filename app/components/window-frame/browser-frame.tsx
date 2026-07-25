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
import {
  IconArrowLeft,
  IconArrowRight,
  IconDotsVertical,
  IconHome,
  IconPlus,
  IconReload,
  IconSearch,
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
import googleIcon from '@/public/assets/icons/google_logo.svg'
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

  const width = Math.min(
    Math.max(720, Math.floor(screenWidth * 0.7)),
    screenWidth - 32
  )
  const height = Math.min(
    Math.max(480, Math.floor(screenHeight * 0.76)),
    screenHeight - topbarHeight - 34
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
  const { activeApp, zIndex } = useSelector((state) => state.settings)
  const { focusedTab, tabs } = useSelector((state) => state.chrome)
  const [isFocused, setIsFocused] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [homeSearchQuery, setHomeSearchQuery] = useState('')
  const [iframeRefreshKey, setIframeRefreshKey] = useState(0)
  const [historyByTab, setHistoryByTab] = useState<TabHistoryMap>({})
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searchRefreshKey, setSearchRefreshKey] = useState(0)
  const size = getBrowserSize()
  const activeTab = tabs.find((tab) => tab.id === focusedTab)
  const activeSearchQuery = activeTab ? getSearchQuery(activeTab.url) : ''
  const activeFrameUrl = activeTab?.iframe_url || activeTab?.url || ''

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
      if (currentEntry === rawUrl) {
        return prev
      }

      const knownIndex = existing.entries.lastIndexOf(rawUrl)
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
        setHomeSearchQuery('')
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
      setHomeSearchQuery('')
    },
    [activeTab, dispatch, seedHistoryForTab]
  )

  const handleUrlSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    navigateToUrl(urlInput)
  }

  const handleHomeSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    navigateToUrl(homeSearchQuery)
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
    setHomeSearchQuery('')
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
    setHomeSearchQuery('')
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
    setHomeSearchQuery('')
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
    if (!activeTab.iframe_url) {
      setHomeSearchQuery('')
    }

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
      onContextMenu={(event) => {
        event.stopPropagation()
      }}
      onMouseDown={() => {
        dispatch(setActiveApp({ id: frame_id, name: frameName }))
        handleZIndex()
        setIsFocused(true)
      }}
      ref={frame}
      className={`absolute min-h-[420px] max-w-full min-w-0 overflow-hidden rounded-none border border-black/15 bg-[#f5f5f7] md:min-h-[480px] md:min-w-[720px] dark:border-white/15 dark:bg-[#292929] ${
        isFullscreen ? 'rounded-none' : 'sm:rounded-xl'
      } ${
        isFocused
          ? 'shadow-[0_24px_60px_rgba(0,0,0,0.24)]'
          : 'shadow-[0_12px_36px_rgba(0,0,0,0.2)]'
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
            className="absolute top-0 z-20 h-1 w-full cursor-ns-resize bg-transparent"
          />
          <div
            ref={b}
            className="absolute bottom-0 z-20 h-1 w-full cursor-ns-resize bg-transparent"
          />
          <div
            ref={r}
            className="absolute right-0 z-20 h-full w-1 cursor-ew-resize bg-transparent"
          />
          <div
            ref={l}
            className="absolute left-0 z-20 h-full w-1 cursor-ew-resize bg-transparent"
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

      <div className="relative grid h-full grid-rows-[44px_34px_1fr]">
        <div
          ref={frameHeader}
          onDoubleClick={onFullScreen}
          className="cursor-custom-auto! grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-black/10 bg-[#ececee] px-3 dark:border-white/10 dark:bg-[#323232]"
        >
          <div className="flex items-center gap-3">
            <MacTrafficLights
              appName={frameName}
              isFullscreen={isFullscreen}
              onClose={() => {
                dispatch(resetChrome())
                onClose()
              }}
              onMinimize={onMinimize}
              onZoom={onFullScreen}
            />

            <div className="hidden items-center sm:flex">
              <ToolbarIconButton
                ariaLabel="Back"
                disabled={!canGoBack}
                onClick={() => handleHistoryMove(-1)}
              >
                <IconArrowLeft stroke={2} className="size-4" />
              </ToolbarIconButton>
              <div className="h-4 w-px bg-black/10" />
              <ToolbarIconButton
                ariaLabel="Forward"
                disabled={!canGoForward}
                onClick={() => handleHistoryMove(1)}
              >
                <IconArrowRight stroke={2} className="size-4" />
              </ToolbarIconButton>
            </div>
          </div>

          <form
            onSubmit={handleUrlSubmit}
            className="mx-auto flex h-7 w-full max-w-3xl min-w-0 items-center gap-2 rounded-md border border-black/10 bg-white/80 px-3 dark:border-white/10 dark:bg-black/20"
          >
            <Image
              alt=""
              src={
                activeSearchQuery || !activeTab?.iframe_url
                  ? googleIcon
                  : newIconSrc.safari
              }
              width={activeSearchQuery || !activeTab?.iframe_url ? 20 : 18}
              height={activeSearchQuery || !activeTab?.iframe_url ? 20 : 18}
              className="shrink-0 object-contain"
            />
            <IconSearch
              stroke={1.9}
              className="size-4 shrink-0 text-black/35 dark:text-white/35"
            />
            <input
              value={urlInput}
              onChange={(event) => setUrlInput(event.target.value)}
              type="text"
              placeholder="Search or enter website name"
              aria-label="Safari address and search"
              className="w-full min-w-0 bg-transparent text-[13px] text-black/75 outline-hidden placeholder:text-black/35 dark:text-white/80 dark:placeholder:text-white/35"
            />
            <button
              type="button"
              onClick={handleRefresh}
              className={`flex size-7 items-center justify-center rounded-full transition ${
                activeSearchQuery || activeFrameUrl
                  ? 'text-black/55 hover:bg-black/[0.05] hover:text-black/75 dark:text-white/55 dark:hover:bg-white/[0.08] dark:hover:text-white/80'
                  : 'pointer-events-none text-black/20 dark:text-white/20'
              }`}
              aria-label="Refresh page"
            >
              <IconReload stroke={1.8} className="size-4" />
            </button>
          </form>

          <div className="hidden items-center md:flex">
            <ToolbarIconButton ariaLabel="Home" onClick={handleHome}>
              <IconHome stroke={1.9} className="size-4" />
            </ToolbarIconButton>
            <ToolbarIconButton ariaLabel="New tab" onClick={handleNewTab}>
              <IconPlus stroke={1.9} className="size-4" />
            </ToolbarIconButton>
            <ToolbarIconButton ariaLabel="Window actions">
              <IconDotsVertical stroke={1.9} className="size-4" />
            </ToolbarIconButton>
          </div>
        </div>

        <div className="border-b border-black/10 bg-[#e5e5e7] px-2 dark:border-white/10 dark:bg-[#292929]">
          <div
            className="flex h-[33px] min-w-0 items-end gap-0.5 overflow-x-auto"
            role="tablist"
          >
            {tabs.map((tab) => {
              const active = tab.id === focusedTab
              const tabSearchQuery = getSearchQuery(tab.url)

              return (
                <div
                  className={`group relative flex h-7 max-w-[220px] min-w-[130px] items-center rounded-t-md border border-b-0 transition ${
                    active
                      ? 'border-black/10 bg-[#f5f5f7] dark:border-white/10 dark:bg-[#1f1f1f]'
                      : 'border-transparent bg-black/[0.03] hover:bg-black/[0.06] dark:bg-white/[0.03] dark:hover:bg-white/[0.07]'
                  }`}
                  key={tab.id}
                >
                  <button
                    aria-selected={active}
                    className="flex min-w-0 flex-1 items-center gap-2 px-2.5 text-left"
                    onClick={() => dispatch(focusTab(tab.id))}
                    role="tab"
                    type="button"
                  >
                    <Image
                      alt=""
                      className="shrink-0 object-contain"
                      height={tabSearchQuery || !tab.iframe_url ? 16 : 14}
                      src={
                        tabSearchQuery || !tab.iframe_url
                          ? googleIcon
                          : newIconSrc.safari
                      }
                      width={tabSearchQuery || !tab.iframe_url ? 16 : 14}
                    />
                    <span className="truncate text-[12px] font-medium text-black/75 dark:text-white/75">
                      {tab.title || 'New Tab'}
                    </span>
                  </button>
                  <button
                    aria-label={`Close ${tab.title || 'tab'}`}
                    className="mr-1 flex size-5 shrink-0 items-center justify-center rounded-full text-black/30 transition hover:bg-black/[0.06] hover:text-black/65 dark:text-white/30 dark:hover:bg-white/[0.08] dark:hover:text-white/65"
                    onClick={() => handleCloseTab(tab.id)}
                    type="button"
                  >
                    <IconX aria-hidden className="size-3.5" stroke={2} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="min-h-0 overflow-hidden bg-white dark:bg-[#1f1f1f]">
          {activeSearchQuery ? (
            <div className="relative flex h-full flex-col overflow-auto bg-[#f7f7f8] px-4 py-6 sm:px-6 sm:py-8 dark:bg-[#1f1f1f]">
              <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col">
                <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
                  <Image
                    alt="Google"
                    src={googleIcon}
                    width={140}
                    height={48}
                    className="h-auto w-[140px] object-contain"
                  />
                  <p className="mt-6 text-[11px] font-semibold tracking-[0.22em] text-[#2563eb] uppercase">
                    Research
                  </p>
                  <h2 className="mt-2 text-[30px] font-semibold tracking-[-0.04em] text-slate-900 dark:text-white">
                    {activeSearchQuery}
                  </h2>
                  <p className="mt-3 max-w-2xl text-[14px] leading-6 text-slate-500 dark:text-white/50">
                    Search results open inside the Safari window so you can keep
                    researching without leaving the desktop.
                  </p>
                </div>

                <div className="mt-10 flex-1 space-y-4">
                  {isSearching ? (
                    <div className="rounded-lg border border-black/8 bg-white p-5 text-center text-[14px] text-slate-500 shadow-sm dark:border-white/8 dark:bg-white/5 dark:text-white/50">
                      Searching for results...
                    </div>
                  ) : searchError ? (
                    <div className="rounded-lg border border-black/8 bg-white p-5 text-center text-[14px] text-slate-500 shadow-sm dark:border-white/8 dark:bg-white/5 dark:text-white/50">
                      {searchError}
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="rounded-lg border border-black/8 bg-white p-5 text-center text-[14px] text-slate-500 shadow-sm dark:border-white/8 dark:bg-white/5 dark:text-white/50">
                      No results found for this query.
                    </div>
                  ) : (
                    searchResults.map((result, index) => (
                      <button
                        key={`${result.url}-${index}`}
                        onClick={() => navigateToUrl(result.url, result.title)}
                        className="w-full rounded-lg border border-black/8 bg-white p-4 text-left shadow-sm transition hover:bg-black/[0.02] hover:shadow-md dark:border-white/8 dark:bg-white/5 dark:hover:bg-white/[0.08]"
                        type="button"
                      >
                        <p className="text-[12px] font-medium text-[#2563eb]">
                          {result.source}
                        </p>
                        <h3 className="mt-1 text-[17px] font-semibold tracking-[-0.02em] text-slate-900 dark:text-white/90">
                          {result.title}
                        </h3>
                        <p className="mt-2 text-[13px] leading-6 text-slate-500 dark:text-white/50">
                          {result.snippet || result.url}
                        </p>
                        <p className="mt-3 truncate text-[12px] text-slate-400">
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
              className="h-full w-full border-0 bg-white"
              src={buildProxyUrl(activeFrameUrl)}
              title={activeTab?.title || 'Safari'}
              allowFullScreen
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation allow-popups-to-escape-sandbox allow-modals"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="relative flex h-full flex-col overflow-auto bg-[#f7f7f8] px-4 py-6 sm:px-6 sm:py-8 dark:bg-[#1f1f1f]">
              <div className="relative mx-auto flex w-full max-w-[1120px] flex-1 flex-col items-center">
                <div className="mx-auto flex min-h-[260px] w-full max-w-[760px] flex-col items-center justify-center text-center">
                  <Image
                    alt="Google"
                    src={googleIcon}
                    width={220}
                    height={74}
                    className="h-auto w-[220px] object-contain"
                  />

                  <form
                    onSubmit={handleHomeSearch}
                    className="mt-8 flex w-full items-center gap-3 rounded-full border border-black/10 bg-white px-5 py-3.5 shadow-sm transition focus-within:border-[#007aff] focus-within:ring-2 focus-within:ring-[#007aff]/15 dark:border-white/10 dark:bg-white/[0.07]"
                  >
                    <IconSearch
                      stroke={1.9}
                      className="size-6 shrink-0 text-slate-400"
                    />
                    <input
                      type="text"
                      value={homeSearchQuery}
                      onChange={(event) =>
                        setHomeSearchQuery(event.target.value)
                      }
                      placeholder="Search the web or enter a URL"
                      aria-label="Search the web"
                      className="w-full bg-transparent text-[15px] text-slate-700 outline-hidden placeholder:text-slate-400 dark:text-white/80 dark:placeholder:text-white/35"
                    />
                  </form>
                </div>

                <div className="mt-5 grid w-full grid-cols-[repeat(auto-fill,minmax(138px,1fr))] gap-3">
                  {shortcuts.map((shortcut) => (
                    <button
                      key={shortcut.id}
                      onClick={() =>
                        navigateToUrl(shortcut.url, shortcut.label)
                      }
                      className="group flex min-h-[142px] flex-col rounded-[10px] border border-black/8 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/8 dark:bg-white/5 dark:hover:bg-white/[0.08]"
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-3">
                        {shortcut.thumbnail ? (
                          <div className="relative size-11 overflow-hidden rounded-lg border border-black/8 shadow-sm dark:border-white/10">
                            <Image
                              alt=""
                              src={shortcut.thumbnail}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex size-11 items-center justify-center rounded-lg border border-black/8 bg-[#eef7ff] shadow-sm dark:border-white/10 dark:bg-white/10">
                            <Image
                              alt=""
                              src={newIconSrc.safari}
                              width={28}
                              height={28}
                              className="object-contain"
                            />
                          </div>
                        )}
                        <span className="hidden rounded-full bg-black/[0.04] px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] text-black/40 uppercase">
                          Shortcut
                        </span>
                      </div>

                      <div className="mt-4">
                        <p className="truncate text-[14px] font-semibold tracking-[-0.02em] text-slate-900 dark:text-white/90">
                          {shortcut.label}
                        </p>
                        <p className="mt-1 truncate text-[11px] font-medium text-slate-500 dark:text-white/45">
                          {shortcut.subtitle}
                        </p>
                      </div>

                      <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-slate-500 dark:text-white/45">
                        {shortcut.description}
                      </p>

                      <span className="mt-auto pt-3 text-[11px] font-semibold text-[#2563eb] dark:text-[#5fa8ff]">
                        Open in current tab
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
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
          ? 'text-black/20 dark:text-white/20'
          : 'text-black/55 hover:bg-black/[0.05] hover:text-black/75 dark:text-white/55 dark:hover:bg-white/[0.08] dark:hover:text-white/80'
      }`}
      style={style}
      type="button"
    >
      {children}
    </button>
  )
}
