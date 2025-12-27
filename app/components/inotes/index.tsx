import {
  addNewNote,
  deleteNote,
  INote,
  loadNotes,
  updateNote,
} from '@/app/features/notes'
import { useDispatch, useSelector } from '@/app/store'
import { IconNotes, IconPlus } from '@tabler/icons-react'
import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FaRegTrashCan } from 'react-icons/fa6'
import { FiEdit } from 'react-icons/fi'

export function INotes() {
  const inotes = useSelector((state) => state.iNotes.notes)
  const [tab, setTab] = useState<string>('')
  const activeNote = useMemo(
    () => inotes.find((note) => note.id === tab),
    [inotes, tab]
  )
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const dispatch = useDispatch()
  const [mode, setMode] = useState<'readonly' | 'edit'>('readonly')

  useEffect(() => {
    if (textareaRef.current instanceof HTMLTextAreaElement) {
      textareaRef.current.focus()
      const length = textareaRef.current.value.length
      textareaRef.current.setSelectionRange(length, length)
    }
  }, [tab])

  useEffect(() => {
    try {
      const localNotes = localStorage.getItem('iNotes')
      if (!localNotes) return
      
      const parseNotes: INote[] | null = JSON.parse(localNotes)
      if (parseNotes && Array.isArray(parseNotes)) {
        dispatch(loadNotes(parseNotes))
      }
    } catch (error) {
      console.error('Failed to load notes from localStorage:', error)
    }
  }, [dispatch])

  const onDelete = useCallback(
    (id: string) => {
      dispatch(deleteNote(id))
      const updatedNotes = inotes.filter((note) => note.id !== id)
      try {
        localStorage.setItem('iNotes', JSON.stringify(updatedNotes))
      } catch (error) {
        console.error('Failed to save notes to localStorage:', error)
      }
      setMode('readonly')
      if (tab === id) {
        setTab('')
      }
    },
    [dispatch, inotes, tab]
  )

  const onNewNote = useCallback(() => {
    const id = crypto.randomUUID()
    dispatch(
      addNewNote({
        id,
        content: 'Hurray! This is my new note',
        updatedAt: new Date().toISOString(),
      })
    )
    setTab(id)
    setMode('edit')
  }, [dispatch])

  const onEdit = useCallback(() => {
    if (mode === 'edit') return
    setMode('edit')
    setTimeout(() => {
      if (textareaRef.current instanceof HTMLTextAreaElement) {
        textareaRef.current.focus()
        const length = textareaRef.current.value.length
        textareaRef.current.setSelectionRange(length, length)
      }
    }, 0)
  }, [mode])

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      if (!tab) return

      const newContent = e.target.value
      dispatch(
        updateNote({
          id: tab,
          content: newContent,
          updatedAt: new Date().toISOString(),
        })
      )

      const updatedNotes = inotes.map((note) =>
        note.id === tab
          ? {
              id: tab,
              content: newContent,
              updatedAt: new Date().toISOString(),
            }
          : note
      )

      try {
        localStorage.setItem('iNotes', JSON.stringify(updatedNotes))
      } catch (error) {
        console.error('Failed to save notes to localStorage:', error)
      }
    },
    [dispatch, tab, inotes]
  )

  return (
    <div className="grid h-full grid-cols-1 sm:grid-cols-[200px,1fr] lg:grid-cols-[250px,1fr]">
      <div className="max-h-full overflow-y-auto bg-light-foreground p-2 sm:p-4 dark:bg-dark-foreground border-b sm:border-b-0 sm:border-r border-light-border dark:border-dark-border">
        <div className="mb-3">
          <button
            onClick={onNewNote}
            className="flex w-full items-center gap-2 rounded-md bg-white px-4 py-1 text-sm font-medium dark:bg-white/10"
          >
            <IconPlus className="size-4" stroke={2} />
            <span>Write a new note</span>
          </button>
        </div>
        <h3 className="text-sm font-medium text-[#9a9a9a]">On your iCloud</h3>
        <div className="mt-2 space-y-2">
          {inotes.map((note) => (
            <button
              key={note.id}
              onClick={() => {
                setTab(note.id)
                setMode('readonly')
              }}
              className={`grid w-full grid-cols-[auto,1fr] gap-2 rounded-md px-2 py-1 ${tab === note.id ? 'bg-white dark:bg-dark-hover-bg' : 'hover:bg-white dark:hover:bg-dark-hover-bg'}`}
            >
              <div className="size-6">
                <IconNotes
                  stroke={2}
                  className="size-full translate-y-[2px] text-emerald-500"
                />
              </div>
              <div className="flex flex-col text-start min-w-0 flex-1">
                <h2 className="line-clamp-1 text-xs sm:text-sm font-medium truncate">
                  {note.content.trim().length > 2
                    ? note.content.trim().length <= 40
                      ? note.content.trim()
                      : note.content.trim().slice(0, 37) + '...'
                    : 'My New Note'}
                </h2>
                <h2 className="text-[10px] sm:text-xs">
                  {new Date(note.updatedAt).toLocaleDateString('en-US', {
                    day: '2-digit',
                    month: 'short',
                    year: '2-digit',
                  })}
                </h2>
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="max-h-full overflow-y-auto p-2 sm:p-4">
        {activeNote ? (
          <>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => onDelete(activeNote.id)}
                type="button"
              >
                <FaRegTrashCan />
              </button>
              <button onClick={onEdit} type="button">
                <FiEdit />
              </button>
            </div>
            <textarea
              title="Double Click To Edit"
              onDoubleClick={onEdit}
              readOnly={mode === 'readonly'}
              ref={textareaRef}
              className="h-[calc(100%-22px)] w-full resize-none bg-inherit focus:outline-none"
              value={activeNote.content}
              onChange={handleChange}
            />
          </>
        ) : (
          <div className="flex size-full items-center justify-center">
            <button
              onClick={onNewNote}
              className="flex items-center gap-2 rounded-md bg-light-foreground px-4 py-2 text-sm font-medium dark:bg-white/10"
            >
              <IconPlus className="size-4" stroke={2} />
              <span>Write a new note</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
