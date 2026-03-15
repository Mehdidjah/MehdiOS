import {
  addNewNote,
  deleteNote,
  INote,
  loadNotes,
  updateNote,
} from '@/app/features/notes'
import { useCopy } from '@/app/hooks/use-copy'
import { useDispatch, useSelector } from '@/app/store'
import {
  IconCloud,
  IconFolder,
  IconHash,
  IconLayoutGrid,
  IconListDetails,
  IconNotes,
  IconPencil,
  IconPlus,
  IconSearch,
  IconShare,
  IconTrash,
} from '@tabler/icons-react'
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'

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
    (note) => !isWithinDays(note.updatedAt, 7) && isWithinDays(note.updatedAt, 30)
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
  'flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/3 text-[#c8d0ef] transition-colors hover:bg-white/8 hover:text-white'
const toolbarButtonActiveClass =
  'border-white/12 bg-white/9 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]'
const noteActionButtonClass =
  'flex size-8 items-center justify-center rounded-lg text-[#98a1c4] transition-colors hover:bg-white/6 hover:text-white'

export function INotes() {
  const inotes = useSelector((state) => state.iNotes.notes)
  const [tab, setTab] = useState('')
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
          new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
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
          counts[item.id] = sortedNotes.filter((note) => item.matches(note)).length
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
    <div className="h-full overflow-hidden bg-[#1a1b23] text-[#f4f6fb]">
      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)]">
        <div className="grid grid-cols-1 border-b border-white/8 bg-[#252734] md:grid-cols-[240px_280px_minmax(0,1fr)] xl:grid-cols-[280px_320px_minmax(0,1fr)]">
          <div className="flex items-center gap-2 border-b border-white/8 px-4 py-3 md:border-b-0 md:border-r md:border-white/8">
            <button
              className={toolbarButtonClass}
              onClick={onNewNote}
              type="button"
            >
              <IconPlus className="size-4" stroke={1.8} />
            </button>
            <button className={toolbarButtonClass} type="button">
              <IconNotes className="size-4" stroke={1.8} />
            </button>
            <div className="ml-auto text-sm text-[#8f96b8]">
              {folderCounts['all-notes'] ?? 0} notes
            </div>
          </div>

          <div className="flex items-center gap-2 border-b border-white/8 px-4 py-3 md:border-b-0 md:border-r md:border-white/8">
            <button
              className={`${toolbarButtonClass} ${toolbarButtonActiveClass}`}
              type="button"
            >
              <IconLayoutGrid className="size-4" stroke={1.8} />
            </button>
            <button className={toolbarButtonClass} type="button">
              <IconListDetails className="size-4" stroke={1.8} />
            </button>
            <div className="ml-auto rounded-full border border-white/10 bg-white/4 px-3 py-1 text-xs font-medium text-[#b3bbda]">
              {selectedFolder.name}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-2">
              {isCopied && (
                <span className="rounded-full border border-[#0a84ff]/30 bg-[#0a84ff]/12 px-2.5 py-1 text-[11px] font-medium text-[#9fd3ff]">
                  Copied
                </span>
              )}
              <button
                className={noteActionButtonClass}
                onClick={onEdit}
                type="button"
              >
                <IconPencil className="size-4" stroke={1.7} />
              </button>
              <button
                className={noteActionButtonClass}
                onClick={onShare}
                type="button"
              >
                <IconShare className="size-4" stroke={1.7} />
              </button>
              {activeNote && (
                <button
                  className={noteActionButtonClass}
                  onClick={() => onDelete(activeNote.id)}
                  type="button"
                >
                  <IconTrash className="size-4" stroke={1.7} />
                </button>
              )}
            </div>

            <div className="relative w-full min-w-[220px] max-w-[320px] flex-1">
              <IconSearch
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6f7694]"
                stroke={1.8}
              />
              <input
                className="w-full rounded-full border border-white/10 bg-[#1b1d27] py-2.5 pl-9 pr-4 text-[13px] text-[#eef2ff] outline-hidden placeholder:text-[#6f7694]"
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search"
                type="text"
                value={searchTerm}
              />
            </div>
          </div>
        </div>

        <div className="grid min-h-0 grid-cols-1 grid-rows-[240px_320px_minmax(0,1fr)] md:grid-cols-[240px_280px_minmax(0,1fr)] md:grid-rows-1 xl:grid-cols-[280px_320px_minmax(0,1fr)]">
          <aside className="flex min-h-0 flex-col border-b border-white/8 bg-[#20222d] md:border-b-0 md:border-r md:border-white/8">
            <div className="border-b border-white/8 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#727893]">
                iCloud
              </p>
              <h2 className="mt-3 text-[30px] font-semibold tracking-tight text-[#f4f6fb]">
                All iCloud
              </h2>
              <p className="mt-1 text-sm text-[#8f96b8]">
                {folderCounts['all-notes'] ?? 0} notes
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4">
              {folderSections.map((section) => (
                <div className="mb-6" key={section.name}>
                  <div className="mb-2 px-2">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#727893]">
                      {section.icon && (
                        <section.icon className="size-3.5" stroke={1.7} />
                      )}
                      <span>{section.name}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const isActive = selectedFolderId === item.id

                      return (
                        <button
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                            isActive
                              ? 'bg-white/8 text-[#0a84ff] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]'
                              : 'text-[#eef2ff] hover:bg-white/4'
                          }`}
                          key={item.id}
                          onClick={() => handleFolderSelect(item.id)}
                          type="button"
                        >
                          <item.icon
                            className={`size-4 ${
                              isActive ? 'text-[#0a84ff]' : 'text-[#9ca5c8]'
                            }`}
                            stroke={1.7}
                          />
                          <span className="flex-1 truncate">{item.name}</span>
                          <span
                            className={`text-sm ${
                              isActive ? 'text-[#cfe7ff]' : 'text-[#6f7694]'
                            }`}
                          >
                            {folderCounts[item.id] ?? 0}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <section className="flex min-h-0 min-w-0 flex-col border-b border-white/8 bg-[#1d1f2a] md:border-b-0 md:border-r md:border-white/8">
            <div className="border-b border-white/8 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#727893]">
                Notes
              </p>
              <div className="mt-2 flex items-end justify-between gap-4">
                <h3 className="text-[28px] font-semibold tracking-tight text-[#f4f6fb]">
                  {selectedFolder.name}
                </h3>
                <span className="rounded-full border border-white/10 bg-white/4 px-3 py-1 text-xs font-medium text-[#a7afcf]">
                  {filteredNotes.length}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4">
              {noteGroups.length ? (
                noteGroups.map((group) => (
                  <div className="mb-6" key={group.id}>
                    <div className="px-2 pb-2 text-[13px] font-semibold text-[#7c84a4]">
                      {group.label}
                    </div>

                    <div className="space-y-2">
                      {group.notes.map((note) => {
                        const isActive = tab === note.id

                        return (
                          <button
                            className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                              isActive
                                ? 'border-[#2997ff]/50 bg-[#0a84ff] text-white shadow-[0_18px_30px_rgba(10,132,255,0.28)]'
                                : 'border-white/6 bg-white/3 text-[#f3f5ff] hover:bg-white/6'
                            }`}
                            key={note.id}
                            onClick={() => {
                              setTab(note.id)
                              setMode('readonly')
                            }}
                            type="button"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <h4 className="line-clamp-2 flex-1 text-[16px] font-semibold leading-6">
                                {getDisplayTitle(note.content)}
                              </h4>
                              <span
                                className={`whitespace-nowrap text-[12px] ${
                                  isActive ? 'text-white/80' : 'text-[#7c84a4]'
                                }`}
                              >
                                {formatUpdatedAt(note.updatedAt)}
                              </span>
                            </div>
                            <p
                              className={`mt-2 line-clamp-2 text-[13px] leading-6 ${
                                isActive ? 'text-white/80' : 'text-[#98a1c4]'
                              }`}
                            >
                              {getNotePreview(note.content)}
                            </p>
                            <div
                              className={`mt-3 flex items-center gap-2 text-[12px] ${
                                isActive ? 'text-white/75' : 'text-[#7c84a4]'
                              }`}
                            >
                              <IconFolder className="size-3.5" stroke={1.7} />
                              <span>
                                {selectedFolder.id === 'all-notes'
                                  ? 'Notes'
                                  : selectedFolder.name}
                              </span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-full min-h-[260px] flex-col items-center justify-center gap-3 px-6 text-center">
                  <IconNotes className="size-9 text-[#5b6280]" stroke={1.5} />
                  <div>
                    <p className="text-sm font-medium text-[#eef2ff]">
                      No notes in this view
                    </p>
                    <p className="mt-1 text-[13px] text-[#7c84a4]">
                      Try another folder or create a new note.
                    </p>
                  </div>
                  <button
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[13px] font-medium text-[#eef2ff] transition-colors hover:bg-white/8"
                    onClick={onNewNote}
                    type="button"
                  >
                    Create Note
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="flex min-h-0 min-w-0 flex-col bg-[#1a1b23]">
            {activeNote && activeNoteParts ? (
              <>
                <div className="border-b border-white/8 px-6 py-4">
                  <p className="text-center text-sm text-[#7c84a4]">
                    {activeNoteTimestamp}
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <div className="mx-auto flex min-h-full w-full max-w-[980px] min-w-0 flex-col px-6 py-8 sm:px-10 sm:py-10">
                    <input
                      className="mb-8 w-full bg-transparent text-[34px] font-semibold tracking-tight text-[#f7f8ff] outline-hidden placeholder:text-[#5f6785]"
                      onChange={handleTitleChange}
                      onDoubleClick={onEdit}
                      placeholder="Untitled Note"
                      readOnly={mode === 'readonly'}
                      ref={titleRef}
                      type="text"
                      value={activeNoteParts.title}
                    />
                    <textarea
                      className="min-h-[420px] flex-1 resize-none bg-transparent text-[17px] leading-8 text-[#d6dcf3] outline-hidden placeholder:text-[#5f6785]"
                      onChange={handleBodyChange}
                      onDoubleClick={onEdit}
                      placeholder="Start writing..."
                      readOnly={mode === 'readonly'}
                      ref={textareaRef}
                      value={activeNoteParts.body}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center px-6 text-center">
                <div>
                  <p className="text-[18px] font-medium text-[#eef2ff]">
                    Select a note
                  </p>
                  <p className="mt-2 text-[14px] text-[#7c84a4]">
                    Choose one from the list or create a new note.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
