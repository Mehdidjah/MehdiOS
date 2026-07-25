'use client'

import { motion } from 'framer-motion'
import {
  type MouseEvent,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

const menuSurfaceClass =
  'border-black/[0.08] bg-[rgba(245,245,247,0.72)] text-gray-900 shadow-[0_10px_30px_rgba(0,0,0,0.06),inset_0_0_0_1px_rgba(255,255,255,0.6)] ring-1 ring-inset ring-white/60 backdrop-blur-[24px] backdrop-saturate-150 dark:border-white/10 dark:bg-[rgba(18,18,18,0.75)] dark:text-white dark:shadow-[0_10px_40px_rgba(0,0,0,0.45),inset_0_0_0_1px_rgba(255,255,255,0.08)] dark:ring-white/[0.08]'

export function MacContextMenu({
  ariaLabel = 'Context menu',
  children,
  position,
}: {
  ariaLabel?: string
  children: ReactNode
  position: { x: number; y: number }
}) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [safePosition, setSafePosition] = useState(position)

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        document.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      }
    }

    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [])

  useLayoutEffect(() => {
    const menu = menuRef.current
    if (!menu) return

    const maxX = Math.max(10, window.innerWidth - menu.offsetWidth - 10)
    const maxY = Math.max(10, window.innerHeight - menu.offsetHeight - 10)

    setSafePosition({
      x: Math.min(Math.max(10, position.x), maxX),
      y: Math.min(Math.max(10, position.y), maxY),
    })
  }, [position.x, position.y])

  return (
    <motion.div
      animate={{ opacity: 1, scale: 1 }}
      aria-label={ariaLabel}
      className={`fixed z-[9999] min-w-[220px] rounded-xl border px-1 py-1.5 ${menuSurfaceClass}`}
      exit={{ opacity: 0, scale: 0.95 }}
      initial={{ opacity: 0, scale: 0.95 }}
      onContextMenu={(event) => {
        event.preventDefault()
        event.stopPropagation()
      }}
      onMouseDown={(event) => event.stopPropagation()}
      ref={menuRef}
      role="menu"
      style={{ left: safePosition.x, top: safePosition.y }}
      transition={{ duration: 0.1 }}
    >
      {children}
    </motion.div>
  )
}

export function MacContextSubmenu({
  ariaLabel,
  children,
  side,
}: {
  ariaLabel: string
  children: ReactNode
  side: 'left' | 'right'
}) {
  return (
    <motion.div
      animate={{ opacity: 1, x: 0 }}
      aria-label={ariaLabel}
      className={`absolute top-0 z-10 min-w-[170px] rounded-xl border px-1 py-1 ${menuSurfaceClass} ${
        side === 'right' ? 'left-full ml-1' : 'right-full mr-1'
      }`}
      initial={{ opacity: 0, x: side === 'right' ? -5 : 5 }}
      role="menu"
      transition={{ duration: 0.1 }}
    >
      {children}
    </motion.div>
  )
}

export function MacContextMenuItem({
  checked = false,
  disabled = false,
  icon,
  keepOpen = false,
  label,
  onClick,
  shortcut,
  submenu = false,
}: {
  checked?: boolean
  disabled?: boolean
  icon?: ReactNode
  keepOpen?: boolean
  label: string
  onClick?: () => void
  shortcut?: string
  submenu?: boolean
}) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (keepOpen) event.stopPropagation()
    onClick?.()
  }

  return (
    <button
      aria-checked={checked || undefined}
      aria-disabled={disabled || undefined}
      className="group flex h-8 w-full items-center gap-3 rounded-lg px-3 text-sm text-gray-900 transition-colors hover:bg-[#007aff] hover:text-white focus-visible:bg-[#007aff] focus-visible:text-white focus-visible:outline-none disabled:cursor-default disabled:text-gray-400 disabled:hover:bg-transparent disabled:hover:text-gray-400 dark:text-white/90 dark:disabled:text-white/30 dark:disabled:hover:text-white/30"
      disabled={disabled}
      onClick={handleClick}
      role={checked ? 'menuitemradio' : 'menuitem'}
      type="button"
    >
      {icon && (
        <span className="flex size-4 shrink-0 items-center justify-center text-gray-500 transition-colors group-hover:text-white group-focus-visible:text-white group-disabled:text-gray-300 dark:text-white/60 dark:group-disabled:text-white/25">
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate text-left">{label}</span>
      {checked && (
        <svg
          aria-hidden
          className="size-3.5 shrink-0"
          fill="none"
          viewBox="0 0 16 16"
        >
          <path
            d="m3.5 8 3 3 6-7"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      )}
      {shortcut && !checked && (
        <span className="shrink-0 text-xs text-gray-500 transition-colors group-hover:text-white/80 group-focus-visible:text-white/80 dark:text-white/45">
          {shortcut}
        </span>
      )}
      {submenu && (
        <span className="shrink-0 text-[10px] text-gray-400 transition-colors group-hover:text-white/80 group-focus-visible:text-white/80 dark:text-white/45">
          ▶
        </span>
      )}
    </button>
  )
}

export function MacContextMenuSeparator() {
  return (
    <div aria-hidden className="mx-2 my-1 h-px bg-black/5 dark:bg-white/10" />
  )
}
