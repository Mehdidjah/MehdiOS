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
  IconBracketsAngle,
  IconDotsVertical,
  IconHome,
  IconMinus,
  IconPlus,
  IconReload,
  IconSearch,
  IconX,
} from '@tabler/icons-react'
import gsap from 'gsap'
import { Draggable } from 'gsap/Draggable'
import Image, { type StaticImageData } from 'next/image'
import { type CSSProperties, type FormEvent, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import googleIcon from '@/public/assets/icons/google_logo.svg'
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

const BROWSER_FRAME_SIZE: Size = { minW: 860, minH: 520 }

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

  const width = Math.min(Math.max(980, Math.floor(screenWidth * 0.8)), 1280)
  const height = Math.min(
    Math.max(620, Math.floor(screenHeight * 0.8)),
    screenHeight - topbarHeight - 34
  )

  return {
    width,
    height,
    left: Math.max(0, Math.floor((screenWidth - width) / 2)),
    top: Math.max(topbarHeight + 10, Math.floor((screenHeight - height + topbarHeight) / 2)),
  }
}

const BROWSER_PROXY_PATH = '/api/browser/proxy'
const SEARCH_URL_PREFIX = 'search:'

const isSearchUrl = (rawUrl: string) => rawUrl.startsWith(SEARCH_URL_PREFIX)

const buildProxyUrl = (rawUrl: string) =>
  `${BROWSER_PROXY_PATH}?url=${encodeURIComponent(rawUrl)}`

