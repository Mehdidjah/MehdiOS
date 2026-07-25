type ReferenceMenuIconName =
  | 'cleanup'
  | 'file'
  | 'folder'
  | 'fullscreen'
  | 'info'
  | 'refresh'
  | 'sort'
  | 'view'
  | 'wallpaper'
  | 'widgets'

export function ReferenceMenuIcon({ name }: { name: ReferenceMenuIconName }) {
  if (name === 'sort') {
    return (
      <svg
        aria-hidden
        className="size-4"
        fill="currentColor"
        viewBox="0 0 16 16"
      >
        <path d="M3.5 2.5a.5.5 0 0 0-1 0v8.793l-1.146-1.147a.5.5 0 0 0-.708.708l2 1.999.007.007a.497.497 0 0 0 .7-.006l2-2a.5.5 0 0 0-.707-.708L3.5 11.293zm3.5 1a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5M7.5 6a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1zm0 3a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1zm0 3a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1z" />
      </svg>
    )
  }

  if (name === 'cleanup') {
    return (
      <svg
        aria-hidden
        className="size-4"
        fill="currentColor"
        viewBox="0 0 16 16"
      >
        <path d="M0 1.5A1.5 1.5 0 0 1 1.5 0h13A1.5 1.5 0 0 1 16 1.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 14.5zM1.5 1a.5.5 0 0 0-.5.5V5h4V1zM5 6H1v4h4zm1 4h4V6H6zm-1 1H1v3.5a.5.5 0 0 0 .5.5H5zm1 0v4h4v-4zm5 0v4h3.5a.5.5 0 0 0 .5-.5V11zm0-1h4V6h-4zm0-5h4V1.5a.5.5 0 0 0-.5-.5H11zm-1 0V1H6v4z" />
      </svg>
    )
  }

  const commonProps = {
    'aria-hidden': true,
    className: 'size-4',
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 2,
    viewBox: '0 0 24 24',
  }

  if (name === 'folder') {
    return (
      <svg {...commonProps}>
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    )
  }

  if (name === 'file') {
    return (
      <svg {...commonProps}>
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <polyline points="13 2 13 9 20 9" />
      </svg>
    )
  }

  if (name === 'info') {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" x2="12" y1="16" y2="12" />
        <line x1="12" x2="12.01" y1="8" y2="8" />
      </svg>
    )
  }

  if (name === 'wallpaper') {
    return (
      <svg {...commonProps}>
        <rect height="18" rx="2" ry="2" width="18" x="3" y="3" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    )
  }

  if (name === 'widgets' || name === 'view') {
    return (
      <svg {...commonProps}>
        <rect height="18" rx="2" ry="2" width="18" x="3" y="3" />
        <line x1="3" x2="21" y1="9" y2="9" />
        <line x1="9" x2="9" y1="21" y2="9" />
      </svg>
    )
  }

  if (name === 'fullscreen') {
    return (
      <svg {...commonProps}>
        <polyline points="8 3 3 3 3 8" />
        <line x1="3" x2="9" y1="3" y2="9" />
        <polyline points="16 3 21 3 21 8" />
        <line x1="21" x2="15" y1="3" y2="9" />
        <polyline points="8 21 3 21 3 16" />
        <line x1="3" x2="9" y1="21" y2="15" />
        <polyline points="16 21 21 21 21 16" />
        <line x1="21" x2="15" y1="21" y2="15" />
      </svg>
    )
  }

  return (
    <svg {...commonProps}>
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  )
}
