import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { typingTexts } from './typing-texts'
import { IconClock } from '@tabler/icons-react'

export function TypingMaster() {
  const [random, setRandom] = useState(() =>
    Math.floor(Math.random() * typingTexts.length)
  )
  const singleLine = useMemo(
    () => typingTexts[random]?.text || '',
    [random]
  )
  const intervalRef = useRef<number>()
  const [typing, setTyping] = useState('')
  const [timer, setTimer] = useState(60)
  const [status, setStatus] = useState<'typing' | 'idle'>('idle')
  const [resultText, setResultText] = useState('')
  const [result, setResult] = useState({ wpm: 0, ws: 0 })
  const [paragraph, setParagraph] = useState(singleLine)

  useEffect(() => {
    if (status === 'idle') {
      if (intervalRef.current !== undefined) {
        clearInterval(intervalRef.current)
        intervalRef.current = undefined
      }
      return
    }

    intervalRef.current = window.setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          if (intervalRef.current !== undefined) {
            clearInterval(intervalRef.current)
            intervalRef.current = undefined
          }

          const fullText = resultText ? `${resultText} ${typing}` : typing
          const resultArr = fullText.trim().split(/\s+/).filter(Boolean)
          const paraArr = paragraph.trim().split(/\s+/).filter(Boolean)

          const newResult = { wpm: 0, ws: 0 }
          const maxLength = Math.min(resultArr.length, paraArr.length)
          
          for (let i = 0; i < maxLength; i++) {
            if (resultArr[i] === paraArr[i]) {
              newResult.wpm++
            } else {
              newResult.ws++
            }
          }

          setResult(newResult)
          setStatus('idle')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current !== undefined) {
        clearInterval(intervalRef.current)
        intervalRef.current = undefined
      }
    }
  }, [status, resultText, typing, paragraph])

  const handleRestart = useCallback(() => {
    const index = Math.floor(Math.random() * typingTexts.length)
    setRandom(index)
    setTyping('')
    setTimer(60)
    setStatus('idle')
    setResultText('')
    setParagraph(typingTexts[index]?.text || '')
    setResult({ wpm: 0, ws: 0 })
  }, [])

  return (
    <div className="max-h-full overflow-y-auto overflow-x-hidden p-2 sm:p-4">
      <div className="flex flex-col items-center gap-4 sm:gap-8">
        <div className="flex w-full flex-col sm:flex-row justify-between gap-4 px-2">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm sm:text-lg font-medium">
            <h2>WPM: {result.wpm}</h2>
            <h2>Missed: {result.ws}</h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 font-medium">
            <button
              onClick={handleRestart}
              className="rounded bg-primary px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white"
              type="button"
            >
              Restart
            </button>
            <h4 className="flex items-center gap-1 rounded bg-white px-2 sm:px-3 py-1 sm:py-1.5 text-sm sm:text-base font-medium dark:bg-black">
              <IconClock className="size-4 sm:size-5" />
              {timer}s
            </h4>
          </div>
        </div>
        <div className="w-full max-w-4xl text-base sm:text-2xl lg:text-3xl font-medium px-2 break-words">
          {singleLine.split('').map((char, i) => {
            if (typing[i]) {
              if (typing[i] === char) {
                return (
                  <span key={i} className="text-green-400">
                    {char}
                  </span>
                )
              } else {
                if (char === ' ') {
                  return (
                    <span key={i} className="bg-red-400">
                      {char}
                    </span>
                  )
                } else {
                  return (
                    <span key={i} className="text-red-400">
                      {char}
                    </span>
                  )
                }
              }
            } else {
              return <span key={i}>{char}</span>
            }
          })}
        </div>
        <input
          disabled={timer === 0}
          value={typing}
          onChange={(e) => {
            if (e.target.value.length === singleLine.length) {
              setResultText((pre) => {
                if (pre) {
                  return pre + ' ' + e.target.value
                } else return e.target.value
              })
              setTyping('')
              const index = Math.floor(Math.random() * typingTexts.length)
              setParagraph((pre) => {
                if (pre) {
                  return pre + ' ' + typingTexts[index].text
                } else {
                  return typingTexts[index].text
                }
              })
              setRandom(index)
            } else {
              setTyping(e.target.value)
              if (status !== 'typing') {
                setStatus('typing')
              }
            }
          }}
          className="w-full max-w-4xl rounded-md bg-light-foreground px-3 sm:px-4 py-3 sm:py-4 text-base sm:text-2xl lg:text-3xl font-medium focus:outline-none dark:bg-dark-foreground mx-2 sm:mx-0"
        />
      </div>
    </div>
  )
}
