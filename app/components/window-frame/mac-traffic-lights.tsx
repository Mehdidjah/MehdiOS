'use client'

import type { MouseEvent, ReactNode } from 'react'

type MacTrafficLightsProps = {
  appName: string
  isActive?: boolean
  isFullscreen?: boolean
  onClose: () => void
  onMinimize: () => void
  onZoom?: () => void
  className?: string
  zoomAccessory?: ReactNode
}

const controlButtonClass =
  'cursor-custom-pointer! relative flex size-3 shrink-0 items-center justify-center rounded-full shadow-sm transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007aff]'

const controlIconClass =
  'pointer-events-none size-1.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100'

export function MacTrafficLights({
  appName,
  isActive = true,
  isFullscreen = false,
  onClose,
  onMinimize,
  onZoom,
  className = '',
  zoomAccessory,
}: MacTrafficLightsProps) {
  const runAction =
    (action?: () => void) => (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation()
      action?.()
    }

  return (
    <div
      aria-label={`${appName} window controls`}
      className={`group flex shrink-0 items-center gap-2 ${className}`}
      data-window-active={isActive}
      role="group"
    >
      <button
        aria-label={`Close ${appName}`}
        className={`${controlButtonClass} bg-[#ff5f57] hover:bg-[#ff4136]`}
        onClick={runAction(onClose)}
        onDoubleClick={(event) => event.stopPropagation()}
        title={`Close ${appName}`}
        type="button"
      >
        <svg
          aria-hidden
          className={`${controlIconClass} text-[#820005]`}
          viewBox="0 0 10 10"
        >
          <path
            d="M1 1L9 9M9 1L1 9"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
          />
        </svg>
      </button>

      <button
        aria-label={`Minimize ${appName}`}
        className={`${controlButtonClass} bg-[#febc2e] hover:bg-[#ff9500]`}
        onClick={runAction(onMinimize)}
        onDoubleClick={(event) => event.stopPropagation()}
        title={`Minimize ${appName}`}
        type="button"
      >
        <svg
          aria-hidden
          className={`${controlIconClass} text-[#9a6400]`}
          viewBox="0 0 10 10"
        >
          <path
            d="M1 5H9"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
          />
        </svg>
      </button>

      <div className="group/fullscreen relative flex size-3 shrink-0">
        <button
          aria-disabled={!onZoom || undefined}
          aria-label={`${isFullscreen ? 'Restore' : 'Maximize'} ${appName}`}
          className={`${controlButtonClass} bg-[#28c840] hover:bg-[#1aab29]`}
          onClick={runAction(onZoom)}
          onDoubleClick={(event) => event.stopPropagation()}
          title={`${isFullscreen ? 'Restore' : 'Maximize'} ${appName}`}
          type="button"
        >
          <svg
            aria-hidden
            className={`${controlIconClass} text-[#006500]`}
            viewBox="0 0 10 10"
          >
            <path
              d="M1 1L4 4M1 1V3.5M1 1H3.5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.2"
            />
            <path
              d="M9 9L6 6M9 9V6.5M9 9H6.5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.2"
            />
          </svg>
        </button>
        {zoomAccessory}
      </div>
    </div>
  )
}
