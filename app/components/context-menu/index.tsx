'use client'

import {
  setSortOption,
  setViewOption,
  setZIndex,
} from '@/app/features/settings'
import { addFolder, openFolder } from '@/app/features/window-slice'
import { useDispatch, useSelector } from '@/app/store'
import { IconDeviceMobile } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import {
  MacContextMenu,
  MacContextMenuItem,
  MacContextMenuSeparator,
  MacContextSubmenu,
} from './menu-parts'
import { ReferenceMenuIcon } from './reference-icons'

export function ContextMenu({
  position,
}: {
  position: { x: number; y: number }
}) {
  const dispatch = useDispatch()
  const {
    desktop,
    screen: screenMode,
    zIndex,
  } = useSelector((state) => state.settings)
  const [subPosition, setSubPosition] = useState<'left' | 'right'>('right')
  const [activeSubmenu, setActiveSubmenu] = useState<'sort' | 'view' | null>(
    null
  )

  useEffect(() => {
    const requiredWidth = 220 + 170 + 14
    setSubPosition(
      position.x + requiredWidth <= window.innerWidth ? 'right' : 'left'
    )
  }, [position.x])

  const createFolder = () => {
    dispatch(
      addFolder({
        id: crypto.randomUUID(),
        name: 'Untitled',
        status: 'close',
        placement: 'desktop',
        type: 'folder',
      })
    )
  }

  const openWallpaperSettings = () => {
    dispatch(setZIndex(zIndex + 1))
    dispatch(openFolder('settings'))
  }

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else if (document.body.requestFullscreen) {
      void document.body.requestFullscreen()
    }
  }

  return (
    <MacContextMenu ariaLabel="Desktop context menu" position={position}>
      <MacContextMenuItem
        icon={<ReferenceMenuIcon name="folder" />}
        label="New Folder"
        onClick={createFolder}
        shortcut="⇧⌘N"
      />

      <MacContextMenuSeparator />

      <MacContextMenuItem
        disabled
        icon={<ReferenceMenuIcon name="info" />}
        label="Get Info"
        shortcut="⌘I"
      />
      <MacContextMenuItem
        disabled
        icon={<IconDeviceMobile aria-hidden className="size-4" stroke={1.8} />}
        label="Import From iPhone"
        submenu
      />

      <MacContextMenuSeparator />

      <MacContextMenuItem
        icon={<ReferenceMenuIcon name="wallpaper" />}
        label="Change Wallpaper..."
        onClick={openWallpaperSettings}
      />
      <MacContextMenuItem
        icon={<ReferenceMenuIcon name="fullscreen" />}
        label={
          screenMode === 'fullscreen' ? 'Exit Fullscreen' : 'Request Fullscreen'
        }
        onClick={toggleFullscreen}
        shortcut="F11"
      />

      <div
        className="relative"
        onMouseEnter={() => setActiveSubmenu('sort')}
        onMouseLeave={() => setActiveSubmenu(null)}
      >
        <MacContextMenuItem
          icon={<ReferenceMenuIcon name="sort" />}
          keepOpen
          label="Sort By"
          onClick={() => setActiveSubmenu('sort')}
          submenu
          submenuExpanded={activeSubmenu === 'sort'}
        />
        {activeSubmenu === 'sort' && (
          <MacContextSubmenu ariaLabel="Sort desktop by" side={subPosition}>
            <MacContextMenuItem
              checked={desktop.sort === 'name'}
              label="Name"
              onClick={() => dispatch(setSortOption('name'))}
              radio
            />
            <MacContextMenuItem
              checked={desktop.sort === 'date'}
              label="Date Created"
              onClick={() => dispatch(setSortOption('date'))}
              radio
            />
          </MacContextSubmenu>
        )}
      </div>

      <MacContextMenuItem
        disabled
        icon={<ReferenceMenuIcon name="cleanup" />}
        label="Clean Up"
      />
      <MacContextMenuItem
        disabled
        icon={<ReferenceMenuIcon name="sort" />}
        label="Clean Up By"
        submenu
      />

      <MacContextMenuSeparator />

      <div
        className="relative"
        onMouseEnter={() => setActiveSubmenu('view')}
        onMouseLeave={() => setActiveSubmenu(null)}
      >
        <MacContextMenuItem
          icon={<ReferenceMenuIcon name="view" />}
          keepOpen
          label="Show View Options"
          onClick={() => setActiveSubmenu('view')}
          submenu
          submenuExpanded={activeSubmenu === 'view'}
        />
        {activeSubmenu === 'view' && (
          <MacContextSubmenu
            align="bottom"
            ariaLabel="Desktop view options"
            side={subPosition}
          >
            <MacContextMenuItem
              checked={desktop.view === 'vertical'}
              label="Vertical"
              onClick={() => dispatch(setViewOption('vertical'))}
              radio
            />
            <MacContextMenuItem
              checked={desktop.view === 'horizontal'}
              label="Horizontal"
              onClick={() => dispatch(setViewOption('horizontal'))}
              radio
            />
          </MacContextSubmenu>
        )}
      </div>
    </MacContextMenu>
  )
}
