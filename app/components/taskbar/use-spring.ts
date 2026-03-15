import { useState, useEffect, useRef } from 'react'

interface SpringConfig {
  damping: number
  stiffness: number
}

const DEFAULT_SPRING_CONFIG: SpringConfig = {
  damping: 0.47,
  stiffness: 0.12,
}

export function useSpring(
  target: number,
  config: SpringConfig = DEFAULT_SPRING_CONFIG
): number {
  const [value, setValue] = useState(target)
  const velocityRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const animate = () => {
      const diff = target - value
      const springForce = diff * config.stiffness
      const dampingForce = velocityRef.current * config.damping
      const acceleration = springForce - dampingForce

      velocityRef.current += acceleration
      velocityRef.current *= 0.95

      const newValue = value + velocityRef.current

      if (Math.abs(diff) < 0.01 && Math.abs(velocityRef.current) < 0.01) {
        setValue(target)
        return
      }

      setValue(newValue)
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [target, value, config])

  return value
}
