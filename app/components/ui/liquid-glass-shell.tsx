'use client'

import dynamic from 'next/dynamic'
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

const LiquidGlass = dynamic(() => import('liquid-glass-react'), { ssr: false })

interface LiquidGlassShellProps {
  children: ReactNode
  className?: string
  contentClassName?: string
  style?: CSSProperties
  contentStyle?: CSSProperties
  hideOutline?: boolean
  displacementScale?: number
  blurAmount?: number
  saturation?: number
  aberrationIntensity?: number
  elasticity?: number
  cornerRadius?: number
  padding?: string
  overLight?: boolean
  mode?: 'standard' | 'polar' | 'prominent' | 'shader'
}

export function LiquidGlassShell({
  children,
  className,
  contentClassName,
  style,
  contentStyle,
  hideOutline = false,
  displacementScale = 36,
  blurAmount = 0.16,
  saturation = 150,
  aberrationIntensity = 1.4,
  elasticity = 0,
  cornerRadius = 24,
  padding = '0px',
  overLight = false,
  mode = 'prominent',
}: LiquidGlassShellProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const element = contentRef.current

    if (!element) return

    const updateSize = () => {
      const rect = element.getBoundingClientRect()
      setSize({ width: rect.width, height: rect.height })
    }

    updateSize()

    const observer = new ResizeObserver(updateSize)
    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [])

  useLayoutEffect(() => {
    if (!size.width || !size.height || typeof window === 'undefined') return

    // liquid-glass-react updates its border/highlight shell on window resize.
    // Dispatching here, after our size state has committed but before paint,
    // keeps those layers in lockstep with the dock's live magnification width.
    window.dispatchEvent(new Event('resize'))
  }, [size.height, size.width])

  return (
    <div className={`relative ${className || ''}`} style={style}>
      {size.width > 0 && size.height > 0 && (
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 z-0${hideOutline ? ' liquid-glass-hide-outline' : ''}`}
        >
          <LiquidGlass
            displacementScale={displacementScale}
            blurAmount={blurAmount}
            saturation={saturation}
            aberrationIntensity={aberrationIntensity}
            elasticity={elasticity}
            cornerRadius={cornerRadius}
            padding={padding}
            overLight={overLight}
            mode={mode}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
            }}
          >
            <div style={{ width: size.width, height: size.height }} />
          </LiquidGlass>
        </div>
      )}
      <div
        ref={contentRef}
        className={contentClassName}
        style={contentStyle}
      >
        {children}
      </div>
    </div>
  )
}
