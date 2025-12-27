import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { commands } from './terminal-commands'
import { folders } from '@/app/components/folder/folders'

export interface TerminalHistory {
  id: string
  command: string
  error: string | null
  console?: string
  mode: 'directory' | 'node'
}

export interface TerminalState {
  mode: 'directory' | 'node'
  history: TerminalHistory[]
}

const initialState: TerminalState = {
  mode: 'directory',
  history: [],
}

const createHistoryEntry = (
  command: string,
  mode: 'directory' | 'node',
  error: string | null = null,
  console?: string
): TerminalHistory => ({
  id: crypto.randomUUID(),
  command,
  error,
  console,
  mode,
})

const windowSlice = createSlice({
  name: 'terminal',
  initialState,
  reducers: {
    runPrompt: (state, action: PayloadAction<string>) => {
      const command = action.payload.trim()

      if (state.mode === 'directory') {
        if (command === 'node') {
          state.mode = 'node'
          state.history.push(createHistoryEntry(command, 'directory'))
          return
        }

        if (command === 'clear' || command === 'exit') {
          state.history = []
          return
        }

        if (command === 'cd' || command.startsWith('cd ')) {
          state.history.push(
            createHistoryEntry(
              command,
              'directory',
              "You can't change directory due to Author's restriction"
            )
          )
          return
        }

        if (command === 'cat' || command.startsWith('cat ')) {
          const directory = command.split(' ')[1]
          if (directory) {
            const isFound = folders.find(
              ({ id }) => id === directory.toLowerCase()
            )
            if (!isFound) {
              state.history.push(
                createHistoryEntry(
                  command,
                  'directory',
                  `The following directory "${directory}" is not found`
                )
              )
            } else {
              state.history.push(createHistoryEntry(command, 'directory'))
            }
          } else {
            state.history.push(
              createHistoryEntry(
                command,
                'directory',
                'Invalid command prompt, try > cat <directory_name>'
              )
            )
          }
          return
        }

        if (commands.includes(command) || command === '') {
          state.history.push(createHistoryEntry(command, 'directory'))
        } else {
          state.history.push(
            createHistoryEntry(
              command,
              'directory',
              `The term "${command}" is not recognized as a name of a cmdlet, type "help" to get available commands.`
            )
          )
        }
      } else if (state.mode === 'node') {
        if (command === 'exit') {
          state.mode = 'directory'
          state.history.push(createHistoryEntry(command, 'node'))
        } else if (command === 'clear') {
          state.history = []
        }
      }
    },
    runNode: (
      state,
      action: PayloadAction<{ console: string; error: string; command: string }>
    ) => {
      state.history.push(
        createHistoryEntry(
          action.payload.command,
          'node',
          action.payload.error || null,
          action.payload.console
        )
      )
    },
  },
})

export const { runPrompt, runNode } = windowSlice.actions
export const terminalReducer = windowSlice.reducer