const getDisplayUrl = (rawUrl: string) => {
  if (!rawUrl) return ''

  if (isSearchUrl(rawUrl)) {
    return decodeURIComponent(rawUrl.slice(SEARCH_URL_PREFIX.length))
  }

  try {
    const url = new URL(rawUrl)
    return url.hostname.replace(/^www\./, '') + url.pathname + url.search
  } catch {
    return rawUrl
  }
}

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
  const { zIndex } = useSelector((state) => state.settings)
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

      if (!isLikelyUrl(trimmedInput) && !trimmedInput.startsWith('http://') && !trimmedInput.startsWith('https://')) {
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

  const activeTabHistory =
    (activeTab && historyByTab[activeTab.id]) || { entries: [], index: -1 }

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
    if (frame.current) {
      frame.current.style.zIndex = `${zIndex}`
    }
  }, [zIndex])

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
      if (event.origin !== window.location.origin || !activeTab || activeSearchQuery) {
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
        dispatch(setActiveApp({ name: frameName }))
        handleZIndex()
        setIsFocused(true)
      }}
      ref={frame}
      className={`absolute min-h-[420px] min-w-0 max-w-full overflow-hidden rounded-[26px] border border-white/40 bg-white/60 shadow-[0_36px_90px_rgba(15,23,42,0.28)] backdrop-blur-[34px] ${
        isFocused ? 'brightness-100' : 'brightness-90 saturate-75'
      } ${status === 'minimize' ? 'hidden' : ''}`}
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif",
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.92),_rgba(255,255,255,0.58)_42%,_rgba(229,235,244,0.46)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.74),rgba(255,255,255,0.38)_40%,rgba(214,226,242,0.28))]" />

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

      <div className="relative grid h-full grid-rows-[76px_auto_1fr]">
        <div
          ref={frameHeader}
          onDoubleClick={onFullScreen}
          className="grid cursor-custom-auto! grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-black/6 bg-white/44 px-4 py-3 backdrop-blur-xl"
        >
          <div className="flex items-center gap-3">
            <div className="group flex items-center gap-2">
              <TrafficLightButton color="bg-[#ff736a]" onClick={() => {
                dispatch(resetChrome())
                onClose()
              }}>
                <IconX className="size-3 text-black/75 opacity-0 transition-opacity group-hover:opacity-100" />
              </TrafficLightButton>
              <TrafficLightButton color="bg-[#febc2e]" onClick={onMinimize}>
                <IconMinus className="size-3 text-black/75 opacity-0 transition-opacity group-hover:opacity-100" />
              </TrafficLightButton>
              <TrafficLightButton color="bg-[#19c332]" onClick={onFullScreen}>
                <IconBracketsAngle className="size-3 -rotate-45 text-black/75 opacity-0 transition-opacity group-hover:opacity-100" />
              </TrafficLightButton>
            </div>

            <GlassGroup className="hidden sm:flex">
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
            </GlassGroup>
          </div>

          <form
            onSubmit={handleUrlSubmit}
            className="mx-auto flex h-11 w-full max-w-3xl min-w-0 items-center gap-3 rounded-full border border-white/60 bg-white/76 px-4 shadow-[0_12px_24px_rgba(15,23,42,0.07),inset_0_1px_0_rgba(255,255,255,0.86)]"
          >
            <Image
              alt=""
              src={activeSearchQuery || !activeTab?.iframe_url ? googleIcon : newIconSrc.safari}
              width={activeSearchQuery || !activeTab?.iframe_url ? 20 : 18}
              height={activeSearchQuery || !activeTab?.iframe_url ? 20 : 18}
              className="shrink-0 object-contain"
            />
            <IconSearch stroke={1.9} className="size-4 shrink-0 text-black/35" />
            <input
              value={urlInput}
              onChange={(event) => setUrlInput(event.target.value)}
              type="text"
              placeholder="Search or enter website name"
              className="w-full min-w-0 bg-transparent text-[13px] text-black/75 outline-hidden placeholder:text-black/35"
            />
            <button
              type="button"
              onClick={handleRefresh}
              className={`flex size-7 items-center justify-center rounded-full transition ${
                activeSearchQuery || activeFrameUrl
                  ? 'text-black/55 hover:bg-black/[0.05] hover:text-black/75'
                  : 'pointer-events-none text-black/20'
              }`}
              aria-label="Refresh page"
            >
              <IconReload stroke={1.8} className="size-4" />
            </button>
          </form>

          <GlassGroup className="hidden md:flex">
            <ToolbarIconButton ariaLabel="Home" onClick={handleHome}>
              <IconHome stroke={1.9} className="size-4" />
            </ToolbarIconButton>
            <ToolbarIconButton ariaLabel="New tab" onClick={handleNewTab}>
              <IconPlus stroke={1.9} className="size-4" />
            </ToolbarIconButton>
            <ToolbarIconButton ariaLabel="Window actions">
              <IconDotsVertical stroke={1.9} className="size-4" />
            </ToolbarIconButton>
          </GlassGroup>
        </div>

        <div className="px-4 py-2">
          <div className="flex min-w-0 items-center gap-0.5 overflow-x-auto">
            {tabs.map((tab) => {
              const active = tab.id === focusedTab
              const tabSearchQuery = getSearchQuery(tab.url)

              return (
                <button
                  key={tab.id}
                  onClick={() => dispatch(focusTab(tab.id))}
                  className={`group relative flex min-w-[160px] max-w-[240px] items-center gap-2 rounded-[16px] border px-3 py-2 text-left transition ${
                    active
                      ? 'border-white/70 bg-white/84 shadow-[0_12px_24px_rgba(15,23,42,0.08)]'
                      : 'border-transparent bg-white/36 hover:bg-white/58'
                  }`}
                  type="button"
                >
                  <Image
                    alt=""
                    src={tabSearchQuery || !tab.iframe_url ? googleIcon : newIconSrc.safari}
                    width={tabSearchQuery || !tab.iframe_url ? 18 : 16}
                    height={tabSearchQuery || !tab.iframe_url ? 18 : 16}
                    className="shrink-0 object-contain"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-black/75">
                      {tab.title || 'New Tab'}
                    </p>
                    <p className="truncate text-[11px] text-black/42">
                      {tabSearchQuery
                        ? 'Search results'
                        : tab.iframe_url
                          ? getHostname(tab.url || tab.iframe_url)
                          : 'Google start page'}
                    </p>
                  </div>
                  <span
                    onClick={(event) => {
                      event.stopPropagation()
                      handleCloseTab(tab.id)
                    }}
                    className="flex size-5 shrink-0 items-center justify-center rounded-full text-black/30 transition hover:bg-black/[0.05] hover:text-black/60"
                  >
                    <IconX stroke={2} className="size-3.5" />
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="min-h-0 overflow-hidden px-3 pb-3 pt-0">
          {activeSearchQuery ? (
            <div className="relative flex h-full flex-col overflow-auto rounded-[24px] border border-white/55 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(244,247,251,0.94))] px-6 py-8 shadow-[0_18px_38px_rgba(15,23,42,0.08)]">
              <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,_rgba(90,160,255,0.14),_transparent_70%)]" />
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
                  <h2 className="mt-2 text-[34px] font-semibold tracking-[-0.04em] text-slate-900">
                    {activeSearchQuery}
                  </h2>
                  <p className="mt-3 max-w-2xl text-[14px] leading-6 text-slate-500">
                    Search results open inside the Safari window so you can keep researching
                    without leaving the desktop.
                  </p>
                </div>

                <div className="mt-10 flex-1 space-y-4">
                  {isSearching ? (
                    <div className="rounded-[22px] border border-white/60 bg-white/78 p-6 text-center text-[14px] text-slate-500 shadow-[0_14px_30px_rgba(15,23,42,0.05)]">
                      Searching for results...
                    </div>
                  ) : searchError ? (
                    <div className="rounded-[22px] border border-white/60 bg-white/78 p-6 text-center text-[14px] text-slate-500 shadow-[0_14px_30px_rgba(15,23,42,0.05)]">
                      {searchError}
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="rounded-[22px] border border-white/60 bg-white/78 p-6 text-center text-[14px] text-slate-500 shadow-[0_14px_30px_rgba(15,23,42,0.05)]">
                      No results found for this query.
                    </div>
                  ) : (
                    searchResults.map((result, index) => (
                      <button
                        key={`${result.url}-${index}`}
                        onClick={() => navigateToUrl(result.url, result.title)}
                        className="w-full rounded-[22px] border border-white/65 bg-white/78 p-5 text-left shadow-[0_14px_30px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:bg-white/92 hover:shadow-[0_18px_34px_rgba(15,23,42,0.08)]"
                        type="button"
                      >
                        <p className="text-[12px] font-medium text-[#2563eb]">
                          {result.source}
                        </p>
                        <h3 className="mt-1 text-[18px] font-semibold tracking-[-0.03em] text-slate-900">
                          {result.title}
                        </h3>
                        <p className="mt-2 text-[13px] leading-6 text-slate-500">
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
            <div className="h-full overflow-hidden rounded-[24px] border border-white/55 bg-white/82 shadow-[0_18px_38px_rgba(15,23,42,0.09)]">
              <div className="flex items-center justify-between border-b border-black/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(245,247,251,0.92))] px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ecf6ff,#ffffff)] shadow-[inset_0_1px_0_rgba(255,255,255,0.92)]">
                    <Image alt="" src={newIconSrc.safari} width={20} height={20} className="object-contain" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-black/80">
                      {activeTab?.title || 'Safari'}
                    </p>
                    <p className="truncate text-[11px] text-black/45">
                      {getDisplayUrl(activeFrameUrl)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRefresh}
                  className="flex items-center gap-2 rounded-full bg-black/[0.04] px-3 py-1.5 text-[12px] font-medium text-black/55 transition hover:bg-black/[0.07] hover:text-black/75"
                  type="button"
                >
                  <IconReload stroke={1.8} className="size-3.5" />
                  Reload
                </button>
              </div>
              <iframe
                key={`${activeTab?.id ?? 'tab'}:${activeFrameUrl}:${iframeRefreshKey}`}
                className="h-[calc(100%-59px)] w-full border-0 bg-white"
                src={buildProxyUrl(activeFrameUrl)}
                title={activeTab?.title || 'Safari'}
                allowFullScreen
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation allow-popups-to-escape-sandbox allow-modals"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="relative flex h-full flex-col overflow-auto rounded-[24px] border border-white/55 bg-[linear-gradient(180deg,rgba(255,255,255,0.8),rgba(244,247,251,0.92))] px-6 py-8 shadow-[0_18px_38px_rgba(15,23,42,0.08)]">
              <div className="relative mx-auto flex w-full max-w-[1120px] flex-1 flex-col items-center">
                <div className="mx-auto flex min-h-[360px] w-full max-w-[840px] flex-col items-center justify-center text-center">
                  <Image
                    alt="Google"
                    src={googleIcon}
                    width={280}
                    height={95}
                    className="h-auto w-[280px] object-contain"
                  />

                  <form
                    onSubmit={handleHomeSearch}
                    className="mt-10 flex w-full items-center gap-4 rounded-full border border-white/70 bg-white/92 px-8 py-[18px] shadow-[0_18px_32px_rgba(15,23,42,0.08)]"
                  >
                    <IconSearch stroke={1.9} className="size-6 shrink-0 text-slate-400" />
                    <input
                      type="text"
                      value={homeSearchQuery}
                      onChange={(event) => setHomeSearchQuery(event.target.value)}
                      placeholder="Search the web or enter a URL"
                      className="w-full bg-transparent text-[16px] text-slate-700 outline-hidden placeholder:text-slate-400"
                    />
                  </form>
                </div>

                <div className="mt-4 grid w-full gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {shortcuts.map((shortcut) => (
                    <button
                      key={shortcut.id}
                      onClick={() => navigateToUrl(shortcut.url, shortcut.label)}
                      className="group flex min-h-[176px] flex-col rounded-[22px] border border-white/65 bg-white/72 p-4 text-left shadow-[0_14px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:bg-white/92 hover:shadow-[0_18px_34px_rgba(15,23,42,0.1)]"
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-3">
                        {shortcut.thumbnail ? (
                          <div className="relative size-14 overflow-hidden rounded-[18px] border border-white/70 shadow-[0_10px_18px_rgba(15,23,42,0.08)]">
                            <Image alt="" src={shortcut.thumbnail} fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="flex size-14 items-center justify-center rounded-[18px] border border-white/70 bg-[linear-gradient(135deg,#eef7ff,#ffffff)] shadow-[0_10px_18px_rgba(15,23,42,0.06)]">
                            <Image
                              alt=""
                              src={newIconSrc.safari}
                              width={28}
                              height={28}
                              className="object-contain"
                            />
                          </div>
                        )}
                        <span className="rounded-full bg-black/[0.04] px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] text-black/40 uppercase">
                          Shortcut
                        </span>
                      </div>

                      <div className="mt-4">
                        <p className="truncate text-[16px] font-semibold tracking-[-0.03em] text-slate-900">
                          {shortcut.label}
                        </p>
                        <p className="mt-1 text-[12px] font-medium text-slate-500">
                          {shortcut.subtitle}
                        </p>
                      </div>

                      <p className="mt-3 line-clamp-3 text-[12px] leading-5 text-slate-500">
                        {shortcut.description}
                      </p>

                      <span className="mt-auto pt-4 text-[12px] font-semibold text-[#2563eb]">
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

function GlassGroup({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`items-center gap-1 rounded-full border border-white/60 bg-white/76 px-1 py-1 shadow-[0_12px_24px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.86)] ${className}`}
    >
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
      onClick={onClick}
      className={`flex size-8 items-center justify-center rounded-full transition ${
        disabled
          ? 'pointer-events-none text-black/20'
          : 'text-black/55 hover:bg-black/[0.05] hover:text-black/75'
      }`}
      style={style}
      type="button"
    >
      {children}
    </button>
  )
}
