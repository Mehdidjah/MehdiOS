import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface INote {
  id: string
  content: string
  updatedAt: string
}

interface InitialState {
  notes: INote[]
}

const initialState: InitialState = {
  notes: [
    {
      id: crypto.randomUUID(),
      content: 'This is demo note',
      updatedAt: new Date().toISOString(),
    },
  ],
}

const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    addNewNote: (state, actions: PayloadAction<INote>) => {
      state.notes.unshift(actions.payload)
    },
    updateNote: (state, actions: PayloadAction<INote>) => {
      const index = state.notes.findIndex(
        (note) => note.id === actions.payload.id
      )
      if (index !== -1) {
        state.notes[index] = {
          ...state.notes[index],
          content: actions.payload.content,
          updatedAt: actions.payload.updatedAt,
        }
      }
    },
    deleteNote: (state, actions: PayloadAction<string>) => {
      state.notes = state.notes.filter((note) => note.id !== actions.payload)
    },
    loadNotes: (state, actions: PayloadAction<INote[]>) => {
      state.notes = actions.payload
    },
  },
})

export const { addNewNote, updateNote, loadNotes, deleteNote } =
  notesSlice.actions
export const notesReducer = notesSlice.reducer
