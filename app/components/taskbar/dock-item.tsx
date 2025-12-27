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

  if (isLink && href) {
    return (
      <a
        ref={iconRef as React.RefObject<HTMLAnchorElement>}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex flex-col items-center justify-end rounded-lg"
        style={{
          width: `${widthRem}rem`,
          height: `${widthRem}rem`,
          minWidth: `${widthRem}rem`,
          maxWidth: `${widthRem}rem`,
          flexShrink: 0,
        }}
      >
        <span className="relative flex size-full items-center justify-center">
          {children}
        </span>
        <span className="absolute -top-9 left-1/2 hidden -translate-x-1/2 rounded bg-[#3e3e3e] px-3 py-1 text-xs shadow-md group-hover:inline-block">
          {name}
        </span>
      </a>
    )
  }

  if (!iconSrc) return null

  return (
    <button
      ref={iconRef as React.RefObject<HTMLButtonElement>}
      className="group relative flex flex-col items-center justify-end rounded-lg"
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
      <span className="relative flex size-full items-center justify-center">
        <Image
          alt={name}
          src={iconSrc}   
          fill
          sizes="57.6px"
          className={customClassName || 'object-cover object-center'}
          style={{ willChange: 'width' }}
          draggable={false}
        />
      </span>
      <span className="absolute -top-8 left-1/2 hidden -translate-x-1/2 rounded bg-[#3e3e3e] px-3 py-1 text-xs shadow-md group-hover:inline-block">
        {name}
      </span>
      {showIndicator && (
        <span className="absolute -bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-black dark:bg-white"></span>
      )}
    </button>
  )
}