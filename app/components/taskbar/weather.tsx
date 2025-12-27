'use client'

import { getCurrentConditions } from '@/app/actions/weather'
import { useEffect, useState } from 'react'
import { weatherCodeMapping } from './weather-text'

export function Weather() {
  const [condition, setCondition] = useState<{
    WeatherText: string
    Temperature: number
  }>()

  useEffect(() => {
    let ignore = false

    if (!navigator.geolocation) {
      return
    }

    const handleError = (error: GeolocationPositionError) => {
      if (!ignore) {
        console.error('Geolocation error:', error)
        setCondition({
          WeatherText: 'Location unavailable',
          Temperature: 0,
        })
      }
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (ignore) return

        try {
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
          }
        } catch (error) {
          if (!ignore) {
            console.error('Weather fetch error:', error)
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
    <div className="space-x-2 p-1 pr-0 font-medium">
      <span>
        {condition
          ? `${condition.Temperature.toFixed(1)} °C`
          : 'Loading...'}
      </span>
    </div>
  )
}
