import gsap from 'gsap'
import { useEffect, useRef, useCallback } from 'react'

export type Place = 't' | 'b' | 'l' | 'r' | 'tl' | 'tr' | 'bl' | 'br'
export type Frame = { current: HTMLDivElement | null }
export type Size = {
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
}

interface UseResizeParams {
  place: Place
  frame: Frame
  size: Size
  onDragEnable?: () => void
  onDragDisable?: () => void
}

const isValidSize = (
  newSize: number,
  currentSize: number,
  min: number,
  max?: number
): boolean => {
  const meetsMin = newSize >= min || (min > currentSize && newSize > currentSize)
  const meetsMax = max
    ? newSize <= max || (currentSize > max && newSize < currentSize)
    : true
  return meetsMin && meetsMax && newSize > 0
}

export const useResize = ({
  place,
  frame,
  size: { minW = 300, minH = 250, maxW, maxH },
  onDragEnable,
  onDragDisable,
}: UseResizeParams) => {
  const triggerPanel = useRef<HTMLDivElement>(null)
  const timeline = useRef(gsap.timeline({ defaults: { duration: 0 } }))

  const applyResize = useCallback(
    (updates: Partial<gsap.TweenVars>) => {
      if (frame.current) {
        timeline.current.to(frame.current, updates)
      }
    },
    [frame]
  )

  useEffect(() => {
    const panel = triggerPanel.current
    if (!panel) return

    const onResize = (e: MouseEvent) => {
      if (!(frame.current instanceof HTMLDivElement)) return

      const rect = frame.current.getBoundingClientRect()
      const updates: Partial<gsap.TweenVars> = {}

      if (place === 'l') {
        const newWidth = rect.right - e.clientX
        if (isValidSize(newWidth, rect.width, minW, maxW)) {
          updates.width = newWidth
          updates.left = e.clientX
        }
      } else if (place === 'r') {
        const newWidth = e.clientX - rect.left
        if (isValidSize(newWidth, rect.width, minW, maxW)) {
          updates.width = newWidth
        }
      } else if (place === 'b') {
        const newHeight = e.clientY - rect.top
        if (isValidSize(newHeight, rect.height, minH, maxH)) {
          updates.height = newHeight
        }
      } else if (place === 't') {
        const newHeight = rect.bottom - e.clientY
        if (isValidSize(newHeight, rect.height, minH, maxH)) {
          updates.height = newHeight
          updates.top = e.clientY
        }
      } else if (place === 'tl') {
        const newHeight = rect.bottom - e.clientY
        const newWidth = rect.right - e.clientX
        if (isValidSize(newHeight, rect.height, minH, maxH)) {
          updates.height = newHeight
          updates.top = e.clientY
        }
        if (isValidSize(newWidth, rect.width, minW, maxW)) {
          updates.width = newWidth
          updates.left = e.clientX
        }
      } else if (place === 'tr') {
        const newHeight = rect.bottom - e.clientY
        const newWidth = e.clientX - rect.left
        if (isValidSize(newHeight, rect.height, minH, maxH)) {
          updates.height = newHeight
          updates.top = e.clientY
        }
        if (isValidSize(newWidth, rect.width, minW, maxW)) {
          updates.width = newWidth
        }
      } else if (place === 'bl') {
        const newWidth = rect.right - e.clientX
        const newHeight = e.clientY - rect.top
        if (isValidSize(newHeight, rect.height, minH, maxH)) {
          updates.height = newHeight
        }
        if (isValidSize(newWidth, rect.width, minW, maxW)) {
          updates.width = newWidth
          updates.left = e.clientX
        }
      } else if (place === 'br') {
        const newWidth = e.clientX - rect.left
        const newHeight = e.clientY - rect.top
        if (isValidSize(newHeight, rect.height, minH, maxH)) {
          updates.height = newHeight
        }
        if (isValidSize(newWidth, rect.width, minW, maxW)) {
          updates.width = newWidth
        }
      }

      if (Object.keys(updates).length > 0) {
        applyResize(updates)
      }
    }

    const onClear = () => {
      onDragEnable?.()
      window.removeEventListener('mousemove', onResize)
      window.removeEventListener('mouseup', onClear)
    }

    const onWatch = () => {
      onDragDisable?.()
      window.addEventListener('mousemove', onResize)
      window.addEventListener('mouseup', onClear)
    }

    panel.addEventListener('mousedown', onWatch)

    return () => {
      panel.removeEventListener('mousedown', onWatch)
      window.removeEventListener('mousemove', onResize)
      window.removeEventListener('mouseup', onClear)
    }
  }, [
    frame,
    place,
    maxW,
    minW,
    maxH,
    minH,
    onDragEnable,
    onDragDisable,
    applyResize,
  ])

  return triggerPanel
}
