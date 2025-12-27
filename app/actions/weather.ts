'use server'

import { fetchWeatherApi } from 'openmeteo'

interface LatLon {
  lat: number
  lon: number
}

interface WeatherData {
  current: {
    time: Date
    temperature2m: number
    relativeHumidity2m: number
    apparentTemperature: number
    isDay: number
    precipitation: number
    rain: number
    snowfall: number
    weatherCode: number
    pressureMsl: number
    surfacePressure: number
    windSpeed10m: number
    windDirection10m: number
  }
}

export async function getCurrentConditions({
  lat,
  lon,
}: LatLon): Promise<WeatherData | null> {
  try {
    const params = {
      latitude: lat,
      longitude: lon,
      current: [
        'temperature_2m',
        'relative_humidity_2m',
        'apparent_temperature',
        'is_day',
        'precipitation',
        'rain',
        'snowfall',
        'weather_code',
        'pressure_msl',
        'surface_pressure',
        'wind_speed_10m',
        'wind_direction_10m',
      ],
    }

    const url = 'https://api.open-meteo.com/v1/forecast'
    const responses = await fetchWeatherApi(url, params)
    const response = responses[0]
    const utcOffsetSeconds = response.utcOffsetSeconds()
    const current = response.current()

    if (!current) return null

    return {
      current: {
        time: new Date((Number(current.time()) + utcOffsetSeconds) * 1000),
        temperature2m: current.variables(0)?.value() ?? 0,
        relativeHumidity2m: current.variables(1)?.value() ?? 0,
        apparentTemperature: current.variables(2)?.value() ?? 0,
        isDay: current.variables(3)?.value() ?? 0,
        precipitation: current.variables(4)?.value() ?? 0,
        rain: current.variables(5)?.value() ?? 0,
        snowfall: current.variables(6)?.value() ?? 0,
        weatherCode: current.variables(7)?.value() ?? 0,
        pressureMsl: current.variables(8)?.value() ?? 0,
        surfacePressure: current.variables(9)?.value() ?? 0,
        windSpeed10m: current.variables(10)?.value() ?? 0,
        windDirection10m: current.variables(11)?.value() ?? 0,
      },
    }
  } catch {
    return null
  }
}
