'use client'

import { WindowChromeContext } from '@/app/components/window-frame'
import { MacTrafficLights } from '@/app/components/window-frame/mac-traffic-lights'
import author from '@/public/assets/images/author.webp'
import {
  IconBrandGithub,
  IconBrandLinkedin,
  IconChevronDown,
  IconCirclePlus,
  IconEdit,
  IconMail,
  IconMicrophone,
  IconMoodSmile,
  IconSearch,
  IconSend2,
  IconVideo,
} from '@tabler/icons-react'
import Image from 'next/image'
import {
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

const EMAIL_ADDRESS = 'phoenixytbdjah7@gmail.com'
const CONTACT_NAME = 'Mehdi Djahraoui'

const welcomeMessages = [
  'Hi, I’m Mehdi, a front-end developer from Algeria.',
  'Have a project or an idea in mind? Write your subject and message below.',
]

const pinnedContacts = [
  { id: 'mehdi', label: 'Mehdi', type: 'profile' },
  { id: 'linkedin', label: 'LinkedIn', type: 'linkedin' },
  { id: 'github', label: 'GitHub', type: 'github' },
] as const

export function Messages() {
  const windowChrome = useContext(WindowChromeContext)
  const fallbackHeaderRef = useRef<HTMLDivElement>(null)
  const subjectRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [query, setQuery] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const dragHandleRef = windowChrome?.frameHeader ?? fallbackHeaderRef

  useEffect(() => {
    subjectRef.current?.focus({ preventScroll: true })
  }, [])

  const isConversationVisible = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return true

    return `${CONTACT_NAME} ${EMAIL_ADDRESS} portfolio`
      .toLowerCase()
      .includes(normalizedQuery)
  }, [query])

  const startNewMessage = useCallback(() => {
    setSubject('')
    setBody('')
    requestAnimationFrame(() =>
      subjectRef.current?.focus({ preventScroll: true })
    )
  }, [])

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      const trimmedSubject = subject.trim()
      const trimmedBody = body.trim()

      if (!trimmedSubject || !trimmedBody) return

      setIsSubmitting(true)

      try {
        const mailtoLink = `mailto:${EMAIL_ADDRESS}?subject=${encodeURIComponent(trimmedSubject)}&body=${encodeURIComponent(trimmedBody)}`
        window.location.href = mailtoLink

        window.setTimeout(() => {
          setSubject('')
          setBody('')
          setIsSubmitting(false)
        }, 500)
      } catch (error) {
        console.error('Failed to open email client:', error)
        setIsSubmitting(false)
      }
    },
    [body, subject]
  )

  const handleMessageKeyDown = (
    event: ReactKeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      formRef.current?.requestSubmit()
    }
  }

  const preview = body.trim() || subject.trim() || 'Start a conversation'

  return (
    <div className="flex h-full w-full overflow-hidden rounded-[inherit] bg-white font-sans text-[13px] text-gray-800 select-none dark:bg-[#1e1e1e] dark:text-white">
      <aside className="flex w-[290px] shrink-0 flex-col overflow-hidden border-r border-[#e5e5e5] bg-[#f6f6f6] dark:border-white/10 dark:bg-[#1e1e1e]">
        <div
          className="flex h-11 shrink-0 items-center justify-between px-4"
          onDoubleClick={windowChrome?.onZoom}
          ref={dragHandleRef}
        >
          {windowChrome && (
            <MacTrafficLights
              appName="Messages"
              className="mr-4"
              isActive={windowChrome.isFocused}
              isFullscreen={windowChrome.isFullscreen}
              onClose={windowChrome.onClose}
              onMinimize={windowChrome.onMinimize}
              onZoom={windowChrome.onZoom}
            />
          )}
          <button
            aria-label="New Message"
            className="flex size-7 items-center justify-center rounded-full text-gray-700 transition hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-[#007aff] dark:text-gray-300 dark:hover:bg-white/5"
            onClick={startNewMessage}
            title="New Message"
            type="button"
          >
            <IconEdit aria-hidden size={15} stroke={1.8} />
          </button>
        </div>

        <div className="shrink-0 px-3.5 pb-3">
          <label className="flex items-center rounded-full border border-transparent bg-[#e3e3e5] px-3 py-1.5 text-gray-600 transition focus-within:border-blue-500/30 focus-within:bg-white dark:border-white/5 dark:bg-[#2a2a2a] dark:text-gray-300 dark:focus-within:border-blue-500/50">
            <IconSearch
              aria-hidden
              className="mr-2 shrink-0 text-gray-400"
              size={14}
            />
            <span className="sr-only">Search conversations</span>
            <input
              aria-label="Search conversations"
              className="w-full bg-transparent text-[13px] text-inherit outline-none placeholder:text-gray-500"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              type="search"
              value={query}
            />
          </label>
        </div>

        <div className="grid shrink-0 grid-cols-3 gap-x-3 gap-y-4 border-b border-black/[0.04] px-4 pb-4 dark:border-white/[0.04]">
          {pinnedContacts.map((contact) => (
            <button
              aria-label={`Message ${contact.label}`}
              className="group flex min-w-0 flex-col items-center text-center"
              key={contact.id}
              onClick={() => subjectRef.current?.focus()}
              type="button"
            >
              <span className="relative flex size-[72px] items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#d9efff] to-[#a6c9f5] p-1 shadow-md transition group-hover:scale-105 group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-[#007aff] dark:from-[#25364b] dark:to-[#172235]">
                {contact.type === 'profile' && (
                  <Image
                    alt="Mehdi Djahraoui"
                    className="rounded-full object-cover"
                    fill
                    sizes="72px"
                    src={author}
                  />
                )}
                {contact.type === 'linkedin' && (
                  <IconBrandLinkedin
                    aria-hidden
                    className="text-[#0a66c2] dark:text-[#5ab0ff]"
                    size={38}
                    stroke={1.65}
                  />
                )}
                {contact.type === 'github' && (
                  <IconBrandGithub
                    aria-hidden
                    className="text-[#24292f] dark:text-white"
                    size={38}
                    stroke={1.65}
                  />
                )}
              </span>
              <span className="mt-1.5 w-full truncate text-[11px] font-medium text-gray-600 dark:text-gray-300">
                {contact.label}
              </span>
            </button>
          ))}
        </div>

        <div
          className="notes-no-scrollbar flex-1 overflow-y-auto"
          style={{ scrollbarWidth: 'none' }}
        >
          {isConversationVisible ? (
            <button
              aria-current="true"
              className="flex w-full items-center gap-3 border-b border-blue-600 bg-[#007aff] px-4 py-3.5 text-left text-white"
              onClick={() => subjectRef.current?.focus()}
              type="button"
            >
              <span className="relative size-11 shrink-0 overflow-hidden rounded-full bg-[#d9efff] p-0.5 shadow-sm">
                <Image
                  alt="Mehdi Djahraoui"
                  className="rounded-full object-cover"
                  fill
                  sizes="44px"
                  src={author}
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-[13px] font-semibold">
                    {CONTACT_NAME}
                  </span>
                  <span className="shrink-0 text-[10px] text-white/80">
                    Now
                  </span>
                </span>
                <span className="mt-0.5 block truncate text-[11px] text-white/90">
                  {preview}
                </span>
              </span>
            </button>
          ) : (
            <p className="mt-10 px-4 text-center text-xs text-gray-400">
              No conversations found
            </p>
          )}
        </div>
      </aside>

      <main className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-[68px] shrink-0 items-center justify-between border-b border-[#e5e5e5] bg-white px-6 select-none dark:border-white/10 dark:bg-[#1e1e1e]">
          <button
            aria-label="New Message"
            className="flex size-9 items-center justify-center rounded-full border border-black/5 bg-black/[0.04] text-gray-700 transition hover:bg-black/[0.08] focus-visible:outline-2 focus-visible:outline-[#007aff] dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-300 dark:hover:bg-white/[0.08]"
            onClick={startNewMessage}
            title="New Message"
            type="button"
          >
            <IconEdit aria-hidden size={16} stroke={1.8} />
          </button>

          <div className="flex flex-col items-center py-1">
            <span className="relative size-[34px] overflow-hidden rounded-full border border-black/5 bg-[#d9efff] p-0.5 shadow-sm dark:border-white/10">
              <Image
                alt="Mehdi Djahraoui"
                className="rounded-full object-cover"
                fill
                sizes="34px"
                src={author}
              />
            </span>
            <span className="mt-1 flex items-center gap-0.5 rounded-full bg-black/[0.05] px-2 py-0.5 text-[10px] font-medium text-gray-700 dark:bg-white/[0.05] dark:text-gray-300">
              {CONTACT_NAME}
              <IconChevronDown
                aria-hidden
                className="text-gray-400 dark:text-gray-500"
                size={10}
              />
            </span>
          </div>

          <button
            aria-label="FaceTime video call unavailable"
            className="flex size-9 cursor-not-allowed items-center justify-center rounded-full border border-black/5 bg-black/[0.04] text-gray-400 opacity-65 dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-500"
            disabled
            title="FaceTime unavailable"
            type="button"
          >
            <IconVideo aria-hidden size={16} stroke={1.8} />
          </button>
        </header>

        <div
          aria-label="Conversation with Mehdi Djahraoui"
          className="notes-no-scrollbar flex-1 space-y-4 overflow-y-auto px-6 py-4 select-text"
          role="log"
          style={{ scrollbarWidth: 'none' }}
        >
          <div className="mb-1 flex justify-center">
            <span className="rounded-full bg-black/[0.04] px-2.5 py-1 text-[10px] font-medium text-gray-400 dark:bg-white/[0.05]">
              Portfolio contact
            </span>
          </div>

          {welcomeMessages.map((message) => (
            <div className="flex items-start" key={message}>
              <p className="max-w-[72%] rounded-2xl rounded-bl-xs bg-[#e9e9eb] px-3.5 py-2 text-[12.3px] leading-relaxed text-black dark:bg-[#3a3a3c] dark:text-white">
                {message}
              </p>
            </div>
          ))}

          {body.trim() && (
            <div className="flex flex-col items-end">
              <p className="max-w-[72%] rounded-2xl rounded-br-xs bg-[#007aff] px-3.5 py-2 text-[12.3px] leading-relaxed whitespace-pre-wrap text-white">
                {body}
              </p>
              <span className="mt-1 mr-1 text-[9px] text-gray-400">Draft</span>
            </div>
          )}
        </div>

        <form
          className="shrink-0 border-t border-[#e5e5e5] bg-white px-4 py-2.5 dark:border-white/10 dark:bg-[#1e1e1e]"
          onSubmit={handleSubmit}
          ref={formRef}
        >
          <label className="mb-2 flex items-center gap-2 border-b border-black/[0.06] pb-2 dark:border-white/[0.08]">
            <IconMail
              aria-hidden
              className="shrink-0 text-gray-400"
              size={14}
            />
            <span className="text-[11px] font-medium text-gray-400">
              Subject
            </span>
            <input
              aria-label="Email subject"
              className="min-w-0 flex-1 bg-transparent text-[12px] text-gray-800 outline-none placeholder:text-gray-400 dark:text-white"
              disabled={isSubmitting}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="What would you like to discuss?"
              ref={subjectRef}
              required
              type="text"
              value={subject}
            />
          </label>

          <div className="flex items-end gap-2.5">
            <button
              aria-label="Add attachment"
              className="mb-1 flex size-7 items-center justify-center rounded-full text-gray-600 transition hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-[#007aff] dark:text-gray-300 dark:hover:bg-white/5"
              title="Add attachment"
              type="button"
            >
              <IconCirclePlus aria-hidden size={17} stroke={1.8} />
            </button>

            <label className="flex min-h-9 flex-1 items-center rounded-[18px] border border-[#dcdcdc] bg-[#fcfcfc] px-3.5 py-1.5 focus-within:border-blue-400 focus-within:bg-white focus-within:ring-1 focus-within:ring-blue-400 dark:border-white/15 dark:bg-[#1e1e1e] dark:focus-within:border-blue-500 dark:focus-within:ring-blue-500">
              <span className="sr-only">Message</span>
              <textarea
                aria-label="Email message body"
                className="max-h-24 min-h-[18px] w-full resize-none bg-transparent text-[12.3px] leading-[18px] text-inherit outline-none placeholder:text-gray-400"
                disabled={isSubmitting}
                onChange={(event) => setBody(event.target.value)}
                onKeyDown={handleMessageKeyDown}
                placeholder="iMessage"
                required
                rows={1}
                value={body}
              />
              <IconMicrophone
                aria-hidden
                className="ml-2 shrink-0 text-gray-400"
                size={15}
                stroke={1.8}
              />
            </label>

            <button
              aria-label="Choose emoji"
              className="mb-1 flex size-7 items-center justify-center rounded-full text-gray-600 transition hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-[#007aff] dark:text-gray-300 dark:hover:bg-white/5"
              title="Choose emoji"
              type="button"
            >
              <IconMoodSmile aria-hidden size={17} stroke={1.8} />
            </button>
            <button
              aria-label="Send email"
              className="mb-1 flex size-7 items-center justify-center rounded-full bg-[#007aff] text-white shadow-sm transition hover:bg-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007aff] disabled:cursor-not-allowed disabled:bg-gray-400 disabled:opacity-55"
              disabled={!subject.trim() || !body.trim() || isSubmitting}
              title={isSubmitting ? 'Opening mail app' : 'Send email'}
              type="submit"
            >
              <IconSend2 aria-hidden size={14} stroke={2.2} />
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
