export interface DockMagnificationConfig {
  baseWidth: number
  distanceLimit: number
  springDamping: number
  springStiffness: number
}

export const DEFAULT_DOCK_CONFIG: DockMagnificationConfig = {
  baseWidth: 57.6,
  distanceLimit: 345.6,
  springDamping: 0.47,
  springStiffness: 0.12,
}

export const BEYOND_DISTANCE_LIMIT = 10000

export function createDistanceInterpolation(config: DockMagnificationConfig) {
  const { baseWidth, distanceLimit } = config

  const distanceInput = [
    -distanceLimit,
    -distanceLimit / 1.25,
    -distanceLimit / 2,
    0,
    distanceLimit / 2,
    distanceLimit / 1.25,
    distanceLimit,
  ]

  const widthOutput = [
    baseWidth,
    baseWidth * 1.1,
    baseWidth * 1.414,
    baseWidth * 2,
    baseWidth * 1.414,
    baseWidth * 1.1,
    baseWidth,
  ]

  return (distance: number): number => {
    if (distance <= -distanceLimit) return widthOutput[0]
    if (distance >= distanceLimit) return widthOutput[6]

    for (let i = 0; i < distanceInput.length - 1; i++) {
      const x0 = distanceInput[i]
      const x1 = distanceInput[i + 1]
      const y0 = widthOutput[i]
      const y1 = widthOutput[i + 1]

      if (distance >= x0 && distance <= x1) {
        const t = (distance - x0) / (x1 - x0)
        return y0 + (y1 - y0) * t
      }
    }

    return baseWidth
  }
}

export function isDesktopDevice(): boolean {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(min-width: 768px) and (pointer: fine)').matches
}
