'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { useDockItem } from './use-dock-item'
import { DEFAULT_DOCK_CONFIG } from './dock-magnification'

interface DockItemProps {
  mouseX: number | null
  iconSrc: string | null
  name: string
  onClick?: () => void
  showIndicator?: boolean
  customClassName?: string
  href?: string
  isLink?: boolean
  children?: React.ReactNode
}

export function DockItem({
  mouseX,
  iconSrc,
  name,
  onClick,
  showIndicator,
  customClassName,
  href,
  isLink,
  children,
}: DockItemProps) {
  const iconRef = useRef<HTMLButtonElement | HTMLAnchorElement>(null)
  const width = useDockItem(mouseX, iconRef, DEFAULT_DOCK_CONFIG)
  const widthRem = width / 16
  const tooltipClassName =
    'mac-tahoe-dock-tooltip absolute -top-10 left-1/2 hidden -translate-x-1/2 rounded-full px-3 py-1 text-xs font-medium text-white group-hover:inline-block'

  if (isLink && href) {
    return (
      <a
        ref={iconRef as React.RefObject<HTMLAnchorElement>}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mac-tahoe-dock-button group relative flex flex-col items-center justify-end rounded-[20px]"
        style={{
          width: `${widthRem}rem`,
          height: `${widthRem}rem`,
          minWidth: `${widthRem}rem`,
          maxWidth: `${widthRem}rem`,
          flexShrink: 0,
        }}
      >
        <span className="relative z-10 flex size-full items-center justify-center">
          {children}
        </span>
        <span className={tooltipClassName}>
          {name}
        </span>
      </a>
    )
  }

  if (!iconSrc) return null

  return (
    <button
      ref={iconRef as React.RefObject<HTMLButtonElement>}
      className="mac-tahoe-dock-button group relative flex flex-col items-center justify-end rounded-[20px]"
      onClick={onClick}
      type="button"
      style={{
        width: `${widthRem}rem`,
        height: `${widthRem}rem`,
        minWidth: `${widthRem}rem`,
        maxWidth: `${widthRem}rem`,
        flexShrink: 0,
      }}
    >
      <span className="relative z-10 flex size-full items-center justify-center">
        <Image
          alt={name}
          src={iconSrc}
          fill
          sizes="57.6px"
          className={`${customClassName || 'object-cover object-center'} relative z-10`}
          style={{ willChange: 'width' }}
          draggable={false}
        />
      </span>
      <span className={tooltipClassName}>
        {name}
      </span>
      {showIndicator && (
        <span className="absolute bottom-[3px] left-1/2 z-10 size-[5px] -translate-x-1/2 rounded-full bg-white/90"></span>
      )}
    </button>
  )
}
