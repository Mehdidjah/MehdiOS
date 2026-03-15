import { useState, useEffect, useRef, useCallback } from 'react'
import {
  createDistanceInterpolation,
  DEFAULT_DOCK_CONFIG,
  DockMagnificationConfig,
  BEYOND_DISTANCE_LIMIT,
} from './dock-magnification'

interface SpringState {
  value: number
  velocity: number
}

export function useDockItem(
  mouseX: number | null,
  iconRef: React.RefObject<HTMLElement | null>,
  config: DockMagnificationConfig = DEFAULT_DOCK_CONFIG
) {
  const [distance, setDistance] = useState(BEYOND_DISTANCE_LIMIT)
  const [width, setWidth] = useState(config.baseWidth)
  const springRef = useRef<SpringState>({
    value: config.baseWidth,
    velocity: 0,
  })
  const rafRef = useRef<number | null>(null)
  const animationRef = useRef<number | null>(null)
  const getWidthFromDistance = createDistanceInterpolation(config)

  const animate = useCallback(() => {
    if (iconRef.current && mouseX !== null) {
      const rect = iconRef.current.getBoundingClientRect()
      const imgCenterX = rect.left + rect.width / 2
      const distanceDelta = mouseX - imgCenterX
      setDistance(distanceDelta)
    } else {
      setDistance(BEYOND_DISTANCE_LIMIT)
    }
  }, [mouseX, iconRef])

  useEffect(() => {
    if (mouseX === null) {
      setDistance(BEYOND_DISTANCE_LIMIT)
      return
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [mouseX, animate])

  useEffect(() => {
    const targetWidth = getWidthFromDistance(distance)

    const springAnimate = () => {
      const current = springRef.current.value
      const target = targetWidth
      const diff = target - current
      const springForce = diff * config.springStiffness
      const dampingForce = springRef.current.velocity * config.springDamping
      const acceleration = springForce - dampingForce

      springRef.current.velocity += acceleration
      springRef.current.velocity *= 0.95
      springRef.current.value += springRef.current.velocity

      if (
        Math.abs(diff) < 0.01 &&
        Math.abs(springRef.current.velocity) < 0.01
      ) {
        springRef.current.value = target
        setWidth(target)
        return
      }

      setWidth(springRef.current.value)
      animationRef.current = requestAnimationFrame(springAnimate)
    }

    animationRef.current = requestAnimationFrame(springAnimate)

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [distance, getWidthFromDistance, config])

  return width
}
