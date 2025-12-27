import { Folder, folders } from '@/app/components/folder/folders'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface FolderControler extends Folder {
  onMinimizeRestore?: () => void
}

const initialState: FolderControler[] = folders

const windowSlice = createSlice({
  name: 'window-frame',
  initialState,
  reducers: {
    openFolder: (state, action: PayloadAction<string>) => {
      const folder = state.find((f) => f.id === action.payload)
      if (folder) {
        folder.status = 'open'
      }
    },
    closeFolder: (state, action: PayloadAction<string>) => {
      const folder = state.find((f) => f.id === action.payload)
      if (folder) {
        folder.status = 'close'
      }
    },
    minimizeFolder: (
      state,
      action: PayloadAction<{ id: string; onRestore: () => void }>
    ) => {
      const folder = state.find((f) => f.id === action.payload.id)
      if (folder) {
        folder.status = 'minimize'
        folder.onMinimizeRestore = action.payload.onRestore
      }
    },
    addFolder: (state, action: PayloadAction<Folder>) => {
      let uniqueName = action.payload.name
      let index = 1

      while (state.some((f) => f.name === uniqueName)) {
        uniqueName = `${action.payload.name}-${index++}`
      }

      state.push({
        ...action.payload,
        name: uniqueName,
      })
    },
    restoreFolder: (state, action: PayloadAction<Folder>) => {
      state.push(action.payload)
    },
    restoreFolderAll: (state, action: PayloadAction<Folder[]>) => {
      state.push(...action.payload)
    },
    copyFolder: (state, action: PayloadAction<Folder>) => {
      let uniqueName = `${action.payload.name}-copy1`
      let index = 1

      while (state.some((f) => f.name === uniqueName)) {
        uniqueName = `${action.payload.name}-copy${index++}`
      }

      state.push({ ...action.payload, name: uniqueName })
    },
    deleteFolder: (state, action: PayloadAction<string>) => {
      return state.filter((f) => f.name !== action.payload)
    },
    renameFolder: (
      state,
      action: PayloadAction<{ id: string; name: string }>
    ) => {
      const existingFolder = state.find((f) => f.name === action.payload.name)
      if (!existingFolder) {
        const folder = state.find((f) => f.id === action.payload.id)
        if (folder) {
          folder.name = action.payload.name
        }
      }
    },
  },
})

export const {
  openFolder,
  closeFolder,
  minimizeFolder,
  addFolder,
  copyFolder,
  deleteFolder,
  renameFolder,
  restoreFolder,
  restoreFolderAll,
} = windowSlice.actions

export const frameReducer = windowSlice.reducer
