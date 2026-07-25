'use client'

import { useClickOutside } from '@/app/hooks/use-click-outside'
import { newIconSrc } from '@/app/utils/icon-paths'
import acrobat from '@/public/assets/icons/Acrobat.png'
import Image from 'next/image'
import { MouseEvent, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { TrashContextMenu } from '../context-menu/trash-menu'
import { Folder } from '../folder/folders'
import typingMaterIcon from '@/public/assets/icons/typing-master.png'

export function TrashFolder({ item }: { item: Folder }) {
  const folderRef = useRef<HTMLButtonElement>(null)
  const [ctxPosition, setCtxPosition] = useState<{
    x: number
    y: number
  } | null>(null)

  const [isSelected, setIsSelected] = useState(false)

  const handleContextMenu = (
    event: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>
  ) => {
    event.preventDefault()
    event.stopPropagation()
    setCtxPosition({ x: event.clientX, y: event.clientY })
  }

  useEffect(() => {
    const onCloseCtx = (event: globalThis.MouseEvent) => {
      if (
        folderRef.current &&
        !folderRef.current.contains(event.target as Node)
      ) {
        setCtxPosition(null)
      }
    }
    const onReset = () => void setCtxPosition(null)

    document.addEventListener('contextmenu', onCloseCtx)
    document.addEventListener('click', onReset)
    document.addEventListener('dblclick', onReset)
    return () => {
      document.removeEventListener('contextmenu', onCloseCtx)
      document.removeEventListener('click', onReset)
      document.removeEventListener('dblclick', onReset)
    }
  }, [])

  useClickOutside(() => {
    if (isSelected) {
      setIsSelected(false)
    }
  }, folderRef)

  return (
    <>
      <button
        onClick={() => {
          setIsSelected(true)
        }}
        onContextMenu={handleContextMenu}
        ref={folderRef}
        className={`flex size-16 flex-col items-center ${ctxPosition || isSelected ? 'border-[#18779fe0] bg-[#18779f63]' : 'border-transparent'}`}
        type="button"
      >
        {item.type === 'folder' && item.id === 'typing-master' ? (
          <Image
            alt=""
            src={typingMaterIcon}
            width={45}
            height={45}
            className="object-cover object-center p-1"
          />
        ) : item.type === 'pdf' ? (
          <Image
            alt="pdf"
            src={acrobat}
            width={45}
            height={45}
            className="object-cover object-center p-1"
          />
        ) : (
          <Image
            alt=""
            src={newIconSrc.folder}
            width={40}
            height={40}
            className="object-contain object-center"
          />
        )}
        <h2 className="line-clamp-1 text-xs">{item.name}</h2>
      </button>
      {ctxPosition &&
        createPortal(
          <TrashContextMenu item={item} position={ctxPosition} />,
          document.getElementById('context-menu')!
        )}
    </>
  )
}
