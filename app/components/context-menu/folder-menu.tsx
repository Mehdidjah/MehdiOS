'use client'

import { copyFolder } from '@/app/features/window-slice'
import { useDispatch } from '@/app/store'
import {
  IconCopy,
  IconFolderOpen,
  IconInfoCircle,
  IconLayoutGrid,
  IconPencil,
  IconShare,
  IconSparkles,
  IconTrash,
} from '@tabler/icons-react'
import {
  MacContextMenu,
  MacContextMenuItem,
  MacContextMenuSeparator,
} from './menu-parts'

export function FolderCtxMenu({
  position,
  id,
  name,
  type,
  onDelete,
  onRename,
  onOpenFolder,
}: {
  id: string
  name: string
  type: 'folder' | 'pdf' | 'browser' | 'calculator'
  position: { x: number; y: number }
  onDelete: () => void
  onRename: () => void
  onOpenFolder: () => void
}) {
  const dispatch = useDispatch()
  const iconProps = { className: 'size-4', stroke: 1.8 }

  return (
    <MacContextMenu ariaLabel={`${name} context menu`} position={position}>
      <MacContextMenuItem
        icon={<IconFolderOpen aria-hidden {...iconProps} />}
        label="Open"
        onClick={onOpenFolder}
      />

      <MacContextMenuSeparator />

      <MacContextMenuItem
        icon={<IconTrash aria-hidden {...iconProps} />}
        label="Move to Trash"
        onClick={onDelete}
      />
      <MacContextMenuItem
        disabled
        icon={<IconInfoCircle aria-hidden {...iconProps} />}
        label="Get Info"
        submenu
      />

      <MacContextMenuSeparator />

      <MacContextMenuItem
        icon={<IconPencil aria-hidden {...iconProps} />}
        label="Rename"
        onClick={onRename}
      />
      <MacContextMenuItem
        disabled
        icon={<IconLayoutGrid aria-hidden {...iconProps} />}
        label="Use Stacks"
      />
      <MacContextMenuItem
        icon={<IconCopy aria-hidden {...iconProps} />}
        label="Duplicate"
        onClick={() => {
          dispatch(
            copyFolder({
              id,
              name,
              placement: 'desktop',
              status: 'close',
              type,
            })
          )
        }}
      />
      <MacContextMenuItem
        disabled
        icon={<IconSparkles aria-hidden {...iconProps} />}
        label="Clean Up"
      />
      <MacContextMenuItem
        disabled
        icon={<IconCopy aria-hidden {...iconProps} />}
        label="Copy"
        submenu
      />
      <MacContextMenuItem
        disabled
        icon={<IconShare aria-hidden {...iconProps} />}
        label="Share"
        submenu
      />
    </MacContextMenu>
  )
}
