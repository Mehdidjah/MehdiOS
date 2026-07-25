'use client'

import { IconBracketsAngle, IconMinus, IconX } from '@tabler/icons-react'
import type { MouseEvent } from 'react'

type MacTrafficLightsProps = {
  appName: string
  isFullscreen?: boolean
  onClose: () => void
  onMinimize: () => void
  onZoom: () => void
  className?: string
}

export function MacTrafficLights({
  appName,
  isFullscreen = false,
  onClose,
  onMinimize,
  onZoom,
  className = '',
}: MacTrafficLightsProps) {
  const runAction =
    (action: () => void) => (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation()
      action()
    }

  return (
    <div
      aria-label={`${appName} window controls`}
      className={`group flex shrink-0 items-center gap-2 ${className}`}
      role="group"
    >
      <button
        aria-label={`Close ${appName}`}
        className="relative flex size-5 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#007aff]"
        onClick={runAction(onClose)}
        onDoubleClick={(event) => event.stopPropagation()}
        title={`Close ${appName}`}
        type="button"
      >
        <span className="size-3 rounded-full bg-[#ff5f57] ring-1 ring-black/10" />
        <IconX
          aria-hidden
          className="absolute size-2.5 text-[#4b0000] opacity-0 transition-opacity group-focus-within:opacity-75 group-hover:opacity-75"
          stroke={2.4}
        />
      </button>

      <button
        aria-label={`Minimize ${appName}`}
        className="relative flex size-5 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#007aff]"
        onClick={runAction(onMinimize)}
        onDoubleClick={(event) => event.stopPropagation()}
        title={`Minimize ${appName}`}
        type="button"
      >
        <span className="size-3 rounded-full bg-[#febc2e] ring-1 ring-black/10" />
        <IconMinus
          aria-hidden
          className="absolute size-2.5 text-[#613c00] opacity-0 transition-opacity group-focus-within:opacity-80 group-hover:opacity-80"
          stroke={2.4}
        />
      </button>

      <button
        aria-label={`${isFullscreen ? 'Restore' : 'Maximize'} ${appName}`}
        className="relative flex size-5 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#007aff]"
        onClick={runAction(onZoom)}
        onDoubleClick={(event) => event.stopPropagation()}
        title={`${isFullscreen ? 'Restore' : 'Maximize'} ${appName}`}
        type="button"
      >
        <span className="size-3 rounded-full bg-[#28c840] ring-1 ring-black/10" />
        <IconBracketsAngle
          aria-hidden
          className="absolute size-2.5 -rotate-45 text-[#004c12] opacity-0 transition-opacity group-focus-within:opacity-75 group-hover:opacity-75"
          stroke={2.2}
        />
      </button>
    </div>
  )
}
