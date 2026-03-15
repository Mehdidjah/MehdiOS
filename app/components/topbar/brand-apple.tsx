import { FaApple } from 'react-icons/fa'
import { brandApple } from './menu-data'
import { Fragment, useRef, useState } from 'react'
import { useClickOutside } from '@/app/hooks/use-click-outside'
import { LiquidGlassShell } from '../ui/liquid-glass-shell'

const panelButtonClassName =
  'mac-tahoe-panel-button flex h-[22px] items-center rounded-full px-2.5 text-white/90'

export function BrandApple() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useClickOutside(() => {
    setIsOpen(false)
  }, menuRef)

  return (
    <div ref={menuRef} className="relative flex h-full items-center">
      <button
        className={panelButtonClassName}
        data-state={isOpen ? 'active' : undefined}
        onClick={() => setIsOpen((previous) => !previous)}
        type="button"
      >
        <FaApple className="text-[1rem]" />
      </button>
      {isOpen && (
        <LiquidGlassShell
          className="absolute left-0 top-[calc(100%+0.35rem)] z-[1000]"
          contentClassName="mac-tahoe-menu-overlay w-56 overflow-hidden rounded-2xl p-2 text-white"
          displacementScale={42}
          blurAmount={0.2}
          saturation={155}
          aberrationIntensity={1.5}
          elasticity={0}
          cornerRadius={18}
          overLight
          mode="prominent"
        >
          {brandApple.map((item) => {
            if (item.divider) {
              return (
                <Fragment key={item.id}>
                  <button
                    className="mac-tahoe-menu-item block w-full rounded-xl px-3 py-2 text-start text-sm font-medium text-white/92"
                    key={item.id}
                    type="button"
                  >
                    {item.label}
                  </button>
                  <div className="px-4">
                    <span className="my-1 block h-px w-full bg-[var(--mac-tahoe-menu-separator)]" />
                  </div>
                </Fragment>
              )
            } else {
              return (
                <button
                  className="mac-tahoe-menu-item block w-full rounded-xl px-3 py-2 text-start text-sm font-medium text-white/92"
                  key={item.id}
                  type="button"
                >
                  {item.label}
                </button>
              )
            }
          })}
        </LiquidGlassShell>
      )}
    </div>
  )
}
