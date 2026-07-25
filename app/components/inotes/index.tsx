import {
  addNewNote,
  deleteNote,
  INote,
  loadNotes,
  updateNote,
} from '@/app/features/notes'
import { useCopy } from '@/app/hooks/use-copy'
import { useDispatch, useSelector } from '@/app/store'
import { WindowChromeContext } from '@/app/components/window-frame'
import { MacTrafficLights } from '@/app/components/window-frame/mac-traffic-lights'
import {
  IconChecklist,
  IconCloud,
  IconDots,
  IconFolder,
  IconHash,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconLock,
  IconNotes,
  IconPaperclip,
  IconPencil,
  IconPlus,
  IconSearch,
  IconShare,
  IconTable,
  IconTrash,
} from '@tabler/icons-react'
import {
  ChangeEvent,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

type IconComponent = typeof IconNotes

type FolderItem = {
  id: string
  name: string
  icon: IconComponent
  matches: (note: INote) => boolean
}

type FolderSection = {
  name: string
  icon?: IconComponent
  items: FolderItem[]
}

type NoteGroup = {
  id: string
  label: string
  notes: INote[]
}

const DAY_IN_MS = 24 * 60 * 60 * 1000
const CODE_SNIPPET_PATTERN =
  /(?:function|const |let |class |return |import |export |=>|\{\s*$)/i
const IDEA_PATTERN = /(?:idea|plan|todo|build|improve|brainstorm|draft)/i

const isSameDay = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

const isWithinDays = (dateString: string, days: number) => {
  const time = new Date(dateString).getTime()

  if (Number.isNaN(time)) {
    return false
  }

  return Date.now() - time <= days * DAY_IN_MS
}

const splitNoteContent = (content: string) => {
  const normalizedContent = content.replace(/\r\n/g, '\n')
  const lines = normalizedContent.split('\n')
  const firstMeaningfulLineIndex = lines.findIndex(
    (line) => line.trim().length > 0
  )

  if (firstMeaningfulLineIndex === -1) {
    return {
      title: '',
      body: '',
    }
  }

  const title = lines[firstMeaningfulLineIndex].trim()
  const body = lines
    .slice(firstMeaningfulLineIndex + 1)
    .join('\n')
    .replace(/^\n+/, '')

  return { title, body }
}

const composeNoteContent = (title: string, body: string) => {
  const trimmedTitle = title.trim()
  const normalizedBody = body.replace(/^\n+/, '')

  if (trimmedTitle && normalizedBody) {
    return `${trimmedTitle}\n\n${normalizedBody}`
  }

  if (trimmedTitle) {
    return trimmedTitle
  }

  return normalizedBody
}

const getDisplayTitle = (content: string) => {
  const { title, body } = splitNoteContent(content)

  if (title) {
    return title
  }

  if (body.trim()) {
    return body.trim().slice(0, 48)
  }

  return 'Untitled Note'
}

const getNotePreview = (content: string) => {
  const { title, body } = splitNoteContent(content)
  const previewSource = body.trim() || title.trim()

  if (!previewSource) {
    return 'No additional text'
  }

  return previewSource.replace(/\s+/g, ' ')
}

const formatUpdatedAt = (dateString: string) => {
  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  if (isSameDay(dateString)) {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (Date.now() - date.getTime() < 2 * DAY_IN_MS) {
    return 'Yesterday'
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

const formatDetailedUpdatedAt = (dateString: string) => {
  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const formattedDate = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  return `${formattedDate} at ${formattedTime}`
}

const groupNotesByUpdatedAt = (notes: INote[]): NoteGroup[] => {
  const todayNotes = notes.filter((note) => isSameDay(note.updatedAt))
  const previousWeekNotes = notes.filter(
    (note) => !isSameDay(note.updatedAt) && isWithinDays(note.updatedAt, 7)
  )
  const previousMonthNotes = notes.filter(
    (note) =>
      !isWithinDays(note.updatedAt, 7) && isWithinDays(note.updatedAt, 30)
  )
  const olderNotes = notes.filter((note) => !isWithinDays(note.updatedAt, 30))

  return [
    {
      id: 'today',
      label: 'Today',
      notes: todayNotes,
    },
    {
      id: 'previous-7-days',
      label: 'Previous 7 Days',
      notes: previousWeekNotes,
    },
    {
      id: 'previous-30-days',
      label: 'Previous 30 Days',
      notes: previousMonthNotes,
    },
    {
      id: 'earlier',
      label: 'Earlier',
      notes: olderNotes,
    },
  ].filter((group) => group.notes.length > 0)
}

const persistNotes = (notes: INote[]) => {
  try {
    localStorage.setItem('iNotes', JSON.stringify(notes))
  } catch (error) {
    console.error('Failed to save notes to localStorage:', error)
  }
}

const folderSections: FolderSection[] = [
  {
    name: 'iCloud',
    icon: IconCloud,
    items: [
      {
        id: 'all-notes',
        name: 'All Notes',
        icon: IconNotes,
        matches: () => true,
      },
    ],
  },
  {
    name: 'Folders',
    items: [
      {
        id: 'today',
        name: 'Today',
        icon: IconFolder,
        matches: (note) => isSameDay(note.updatedAt),
      },
      {
        id: 'recently-edited',
        name: 'Recently Edited',
        icon: IconFolder,
        matches: (note) => isWithinDays(note.updatedAt, 7),
      },
      {
        id: 'long-notes',
        name: 'Long Notes',
        icon: IconFolder,
        matches: (note) => note.content.trim().length >= 180,
      },
    ],
  },
  {
    name: 'Tags',
    items: [
      {
        id: 'code-snippets',
        name: 'Code Snippets',
        icon: IconHash,
        matches: (note) => CODE_SNIPPET_PATTERN.test(note.content),
      },
      {
        id: 'ideas',
        name: 'Ideas',
        icon: IconHash,
        matches: (note) => IDEA_PATTERN.test(note.content),
      },
    ],
  },
]

const toolbarButtonClass =
  'flex size-8 items-center justify-center rounded-full border border-black/5 bg-white/40 text-zinc-500 shadow-xs backdrop-blur-md transition hover:bg-white/70 hover:text-zinc-800 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white'
const noteActionButtonClass =
  'flex size-8 items-center justify-center rounded-full border border-black/5 bg-white/40 text-zinc-500 shadow-xs backdrop-blur-md transition hover:bg-white/70 hover:text-zinc-800 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white'

export function INotes() {
  const windowChrome = useContext(WindowChromeContext)
  const inotes = useSelector((state) => state.iNotes.notes)
  const [tab, setTab] = useState('')
  const [isSidebarVisible, setIsSidebarVisible] = useState(true)
  const [selectedFolderId, setSelectedFolderId] = useState('all-notes')
  const [mode, setMode] = useState<'readonly' | 'edit'>('readonly')
  const [searchTerm, setSearchTerm] = useState('')
  const titleRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const dispatch = useDispatch()
  const { copy, isCopied } = useCopy()

  const selectedFolder = useMemo(
    () =>
      folderSections
        .flatMap((section) => section.items)
        .find((item) => item.id === selectedFolderId) ??
      folderSections[0].items[0],
    [selectedFolderId]
  )

  const sortedNotes = useMemo(
    () =>
      [...inotes].sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() -
          new Date(left.updatedAt).getTime()
      ),
    [inotes]
  )

  const filteredNotes = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return sortedNotes.filter((note) => {
      if (!selectedFolder.matches(note)) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      const searchableText = `${getDisplayTitle(note.content)} ${getNotePreview(note.content)}`

      return searchableText.toLowerCase().includes(normalizedSearch)
    })
  }, [searchTerm, selectedFolder, sortedNotes])

  const folderCounts = useMemo(
    () =>
      folderSections
        .flatMap((section) => section.items)
        .reduce<Record<string, number>>((counts, item) => {
          counts[item.id] = sortedNotes.filter((note) =>
            item.matches(note)
          ).length
          return counts
        }, {}),
    [sortedNotes]
  )

  const noteGroups = useMemo(
    () => groupNotesByUpdatedAt(filteredNotes),
    [filteredNotes]
  )

  const activeNote = useMemo(
    () => sortedNotes.find((note) => note.id === tab) ?? null,
    [sortedNotes, tab]
  )

  const activeNoteParts = useMemo(
    () => (activeNote ? splitNoteContent(activeNote.content) : null),
    [activeNote]
  )

  const activeNoteTimestamp = useMemo(
    () => (activeNote ? formatDetailedUpdatedAt(activeNote.updatedAt) : ''),
    [activeNote]
  )

  useEffect(() => {
    try {
      const localNotes = localStorage.getItem('iNotes')
      if (!localNotes) return

      const parsedNotes: INote[] | null = JSON.parse(localNotes)
      if (parsedNotes && Array.isArray(parsedNotes)) {
        dispatch(loadNotes(parsedNotes))
      }
    } catch (error) {
      console.error('Failed to load notes from localStorage:', error)
    }
  }, [dispatch])

  useEffect(() => {
    if (!filteredNotes.length) {
      setTab('')
      return
    }

    if (!filteredNotes.some((note) => note.id === tab)) {
      setTab(filteredNotes[0].id)
      setMode('readonly')
    }
  }, [filteredNotes, tab])

  useEffect(() => {
    if (mode !== 'edit') {
      return
    }

    requestAnimationFrame(() => {
      const hasTitle = titleRef.current?.value.trim()
      const target = hasTitle ? textareaRef.current : titleRef.current

      target?.focus()

      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        const length = target.value.length
        target.setSelectionRange(length, length)
      }
    })
  }, [mode, tab])

  const handleFolderSelect = (folderId: string) => {
    setSelectedFolderId(folderId)
    setMode('readonly')
  }

  const handlePersistedUpdate = (id: string, content: string) => {
    const updatedAt = new Date().toISOString()

    dispatch(
      updateNote({
        id,
        content,
        updatedAt,
      })
    )

    const updatedNotes = inotes.map((note) =>
      note.id === id
        ? {
            ...note,
            content,
            updatedAt,
          }
        : note
    )

    persistNotes(updatedNotes)
  }

  const onNewNote = () => {
    const id = crypto.randomUUID()
    const note: INote = {
      id,
      content: 'Untitled Note\n\nStart writing here...',
      updatedAt: new Date().toISOString(),
    }

    dispatch(addNewNote(note))
    persistNotes([note, ...inotes])
    setSelectedFolderId('all-notes')
    setSearchTerm('')
    setTab(id)
    setMode('edit')
  }

  const onDelete = (id: string) => {
    dispatch(deleteNote(id))
    persistNotes(inotes.filter((note) => note.id !== id))
    setMode('readonly')
  }

  const onEdit = () => {
    if (!activeNote) {
      return
    }

    setMode('edit')
  }

  const onShare = async () => {
    if (!activeNote) {
      return
    }

    await copy(activeNote.content)
  }

  const handleTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!activeNoteParts || !activeNote) {
      return
    }

    handlePersistedUpdate(
      activeNote.id,
      composeNoteContent(event.target.value, activeNoteParts.body)
    )
  }

  const handleBodyChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    if (!activeNoteParts || !activeNote) {
      return
    }

    handlePersistedUpdate(
      activeNote.id,
      composeNoteContent(activeNoteParts.title, event.target.value)
    )
  }

  return (
    <div
      className="flex h-full w-full overflow-hidden bg-white text-zinc-900 select-none dark:bg-[#1e1e1e] dark:text-white"
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif",
      }}
    >
      {isSidebarVisible && (
        <aside className="m-2 mr-0 flex w-[88px] shrink-0 flex-col overflow-hidden rounded-2xl border border-black/8 bg-[rgba(250,250,248,0.9)] shadow-sm md:w-52 dark:border-white/8 dark:bg-[rgba(37,37,37,0.9)]">
          <div
            ref={windowChrome?.frameHeader}
            className="flex h-[60px] shrink-0 items-center justify-center px-1 md:justify-between md:px-4"
            onDoubleClick={windowChrome?.onZoom}
          >
            <MacTrafficLights
              appName="Notes"
              isActive={windowChrome?.isFocused ?? true}
              isFullscreen={windowChrome?.isFullscreen}
              onClose={windowChrome?.onClose ?? (() => {})}
              onMinimize={windowChrome?.onMinimize ?? (() => {})}
              onZoom={windowChrome?.onZoom ?? (() => {})}
            />
            <button
              aria-label="Hide Notes sidebar"
              className="hidden rounded-md p-1 text-zinc-500 transition hover:bg-black/5 hover:text-zinc-800 md:flex dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white"
              onClick={() => setIsSidebarVisible(false)}
              type="button"
            >
              <IconLayoutSidebarLeftCollapse className="size-4" stroke={1.7} />
            </button>
          </div>

          <nav
            aria-label="Notes folders"
            className="min-h-0 flex-1 overflow-y-auto px-2 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {folderSections.map((section) => (
              <section className="mb-4 last:mb-0" key={section.name}>
                <h2 className="hidden px-3 pb-1 text-[10px] font-semibold tracking-[0.08em] text-zinc-400 uppercase md:block dark:text-zinc-500">
                  {section.name}
                </h2>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = selectedFolderId === item.id

                    return (
                      <button
                        aria-label={`${item.name}, ${folderCounts[item.id] ?? 0} notes`}
                        className={`flex w-full items-center justify-center gap-2 rounded-lg px-2 py-1.5 text-[13px] font-medium transition md:justify-start md:px-3 ${
                          isActive
                            ? 'bg-amber-500/12 text-amber-600 dark:text-amber-400'
                            : 'text-zinc-700 hover:bg-black/4 dark:text-zinc-300 dark:hover:bg-white/5'
                        }`}
                        key={item.id}
                        onClick={() => handleFolderSelect(item.id)}
                        type="button"
                      >
                        <item.icon
                          aria-hidden
                          className={`size-4 shrink-0 ${
                            isActive
                              ? 'text-amber-500'
                              : 'text-zinc-400 dark:text-zinc-500'
                          }`}
                          stroke={1.7}
                        />
                        <span className="hidden min-w-0 flex-1 truncate text-left md:block">
                          {item.name}
                        </span>
                        <span className="hidden text-[11px] opacity-45 md:block">
                          {folderCounts[item.id] ?? 0}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>
            ))}
          </nav>
        </aside>
      )}

      <section className="flex h-full w-[190px] shrink-0 flex-col border-r border-black/8 bg-white md:w-56 dark:border-white/8 dark:bg-[#1e1e1e]">
        <header className="mt-2 flex h-[60px] shrink-0 items-center justify-between border-b border-black/5 px-4 dark:border-white/5">
          <div className="min-w-0">
            <h2 className="truncate text-[14px] font-semibold text-zinc-800 dark:text-white">
              Notes
            </h2>
            <p className="mt-1 text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
              {filteredNotes.length}{' '}
              {filteredNotes.length === 1 ? 'note' : 'notes'}
            </p>
          </div>
          <IconDots aria-hidden className="size-4 text-zinc-400" stroke={1.7} />
        </header>

        <label className="mx-2 mt-2 flex shrink-0 items-center gap-1.5 rounded-full bg-black/4 px-3 py-1.5 dark:bg-white/6">
          <IconSearch
            aria-hidden
            className="size-3.5 text-zinc-400"
            stroke={1.8}
          />
          <input
            aria-label="Search notes"
            className="min-w-0 flex-1 bg-transparent text-[12px] text-zinc-800 outline-hidden placeholder:text-zinc-400 dark:text-white dark:placeholder:text-zinc-500"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search"
            type="search"
            value={searchTerm}
          />
        </label>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {noteGroups.length ? (
            noteGroups.map((group) => (
              <section className="mb-4 last:mb-0" key={group.id}>
                <h3 className="mb-1 px-2 text-[10px] font-semibold text-zinc-400 uppercase dark:text-zinc-500">
                  {group.label}
                </h3>
                <div className="space-y-1">
                  {group.notes.map((note) => {
                    const isActive = tab === note.id

                    return (
                      <button
                        aria-label={`Open ${getDisplayTitle(note.content)}`}
                        className={`w-full rounded-xl border p-2 text-left transition ${
                          isActive
                            ? 'border-amber-500/25 bg-amber-500/20 shadow-sm'
                            : 'border-transparent hover:bg-black/4 dark:hover:bg-white/5'
                        }`}
                        key={note.id}
                        onClick={() => {
                          setTab(note.id)
                          setMode('readonly')
                        }}
                        type="button"
                      >
                        <p className="truncate text-[12px] font-semibold text-zinc-800 dark:text-white">
                          {getDisplayTitle(note.content)}
                        </p>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-zinc-400 dark:text-zinc-500">
                          <span className="shrink-0 font-semibold">
                            {formatUpdatedAt(note.updatedAt)}
                          </span>
                          <span className="truncate">
                            {getNotePreview(note.content)}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </section>
            ))
          ) : (
            <div className="flex h-full flex-col items-center justify-center px-4 text-center">
              <IconNotes
                className="size-8 text-zinc-300 dark:text-zinc-700"
                stroke={1.5}
              />
              <p className="mt-2 text-[12px] font-medium text-zinc-500 dark:text-zinc-400">
                No notes found
              </p>
              <button
                className="mt-3 rounded-full bg-amber-500 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-amber-600"
                onClick={onNewNote}
                type="button"
              >
                Create Note
              </button>
            </div>
          )}
        </div>
      </section>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white dark:bg-[#1e1e1e]">
        <header
          ref={isSidebarVisible ? undefined : windowChrome?.frameHeader}
          className="flex h-[60px] shrink-0 items-center justify-between gap-3 border-b border-black/8 px-4 md:px-5 dark:border-white/8"
          onDoubleClick={windowChrome?.onZoom}
        >
          <div className="flex min-w-0 items-center gap-2">
            {!isSidebarVisible && (
              <>
                <MacTrafficLights
                  appName="Notes"
                  isActive={windowChrome?.isFocused ?? true}
                  isFullscreen={windowChrome?.isFullscreen}
                  onClose={windowChrome?.onClose ?? (() => {})}
                  onMinimize={windowChrome?.onMinimize ?? (() => {})}
                  onZoom={windowChrome?.onZoom ?? (() => {})}
                />
                <button
                  aria-label="Show Notes sidebar"
                  className={toolbarButtonClass}
                  onClick={() => setIsSidebarVisible(true)}
                  type="button"
                >
                  <IconLayoutSidebarLeftExpand
                    className="size-4"
                    stroke={1.7}
                  />
                </button>
              </>
            )}
            <button
              aria-label="New Note"
              className={`${toolbarButtonClass} text-amber-500`}
              onClick={onNewNote}
              type="button"
            >
              <IconPlus className="size-4" stroke={1.8} />
            </button>
          </div>

          <div className="hidden items-center gap-0.5 rounded-full border border-black/5 bg-black/3 px-2 py-1 md:flex dark:border-white/5 dark:bg-white/4">
            <button
              aria-label="Text formatting"
              className="rounded-md px-2 py-1 text-xs font-semibold text-zinc-500 hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/5"
              type="button"
            >
              Aa
            </button>
            <button
              aria-label="Checklist"
              className="rounded-md p-1.5 text-zinc-500 hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/5"
              type="button"
            >
              <IconChecklist className="size-3.5" stroke={1.7} />
            </button>
            <button
              aria-label="Table"
              className="rounded-md p-1.5 text-zinc-500 hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/5"
              type="button"
            >
              <IconTable className="size-3.5" stroke={1.7} />
            </button>
            <button
              aria-label="Attachment"
              className="rounded-md p-1.5 text-zinc-500 hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/5"
              type="button"
            >
              <IconPaperclip className="size-3.5" stroke={1.7} />
            </button>
            <button
              aria-label="Lock Note"
              className="rounded-md p-1.5 text-zinc-500 hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/5"
              type="button"
            >
              <IconLock className="size-3.5" stroke={1.7} />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {isCopied && (
              <span className="hidden rounded-full bg-amber-500/12 px-2 py-1 text-[10px] font-medium text-amber-600 sm:block dark:text-amber-400">
                Copied
              </span>
            )}
            <button
              aria-label="Edit Note"
              className={noteActionButtonClass}
              onClick={onEdit}
              type="button"
            >
              <IconPencil className="size-3.5" stroke={1.7} />
            </button>
            <button
              aria-label="Share Note"
              className={noteActionButtonClass}
              onClick={onShare}
              type="button"
            >
              <IconShare className="size-3.5" stroke={1.7} />
            </button>
            {activeNote && (
              <button
                aria-label="Delete Note"
                className="flex size-8 items-center justify-center rounded-full border border-red-500/10 bg-red-500/5 text-red-500 transition hover:bg-red-500/10 dark:border-red-500/20 dark:bg-red-500/10 dark:hover:bg-red-500/20"
                onClick={() => onDelete(activeNote.id)}
                type="button"
              >
                <IconTrash className="size-3.5" stroke={1.7} />
              </button>
            )}
          </div>
        </header>

        {activeNote && activeNoteParts ? (
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 [scrollbar-width:none] sm:px-8 dark:[&::-webkit-scrollbar]:hidden">
            <div className="mx-auto flex min-h-full w-full max-w-xl flex-col">
              <p className="mb-4 text-center text-[11px] text-zinc-400 dark:text-zinc-500">
                {activeNoteTimestamp}
              </p>
              <input
                className="mb-4 w-full bg-transparent text-[22px] leading-tight font-bold text-zinc-800 outline-hidden placeholder:text-zinc-300 dark:text-white dark:placeholder:text-zinc-700"
                onChange={handleTitleChange}
                onDoubleClick={onEdit}
                onFocus={() => setMode('edit')}
                placeholder="New Note"
                readOnly={mode === 'readonly'}
                ref={titleRef}
                type="text"
                value={activeNoteParts.title}
              />
              <textarea
                className="min-h-[300px] flex-1 resize-none bg-transparent text-[14px] leading-relaxed text-zinc-700 outline-hidden placeholder:text-zinc-300 dark:text-zinc-200 dark:placeholder:text-zinc-700"
                onChange={handleBodyChange}
                onDoubleClick={onEdit}
                onFocus={() => setMode('edit')}
                placeholder="Start writing..."
                readOnly={mode === 'readonly'}
                ref={textareaRef}
                value={activeNoteParts.body}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center text-zinc-400 dark:text-zinc-500">
            <IconNotes className="size-12 opacity-40" stroke={1.4} />
            <p className="mt-3 text-[14px] font-medium">No Note Selected</p>
            <button
              className="mt-3 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-amber-600"
              onClick={onNewNote}
              type="button"
            >
              Create Note
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
