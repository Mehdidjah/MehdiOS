import { useCallback, useState } from 'react'

interface UseCopyReturn {
  copy: (text: string) => Promise<boolean>
  isCopied: boolean
  error: Error | null
}

/**
 * Custom hook for copying text to clipboard with feedback
 * @returns Object with copy function, isCopied state, and error state
 */
export function useCopy(): UseCopyReturn {
  const [isCopied, setIsCopied] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const copy = useCallback(async (text: string): Promise<boolean> => {
    if (!text || typeof text !== 'string') {
      const err = new Error('Invalid text provided')
      setError(err)
      return false
    }

    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.opacity = '0'
        document.body.appendChild(textArea)
        textArea.select()
        
        const success = document.execCommand('copy')
        document.body.removeChild(textArea)
        
        if (success) {
          setIsCopied(true)
          setError(null)
          setTimeout(() => setIsCopied(false), 2000)
          return true
        } else {
          throw new Error('Failed to copy using fallback method')
        }
      }

      await navigator.clipboard.writeText(text)
      setIsCopied(true)
      setError(null)
      setTimeout(() => setIsCopied(false), 2000)
      return true
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to copy text')
      setError(error)
      setIsCopied(false)
      return false
    }
  }, [])

  return { copy, isCopied, error }
}
