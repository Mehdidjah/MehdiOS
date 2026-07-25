import { clock_utils } from '@/app/utils'
import Image from 'next/image'
import { FormEvent, useEffect, useRef, useState, useCallback } from 'react'
import author from '@/public/assets/images/author.webp'
import gsap from 'gsap'

export function LockScreen({ next }: { next: () => void }) {
  const [clock, setClock] = useState<{ date: string; time: string }>({
    date: clock_utils.getLockScreenDate(),
    time: clock_utils.getCurrentTime(),
  })
  const [password, setPassword] = useState('')
  const bodyRef = useRef<HTMLDivElement>(null)
  const blankRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setClock({
      date: clock_utils.getLockScreenDate(),
      time: clock_utils.getCurrentTime(),
    })

    const intervalId = setInterval(() => {
      setClock({
        date: clock_utils.getLockScreenDate(),
        time: clock_utils.getCurrentTime(),
      })
    }, 1000)

    return () => {
      clearInterval(intervalId)
    }
  }, [])

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()

      if (!bodyRef.current || !blankRef.current) return

      const timeLine = gsap.timeline()
      timeLine.to(bodyRef.current, {
        xPercent: 100,
        duration: 0.5,
        ease: 'expo.in',
      })
      timeLine.to(blankRef.current, {
        xPercent: 100,
        duration: 0.5,
        ease: 'expo.in',
        onComplete: next,
      })
    },
    [next]
  )

  return (
    <>
      <div
        ref={bodyRef}
        className="bg-lock fixed inset-0 z-9999 flex flex-col items-center justify-between gap-5 bg-black bg-cover bg-center bg-no-repeat py-20"
      >
        <div>
          <p className="text-center text-2xl font-medium text-[#ffffb5]">
            {clock.date}
          </p>
          <p className="text-7xl font-medium text-[#ffffb5]">{clock.time}</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Image
            alt=""
            src={author}
            width={40}
            height={40}
            className="rounded-full"
          />
          <form className="relative mt-1 w-48" onSubmit={handleSubmit}>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
              style={{
                backdropFilter: 'blur(10px) saturate(1.01)',
                background: 'rgba(0, 0, 0, 0.1)',
                boxShadow:
                  'inset 0 1.5px 0 rgba(255, 255, 255, 0.15), inset 0 8px 16px -4px rgba(255, 255, 255, 0.08), inset 0 0 0 1.5px rgba(128, 128, 128, 0.22), 0 18px 44px -12px rgba(0, 0, 0, 0.45)',
                WebkitBackdropFilter: 'blur(10px) saturate(1.01)',
              }}
            >
              <span
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0) 50%)',
                }}
              />
            </div>
            <input
              autoComplete="off"
              className="relative z-10 h-8 w-full bg-transparent px-4 pr-8 text-[13px] text-white transition-all outline-none placeholder:text-white/60"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter Password"
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
              }}
              type="password"
              value={password}
            />
            <input type="submit" hidden />
          </form>
          <p className="text-xs text-white/45">Touch ID or Enter Password</p>
        </div>
      </div>
      <div
        ref={blankRef}
        className="bg-dark-background fixed inset-0 z-9998 flex flex-col items-center justify-center gap-5"
      ></div>
    </>
  )
}
