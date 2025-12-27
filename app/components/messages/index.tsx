'use client'

import { IconMail, IconSend, IconUser } from '@tabler/icons-react'
import { FormEvent, useState, useCallback } from 'react'

const EMAIL_ADDRESS = 'phoenixytbdjah7@gmail.com'

export function Messages() {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = useCallback((e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    const trimmedSubject = subject.trim()
    const trimmedBody = body.trim()
    
    if (!trimmedSubject || !trimmedBody) {
      return
    }

    setIsSubmitting(true)

    try {
      const encodedSubject = encodeURIComponent(trimmedSubject)
      const encodedBody = encodeURIComponent(trimmedBody)
      const mailtoLink = `mailto:${EMAIL_ADDRESS}?subject=${encodedSubject}&body=${encodedBody}`

      window.location.href = mailtoLink

      setTimeout(() => {
        setSubject('')
        setBody('')
        setIsSubmitting(false)
      }, 500)
    } catch (error) {
      console.error('Failed to open email client:', error)
      setIsSubmitting(false)
    }
  }, [subject, body])

  return (
    <div className="flex h-full flex-col overflow-hidden bg-light-background dark:bg-dark-background">
      <div className="border-b border-light-border/50 bg-white/50 px-4 sm:px-8 py-3 sm:py-5 backdrop-blur-sm dark:border-dark-border/50 dark:bg-dark-foreground/50">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
            <IconMail className="text-primary" stroke={2} size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-semibold text-light-text dark:text-dark-text truncate">
              New Message
            </h1>
            <div className="mt-0.5 flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              <IconUser stroke={1.5} size={14} className="flex-shrink-0" />
              <span className="truncate">{EMAIL_ADDRESS}</span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">
          <div className="mb-6">
            <label htmlFor="subject" className="sr-only">
              Email Subject
            </label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              aria-label="Email subject"
              className="w-full border-0 bg-transparent px-0 text-lg font-medium text-light-text placeholder:text-gray-400 focus:outline-none focus:ring-0 dark:text-dark-text dark:placeholder:text-gray-500"
              required
              autoFocus
              disabled={isSubmitting}
            />
          </div>

          <div className="mb-6 h-px bg-light-border/50 dark:bg-dark-border/50" />

          <div>
            <label htmlFor="message" className="sr-only">
              Email Message
            </label>
            <textarea
              id="message"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your message here..."
              aria-label="Email message body"
              className="min-h-[300px] sm:min-h-[400px] w-full resize-none border-0 bg-transparent px-0 text-sm sm:text-base leading-relaxed text-light-text placeholder:text-gray-400 focus:outline-none focus:ring-0 dark:text-dark-text dark:placeholder:text-gray-500"
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="border-t border-light-border/50 bg-white/50 px-4 sm:px-8 py-3 sm:py-4 backdrop-blur-sm dark:border-dark-border/50 dark:bg-dark-foreground/50">
          <div className="flex items-center justify-end gap-2 sm:gap-3">
            <button
              type="submit"
              disabled={!subject.trim() || !body.trim() || isSubmitting}
              aria-label="Send email"
              className="flex items-center gap-2 rounded-full bg-primary px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-primary disabled:hover:shadow-sm active:scale-95"
            >
              <IconSend stroke={2.5} size={18} aria-hidden="true" />
              <span>{isSubmitting ? 'Opening...' : 'Send'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
