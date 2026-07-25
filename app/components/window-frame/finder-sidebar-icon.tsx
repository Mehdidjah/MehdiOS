import type { ReactNode } from 'react'

export type FinderSidebarIconName =
  | 'airdrop'
  | 'recents'
  | 'applications'
  | 'desktop'
  | 'documents'
  | 'downloads'
  | 'macos'
  | 'network'

const icons: Record<FinderSidebarIconName, ReactNode> = {
  airdrop: (
    <>
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <path d="M12 7a5 5 0 0 1 5 5M7 12a5 5 0 0 1 5-5" />
      <path d="M12 3a9 9 0 0 1 9 9M3 12A9 9 0 0 1 12 3" />
    </>
  ),
  recents: (
    <>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 6 12 12 16 14" />
    </>
  ),
  applications: (
    <>
      <rect height="6" rx="1.5" width="6" x="3" y="3" />
      <rect height="6" rx="1.5" width="6" x="15" y="3" />
      <rect height="6" rx="1.5" width="6" x="15" y="15" />
      <rect height="6" rx="1.5" width="6" x="3" y="15" />
    </>
  ),
  desktop: (
    <>
      <rect height="11" rx="1.5" width="20" x="2" y="4" />
      <path d="M12 15v4M9 19h6" />
    </>
  ),
  documents: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </>
  ),
  downloads: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </>
  ),
  macos: (
    <>
      <rect height="12" rx="2" width="18" x="3" y="6" />
      <line x1="3" x2="21" y1="13" y2="13" />
      <circle cx="18" cy="9.5" fill="currentColor" r="0.8" />
    </>
  ),
  network: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" x2="22" y1="12" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </>
  ),
}

export function FinderSidebarIcon({
  className = '',
  name,
}: {
  className?: string
  name: FinderSidebarIconName
}) {
  return (
    <span
      aria-hidden
      className={`flex size-4 shrink-0 items-center justify-center ${className}`}
    >
      <svg
        className="size-full"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
      >
        {icons[name]}
      </svg>
    </span>
  )
}
