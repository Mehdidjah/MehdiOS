import { useRef, useCallback } from 'react'

/**
 * Custom hook for debouncing function calls
 * @param func - The function to debounce
 * @param delay - Delay in milliseconds (not seconds)
 * @returns Debounced function
 */
export function useDebounce<T extends (...args: unknown[]) => void>(
  func: T,
  delay: number
): T {
  const timeoutId = useRef<ReturnType<typeof setTimeout> | null>(null)

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current)
      }
      timeoutId.current = setTimeout(() => {
        func(...args)
      }, delay)
    }) as T,
    [func, delay]
  )
}
