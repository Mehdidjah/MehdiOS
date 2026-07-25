'use client'

import { WindowChromeContext } from '@/app/components/window-frame'
import { MacTrafficLights } from '@/app/components/window-frame/mac-traffic-lights'
import author from '@/public/assets/images/author.webp'
import authorPoster from '@/public/assets/images/author2.webp'
import goku from '@/public/assets/images/goku.webp'
import {
  IconBrandGithub,
  IconBrandLeetcode,
  IconBrandLinkedin,
  IconChevronRight,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconMail,
  IconMessageCircleFilled,
  IconPlus,
  IconSearch,
  IconTrash,
  IconX,
} from '@tabler/icons-react'
import Image from 'next/image'
import {
  type FormEvent,
  type ReactNode,
  type RefObject,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

const CONTACTS_STORAGE_KEY = 'mehdios_contacts_v1'

const ABOUT_ME =
  "Hey there! I'm Mehdi, a skilled front-end developer from Algeria who genuinely loves building beautiful and interactive web experiences. I have a strong passion for coding, problem-solving, and creating smooth, high-performance interfaces. I enjoy mastering modern web technologies like React and Next.js and bringing projects to life with motion design. Currently, I'm collaborating with Thinkercare Group, where I get to combine my creativity and technical skills every day."

const PERSONAL_NOTE =
  'Beyond coding, I enjoy traveling, trying different foods, swimming, hiking in nature, and occasionally diving into a good book.'

type ContactRecord = {
  email: string
  firstName: string
  github: string
  id: string
  isPrimary?: boolean
  lastName: string
  leetcode: string
  linkedin: string
  notes: string
}

type ContactDraft = Omit<ContactRecord, 'id' | 'isPrimary'>

const mehdiContact: ContactRecord = {
  email: 'phoenixytbdjah7@gmail.com',
  firstName: 'Mehdi',
  github: 'https://github.com/Mehdidjah?tab=repositories',
  id: 'mehdi',
  isPrimary: true,
  lastName: 'Djahraoui',
  leetcode: '#',
  linkedin: 'https://www.linkedin.com/in/mehdi-djahraoui-134bb6389/',
  notes: `${ABOUT_ME} ${PERSONAL_NOTE}`,
}

const emptyDraft: ContactDraft = {
  email: '',
  firstName: '',
  github: '',
  lastName: '',
  leetcode: '',
  linkedin: '',
  notes: '',
}

const fullName = (contact: ContactRecord) =>
  `${contact.firstName} ${contact.lastName}`.trim()

function ContactAvatar({
  contact,
  className,
  sizes,
}: {
  contact: ContactRecord
  className: string
  sizes: string
}) {
  if (contact.isPrimary) {
    return (
      <span
        className={`relative block overflow-hidden rounded-full bg-[#d9efff] ${className}`}
      >
        <Image
          alt={fullName(contact)}
          className="object-cover"
          fill
          sizes={sizes}
          src={author}
        />
      </span>
    )
  }

  const initials = `${contact.firstName.charAt(0)}${contact.lastName.charAt(0)}`
    .trim()
    .toUpperCase()

  return (
    <span
      aria-label={fullName(contact)}
      className={`flex items-center justify-center rounded-full bg-gradient-to-br from-[#d8ebff] to-[#9cc5f3] font-semibold text-[#174b7d] ${className}`}
    >
      {initials || '?'}
    </span>
  )
}

function ContactAction({
  children,
  href,
  label,
  newTab = false,
}: {
  children: ReactNode
  href?: string
  label: string
  newTab?: boolean
}) {
  const className =
    'flex size-10 items-center justify-center rounded-full border border-black/10 bg-black/10 text-slate-800 shadow-md backdrop-blur-md transition hover:bg-black/15 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007aff] dark:border-white/20 dark:bg-white/15 dark:text-white dark:hover:bg-white/25'

  if (!href) {
    return (
      <button
        aria-label={`${label} unavailable`}
        className={`${className} cursor-not-allowed opacity-40`}
        disabled
        title={`${label} unavailable`}
        type="button"
      >
        {children}
      </button>
    )
  }

  return (
    <a
      aria-label={label}
      className={className}
      href={href}
      rel={newTab ? 'noopener noreferrer' : undefined}
      target={newTab ? '_blank' : undefined}
      title={label}
    >
      {children}
    </a>
  )
}

export function Contact() {
  const windowChrome = useContext(WindowChromeContext)
  const fallbackHeaderRef = useRef<HTMLDivElement>(null)
  const modalFirstFieldRef = useRef<HTMLInputElement>(null)
  const [contacts, setContacts] = useState<ContactRecord[]>([mehdiContact])
  const [selectedId, setSelectedId] = useState(mehdiContact.id)
  const [query, setQuery] = useState('')
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<ContactDraft>(emptyDraft)
  const [storageReady, setStorageReady] = useState(false)
  const dragHandleRef = windowChrome?.frameHeader ?? fallbackHeaderRef

  useEffect(() => {
    try {
      const savedContacts = window.localStorage.getItem(CONTACTS_STORAGE_KEY)
      if (savedContacts) {
        const parsedContacts = JSON.parse(savedContacts) as ContactRecord[]
        if (Array.isArray(parsedContacts) && parsedContacts.length > 0) {
          const customContacts = parsedContacts.filter(
            (contact) => contact.id !== mehdiContact.id
          )
          setContacts([mehdiContact, ...customContacts])
        }
      }
    } catch (error) {
      console.error('Failed to restore contacts:', error)
    } finally {
      setStorageReady(true)
    }
  }, [])

  useEffect(() => {
    if (!storageReady) return

    try {
      window.localStorage.setItem(
        CONTACTS_STORAGE_KEY,
        JSON.stringify(contacts)
      )
    } catch (error) {
      console.error('Failed to save contacts:', error)
    }
  }, [contacts, storageReady])

  useEffect(() => {
    if (!modalOpen) return

    const frame = requestAnimationFrame(() => {
      modalFirstFieldRef.current?.focus({ preventScroll: true })
    })

    return () => cancelAnimationFrame(frame)
  }, [modalOpen])

  const visibleContacts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return contacts

    return contacts.filter((contact) =>
      `${fullName(contact)} ${contact.email} ${contact.notes}`
        .toLowerCase()
        .includes(normalizedQuery)
    )
  }, [contacts, query])

  const contactGroups = useMemo(() => {
    return visibleContacts.reduce<Record<string, ContactRecord[]>>(
      (groups, contact) => {
        const letter = (contact.lastName || contact.firstName || '#')
          .charAt(0)
          .toUpperCase()
        groups[letter] = [...(groups[letter] ?? []), contact]
        return groups
      },
      {}
    )
  }, [visibleContacts])

  const selectedContact =
    contacts.find((contact) => contact.id === selectedId) ?? contacts[0]

  const openCreateContact = () => {
    setEditingId(null)
    setDraft(emptyDraft)
    setModalOpen(true)
  }

  const openEditContact = () => {
    if (!selectedContact || selectedContact.isPrimary) return

    setEditingId(selectedContact.id)
    setDraft({
      email: selectedContact.email,
      firstName: selectedContact.firstName,
      github: selectedContact.github,
      lastName: selectedContact.lastName,
      leetcode: selectedContact.leetcode,
      linkedin: selectedContact.linkedin,
      notes: selectedContact.notes,
    })
    setModalOpen(true)
  }

  const updateDraft = (field: keyof ContactDraft, value: string) => {
    setDraft((currentDraft) => ({ ...currentDraft, [field]: value }))
  }

  const saveContact = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const firstName = draft.firstName.trim()
    const lastName = draft.lastName.trim()
    if (!firstName || !lastName) return

    if (editingId === mehdiContact.id) {
      setModalOpen(false)
      return
    }

    if (editingId) {
      setContacts((currentContacts) =>
        currentContacts.map((contact) =>
          contact.id === editingId
            ? {
                ...contact,
                ...draft,
                firstName,
                lastName,
              }
            : contact
        )
      )
    } else {
      const id = `contact-${Date.now()}`
      setContacts((currentContacts) => [
        ...currentContacts,
        { ...draft, firstName, id, lastName },
      ])
      setSelectedId(id)
    }

    setModalOpen(false)
  }

  const deleteContact = () => {
    if (!editingId || selectedContact?.isPrimary) return

    setContacts((currentContacts) =>
      currentContacts.filter((contact) => contact.id !== editingId)
    )
    setSelectedId(mehdiContact.id)
    setModalOpen(false)
  }

  const mailto = selectedContact?.email
    ? `mailto:${selectedContact.email}?subject=${encodeURIComponent(`Hello ${selectedContact.firstName}`)}&body=${encodeURIComponent(`Hi ${selectedContact.firstName},`)}`
    : undefined

  return (
    <div className="relative flex h-full w-full overflow-hidden rounded-[inherit] bg-white font-sans text-[13px] text-gray-800 select-none dark:bg-[#1e1e1e] dark:text-white">
      {sidebarVisible && (
        <aside className="flex w-1/2 shrink-0 flex-col border-r border-black/[0.08] bg-[#f6f6f6] dark:border-white/10 dark:bg-[#1e1e1e]">
          <div
            className="flex h-12 shrink-0 items-center justify-between px-4"
            onDoubleClick={windowChrome?.onZoom}
            ref={dragHandleRef}
          >
            {windowChrome && (
              <MacTrafficLights
                appName="Contacts"
                className="mr-4"
                isActive={windowChrome.isFocused}
                isFullscreen={windowChrome.isFullscreen}
                onClose={windowChrome.onClose}
                onMinimize={windowChrome.onMinimize}
                onZoom={windowChrome.onZoom}
              />
            )}
            <button
              aria-label="Hide Contacts sidebar"
              className="flex size-7 items-center justify-center rounded-full border border-black/[0.05] text-gray-600 transition hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-[#007aff] dark:border-white/5 dark:text-gray-400 dark:hover:bg-white/5"
              onClick={() => setSidebarVisible(false)}
              title="Hide Sidebar"
              type="button"
            >
              <IconLayoutSidebarLeftCollapse
                aria-hidden
                size={15}
                stroke={1.7}
              />
            </button>
          </div>

          <div
            className="notes-no-scrollbar flex-1 overflow-y-auto px-2 pb-4"
            style={{ scrollbarWidth: 'none' }}
          >
            {Object.keys(contactGroups)
              .sort()
              .map((letter) => (
                <section className="mb-4" key={letter}>
                  <h2 className="px-3 py-1 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                    {letter}
                  </h2>
                  <div className="mt-0.5 space-y-0.5">
                    {contactGroups[letter].map((contact) => {
                      const isSelected = contact.id === selectedContact?.id

                      return (
                        <button
                          aria-current={isSelected}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition focus-visible:outline-2 focus-visible:outline-[#007aff] ${
                            isSelected
                              ? 'bg-[#007aff] text-white shadow-sm'
                              : 'text-gray-700 hover:bg-black/[0.03] dark:text-gray-300 dark:hover:bg-white/5'
                          }`}
                          key={contact.id}
                          onClick={() => setSelectedId(contact.id)}
                          type="button"
                        >
                          <ContactAvatar
                            className="size-8 shrink-0 text-[11px]"
                            contact={contact}
                            sizes="32px"
                          />
                          <span
                            className={`truncate text-[13px] ${
                              isSelected ? 'text-white' : 'dark:text-white'
                            }`}
                          >
                            {contact.firstName}{' '}
                            <strong>{contact.lastName}</strong>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </section>
              ))}

            {visibleContacts.length === 0 && (
              <p className="mt-10 text-center text-xs text-gray-400">
                No contacts found
              </p>
            )}
          </div>
        </aside>
      )}

      <main className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <header
          className="flex h-12 shrink-0 items-center justify-between border-b border-black/[0.08] bg-[#f6f6f6] px-6 select-none dark:border-white/10 dark:bg-[#1e1e1e]"
          onDoubleClick={windowChrome?.onZoom}
          ref={sidebarVisible ? undefined : dragHandleRef}
        >
          <div className="flex items-center gap-2">
            {!sidebarVisible && (
              <>
                {windowChrome && (
                  <MacTrafficLights
                    appName="Contacts"
                    className="mr-2"
                    isActive={windowChrome.isFocused}
                    isFullscreen={windowChrome.isFullscreen}
                    onClose={windowChrome.onClose}
                    onMinimize={windowChrome.onMinimize}
                    onZoom={windowChrome.onZoom}
                  />
                )}
                <button
                  aria-label="Show Contacts sidebar"
                  className="flex size-7 items-center justify-center rounded-full border border-black/[0.05] text-gray-600 transition hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-[#007aff] dark:border-white/5 dark:text-gray-400 dark:hover:bg-white/5"
                  onClick={() => setSidebarVisible(true)}
                  title="Show Sidebar"
                  type="button"
                >
                  <IconLayoutSidebarLeftExpand
                    aria-hidden
                    size={15}
                    stroke={1.7}
                  />
                </button>
              </>
            )}
          </div>

          <div className="relative flex items-center gap-2">
            {selectedContact && (
              <button
                aria-label={
                  selectedContact.isPrimary
                    ? 'Portfolio contact is read-only'
                    : `Edit ${fullName(selectedContact)}`
                }
                className="rounded-full border border-black/[0.08] bg-white px-3.5 py-1 text-[11px] font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-[#007aff] disabled:cursor-not-allowed dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                disabled={selectedContact.isPrimary}
                onClick={openEditContact}
                title={
                  selectedContact.isPrimary
                    ? 'Portfolio contact is read-only'
                    : 'Edit contact'
                }
                type="button"
              >
                Edit
              </button>
            )}
            <button
              aria-label="Add Contact"
              className="flex size-7 items-center justify-center rounded-full border border-black/[0.08] bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-[#007aff] dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
              onClick={openCreateContact}
              title="Add Contact"
              type="button"
            >
              <IconPlus aria-hidden size={14} stroke={1.8} />
            </button>
            <label className="flex w-[220px] items-center rounded-full border border-transparent bg-[#e5e5e7] px-3 py-1 text-gray-600 transition focus-within:ring-1 focus-within:ring-blue-500/30 dark:border-white/5 dark:bg-white/[0.08] dark:text-gray-300 dark:focus-within:ring-blue-500/50">
              <IconSearch
                aria-hidden
                className="mr-1.5 shrink-0 text-gray-400"
                size={13}
              />
              <span className="sr-only">Search contacts</span>
              <input
                aria-label="Search contacts"
                className="w-full bg-transparent text-[11px] text-inherit outline-none placeholder:text-gray-500"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search"
                type="search"
                value={query}
              />
            </label>
          </div>
        </header>

        <div className="relative flex flex-1 flex-col overflow-hidden p-3">
          {selectedContact ? (
            <article className="relative flex flex-1 flex-col justify-between overflow-hidden rounded-[16px] bg-gradient-to-br from-[#dff1ff] via-[#c7e1fb] to-[#9dc5ed] p-6 pb-6 text-slate-800 shadow-xl dark:from-[#303d4f] dark:via-[#263243] dark:to-[#1d2939] dark:text-white">
              {selectedContact.isPrimary && (
                <>
                  <Image
                    alt=""
                    className="object-cover opacity-[0.13] mix-blend-multiply dark:opacity-[0.12] dark:mix-blend-screen"
                    fill
                    priority={false}
                    sizes="395px"
                    src={goku}
                  />
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/10" />
                </>
              )}

              <div className="z-10 flex shrink-0 flex-col items-center pt-6">
                <span className="mb-4 rounded-full bg-black/5 p-1.5 shadow-2xl backdrop-blur-md dark:bg-white/20">
                  <ContactAvatar
                    className="size-28 text-3xl"
                    contact={selectedContact}
                    sizes="112px"
                  />
                </span>
                <h1 className="mb-4 text-center text-[32px] font-bold tracking-wide drop-shadow-sm select-text">
                  {fullName(selectedContact)}
                </h1>
                <div className="mb-2 flex items-center justify-center gap-4">
                  <ContactAction href={mailto} label="Message">
                    <IconMessageCircleFilled aria-hidden size={16} />
                  </ContactAction>
                  <ContactAction
                    href={selectedContact.linkedin || undefined}
                    label="LinkedIn"
                    newTab
                  >
                    <IconBrandLinkedin aria-hidden size={16} stroke={1.8} />
                  </ContactAction>
                  <ContactAction
                    href={selectedContact.github || undefined}
                    label="GitHub"
                    newTab
                  >
                    <IconBrandGithub aria-hidden size={16} stroke={1.8} />
                  </ContactAction>
                  <ContactAction href={mailto} label="Email">
                    <IconMail aria-hidden size={16} stroke={1.8} />
                  </ContactAction>
                </div>
              </div>

              <div
                className="notes-no-scrollbar z-10 mt-4 flex flex-1 flex-col gap-3 overflow-y-auto pr-1 select-text"
                style={{ scrollbarWidth: 'none' }}
              >
                <div className="flex w-full items-center justify-between rounded-2xl border border-black/5 bg-black/5 px-4 py-2.5 text-slate-800 shadow-sm backdrop-blur-md dark:border-white/15 dark:bg-white/10 dark:text-white">
                  <div className="flex items-center gap-3">
                    <span className="relative size-6 overflow-hidden rounded-full border border-black/10 bg-black/10 dark:border-white/30">
                      {selectedContact.isPrimary ? (
                        <Image
                          alt=""
                          className="object-cover"
                          fill
                          sizes="24px"
                          src={authorPoster}
                        />
                      ) : (
                        <ContactAvatar
                          className="size-6 text-[8px]"
                          contact={selectedContact}
                          sizes="24px"
                        />
                      )}
                    </span>
                    <span className="text-[12px] font-semibold">
                      Contact Photo &amp; Poster
                    </span>
                  </div>
                  <IconChevronRight
                    aria-hidden
                    className="opacity-70"
                    size={14}
                  />
                </div>

                <div className="flex w-full flex-col gap-3.5 rounded-2xl border border-black/5 bg-black/5 p-4 text-[12px] text-slate-800 shadow-sm backdrop-blur-md dark:border-white/15 dark:bg-white/10 dark:text-white">
                  {selectedContact.email && (
                    <div className="flex items-center justify-between">
                      <div className="flex min-w-0 flex-col">
                        <span className="text-[10px] font-semibold tracking-wider text-slate-800/60 uppercase dark:text-white/60">
                          home
                        </span>
                        <span className="mt-0.5 truncate font-medium">
                          {selectedContact.email}
                        </span>
                      </div>
                      <a
                        aria-label={`Email ${fullName(selectedContact)}`}
                        className="ml-3 flex size-8 shrink-0 items-center justify-center rounded-full border border-black/10 bg-black/5 shadow-sm transition hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-[#007aff] dark:border-white/20 dark:bg-white/10 dark:hover:bg-white/20"
                        href={mailto}
                        title="Mail"
                      >
                        <IconMail aria-hidden size={13} stroke={1.8} />
                      </a>
                    </div>
                  )}

                  {selectedContact.linkedin && (
                    <div className="flex items-center justify-between border-t border-black/5 pt-2 dark:border-white/5">
                      <div className="flex min-w-0 flex-col">
                        <span className="text-[10px] font-semibold tracking-wider text-slate-800/60 uppercase dark:text-white/60">
                          work
                        </span>
                        <span className="mt-0.5 truncate font-medium">
                          LinkedIn
                        </span>
                      </div>
                      <a
                        aria-label={`Open ${fullName(selectedContact)} on LinkedIn`}
                        className="ml-3 flex size-8 shrink-0 items-center justify-center rounded-full border border-black/10 bg-black/5 shadow-sm transition hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-[#007aff] dark:border-white/20 dark:bg-white/10 dark:hover:bg-white/20"
                        href={selectedContact.linkedin}
                        rel="noopener noreferrer"
                        target="_blank"
                        title="LinkedIn"
                      >
                        <IconBrandLinkedin aria-hidden size={13} stroke={1.8} />
                      </a>
                    </div>
                  )}

                  {selectedContact.github && (
                    <div className="flex items-center justify-between border-t border-black/5 pt-2 dark:border-white/5">
                      <div className="flex min-w-0 flex-col">
                        <span className="text-[10px] font-semibold tracking-wider text-slate-800/60 uppercase dark:text-white/60">
                          work
                        </span>
                        <span className="mt-0.5 truncate font-medium">
                          GitHub
                        </span>
                      </div>
                      <a
                        aria-label={`Open ${fullName(selectedContact)} on GitHub`}
                        className="ml-3 flex size-8 shrink-0 items-center justify-center rounded-full border border-black/10 bg-black/5 shadow-sm transition hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-[#007aff] dark:border-white/20 dark:bg-white/10 dark:hover:bg-white/20"
                        href={selectedContact.github}
                        rel="noopener noreferrer"
                        target="_blank"
                        title="GitHub"
                      >
                        <IconBrandGithub aria-hidden size={13} stroke={1.8} />
                      </a>
                    </div>
                  )}

                  {selectedContact.leetcode && (
                    <div className="flex items-center justify-between border-t border-black/5 pt-2 dark:border-white/5">
                      <div className="flex min-w-0 flex-col">
                        <span className="text-[10px] font-semibold tracking-wider text-slate-800/60 uppercase dark:text-white/60">
                          profile
                        </span>
                        <span className="mt-0.5 truncate font-medium">
                          LeetCode
                        </span>
                      </div>
                      <a
                        aria-label="Open LeetCode profile"
                        className="ml-3 flex size-8 shrink-0 items-center justify-center rounded-full border border-black/10 bg-black/5 shadow-sm transition hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-[#007aff] dark:border-white/20 dark:bg-white/10 dark:hover:bg-white/20"
                        href={selectedContact.leetcode}
                        rel="noopener noreferrer"
                        target="_blank"
                        title="LeetCode"
                      >
                        <IconBrandLeetcode aria-hidden size={13} stroke={1.8} />
                      </a>
                    </div>
                  )}

                  {selectedContact.notes && (
                    <div className="flex flex-col border-t border-black/5 pt-2 dark:border-white/5">
                      <span className="text-[10px] font-semibold tracking-wider text-slate-800/60 uppercase dark:text-white/60">
                        Notes
                      </span>
                      <span className="mt-0.5 leading-relaxed text-slate-800/90 dark:text-white/90">
                        {selectedContact.notes}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ) : (
            <div className="flex flex-1 items-center justify-center text-gray-400">
              Select a contact to view details
            </div>
          )}
        </div>
      </main>

      {modalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs">
          <form
            aria-label={editingId ? 'Edit Contact' : 'New Contact'}
            className="flex max-h-[calc(100%-32px)] w-[380px] flex-col gap-4 rounded-2xl border border-black/10 bg-white p-5 text-gray-800 shadow-2xl dark:border-white/10 dark:bg-[#2a2a2a] dark:text-white"
            onSubmit={saveContact}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-extrabold">
                {editingId ? 'Edit Contact' : 'New Contact'}
              </h2>
              <button
                aria-label="Close contact editor"
                className="rounded-full p-1.5 text-gray-500 transition hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-[#007aff] dark:text-gray-400 dark:hover:bg-white/10"
                onClick={() => setModalOpen(false)}
                type="button"
              >
                <IconX aria-hidden size={15} stroke={1.8} />
              </button>
            </div>

            <div
              className="notes-no-scrollbar flex max-h-[390px] flex-1 flex-col gap-3.5 overflow-y-auto pr-1"
              style={{ scrollbarWidth: 'none' }}
            >
              <div className="grid grid-cols-2 gap-3">
                <ContactField
                  inputRef={modalFirstFieldRef}
                  label="First Name"
                  onChange={(value) => updateDraft('firstName', value)}
                  placeholder="First"
                  required
                  value={draft.firstName}
                />
                <ContactField
                  label="Last Name"
                  onChange={(value) => updateDraft('lastName', value)}
                  placeholder="Last"
                  required
                  value={draft.lastName}
                />
              </div>
              <ContactField
                label="Email"
                onChange={(value) => updateDraft('email', value)}
                placeholder="name@example.com"
                type="email"
                value={draft.email}
              />
              <ContactField
                label="LinkedIn"
                onChange={(value) => updateDraft('linkedin', value)}
                placeholder="https://linkedin.com/in/..."
                type="url"
                value={draft.linkedin}
              />
              <ContactField
                label="GitHub"
                onChange={(value) => updateDraft('github', value)}
                placeholder="https://github.com/..."
                type="url"
                value={draft.github}
              />
              <ContactField
                label="LeetCode"
                onChange={(value) => updateDraft('leetcode', value)}
                placeholder="https://leetcode.com/..."
                value={draft.leetcode}
              />
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">
                  Notes
                </span>
                <textarea
                  className="h-20 w-full resize-none rounded-lg border border-black/10 bg-gray-50 px-3 py-2 text-[12px] text-gray-800 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-[#1e1e1e] dark:text-white"
                  onChange={(event) => updateDraft('notes', event.target.value)}
                  placeholder="Notes about this contact..."
                  value={draft.notes}
                />
              </label>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-black/5 pt-3 dark:border-white/5">
              {editingId && !selectedContact?.isPrimary ? (
                <button
                  className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[12px] font-semibold text-red-500 transition hover:bg-red-500/10 focus-visible:outline-2 focus-visible:outline-red-500"
                  onClick={deleteContact}
                  type="button"
                >
                  <IconTrash aria-hidden size={14} stroke={1.8} />
                  Delete
                </button>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-3">
                <button
                  className="rounded-lg px-4 py-2 text-[12px] font-semibold text-gray-600 transition hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-[#007aff] dark:text-gray-300 dark:hover:bg-white/5"
                  onClick={() => setModalOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="rounded-lg bg-blue-500 px-4 py-2 text-[12px] font-bold text-white shadow-sm transition hover:bg-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007aff]"
                  type="submit"
                >
                  Save
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function ContactField({
  inputRef,
  label,
  onChange,
  placeholder,
  required = false,
  type = 'text',
  value,
}: {
  inputRef?: RefObject<HTMLInputElement | null>
  label: string
  onChange: (value: string) => void
  placeholder: string
  required?: boolean
  type?: string
  value: string
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-[10px] font-bold text-gray-400 uppercase">
        {label}
      </span>
      <input
        className="w-full rounded-lg border border-black/10 bg-gray-50 px-3 py-2 text-[12px] text-gray-800 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-[#1e1e1e] dark:text-white"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        ref={inputRef}
        required={required}
        type={type}
        value={value}
      />
    </label>
  )
}
