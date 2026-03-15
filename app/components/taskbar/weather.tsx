'use client'

import { getCurrentConditions } from '@/app/actions/weather'
import { useEffect, useState } from 'react'
import { weatherCodeMapping } from './weather-text'

export function Weather() {
  const [condition, setCondition] = useState<{
    WeatherText: string
    Temperature: number
  } | null>(null)
  const [isUnavailable, setIsUnavailable] = useState(false)

  useEffect(() => {
    let ignore = false

    if (!navigator.geolocation) {
      setIsUnavailable(true)
      return
    }

    const handleError = () => {
      if (!ignore) {
        setIsUnavailable(true)
      }
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (ignore) return

        try {
          setIsUnavailable(false)
          const res = await getCurrentConditions({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          })

          if (res?.current && !ignore) {
            setCondition({
              WeatherText:
                weatherCodeMapping[res.current.weatherCode] ||
                'Unknown Condition',
              Temperature: res.current.temperature2m,
            })
            return
          }

          if (!ignore) {
            setIsUnavailable(true)
          }
        } catch {
          if (!ignore) {
            setIsUnavailable(true)
          }
        }
      },
      handleError,
      { timeout: 10000, enableHighAccuracy: false }
    )

    return () => {
      ignore = true
    }
  }, [])

  return (
    <div className="font-semibold tabular-nums tracking-[0.01em] text-white/92">
      <span>
        {condition
          ? `${condition.Temperature.toFixed(1)} °C`
          : isUnavailable
            ? '-- °C'
            : 'Loading...'}
      </span>
    </div>
  )
}
