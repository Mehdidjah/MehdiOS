'use client'

import { cleanTrash, removeFromTrash } from '@/app/features/trash'
import { restoreFolder, restoreFolderAll } from '@/app/features/window-slice'
import { useDispatch, useSelector } from '@/app/store'
import {
  IconArrowBackUp,
  IconCopy,
  IconFolderOpen,
  IconInfoCircle,
  IconTrash,
  IconTrashX,
} from '@tabler/icons-react'
import { Folder } from '../folder/folders'
import {
  MacContextMenu,
  MacContextMenuItem,
  MacContextMenuSeparator,
} from './menu-parts'

export function TrashContextMenu({
  position,
  item,
}: {
  item: Folder
  position: { x: number; y: number }
}) {
  const dispatch = useDispatch()
  const trashItems = useSelector((state) => state.trash.items)
  const iconProps = { className: 'size-4', stroke: 1.8 }

  return (
    <MacContextMenu
      ariaLabel={`${item.name} Trash context menu`}
      position={position}
    >
      <MacContextMenuItem
        disabled
        icon={<IconFolderOpen aria-hidden {...iconProps} />}
        label="Open"
      />

      <MacContextMenuSeparator />

      <MacContextMenuItem
        icon={<IconArrowBackUp aria-hidden {...iconProps} />}
        label="Put Back"
        onClick={() => {
          dispatch(restoreFolder(item))
          dispatch(removeFromTrash({ id: item.id, name: item.name }))
        }}
      />
      <MacContextMenuItem
        disabled={trashItems.length <= 1}
        icon={<IconArrowBackUp aria-hidden {...iconProps} />}
        label="Put Back All"
        onClick={() => {
          dispatch(restoreFolderAll(trashItems))
          dispatch(cleanTrash())
        }}
      />

      <MacContextMenuSeparator />

      <MacContextMenuItem
        icon={<IconTrashX aria-hidden {...iconProps} />}
        label="Delete Immediately"
        onClick={() => {
          dispatch(removeFromTrash({ id: item.id, name: item.name }))
        }}
      />
      <MacContextMenuItem
        icon={<IconTrash aria-hidden {...iconProps} />}
        label="Empty Trash"
        onClick={() => dispatch(cleanTrash())}
      />

      <MacContextMenuSeparator />

      <MacContextMenuItem
        disabled
        icon={<IconInfoCircle aria-hidden {...iconProps} />}
        label="Get Info"
      />
      <MacContextMenuItem
        disabled
        icon={<IconCopy aria-hidden {...iconProps} />}
        label="Copy"
      />
    </MacContextMenu>
  )
}
