import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface BrowserTab {
  id: string
  url: string
  title: string
  iframe_url: string
}

interface ChromeState {
  tabs: BrowserTab[]
  focusedTab: string
}

const createInitialTab = (): BrowserTab => ({
  id: crypto.randomUUID(),
  title: 'New Tab',
  url: '',
  iframe_url: '',
})

const initialTab = createInitialTab()
const initialState: ChromeState = {
  tabs: [initialTab],
  focusedTab: initialTab.id,
}

const chromeSlice = createSlice({
  name: 'chrome',
  initialState,
  reducers: {
    addNewtab: (state) => {
      if (state.tabs.length < 8) {
        const newTab = createInitialTab()
        state.tabs.push(newTab)
        state.focusedTab = newTab.id
      }
    },
    openUrlTab: (
      state,
      action: PayloadAction<{ title: string; live_url: string }>
    ) => {
      if (state.tabs.length < 8) {
        const newTab: BrowserTab = {
          id: crypto.randomUUID(),
          title: action.payload.title,
          url: action.payload.live_url,
          iframe_url: action.payload.live_url,
        }
        state.tabs.push(newTab)
        state.focusedTab = newTab.id
      }
    },
    removeTab: (state, action: PayloadAction<string>) => {
      if (state.tabs.length >= 2) {
        state.tabs = state.tabs.filter((tab) => tab.id !== action.payload)
        if (state.focusedTab === action.payload) {
          state.focusedTab = state.tabs[state.tabs.length - 1]?.id ?? ''
        }
      }
    },
    focusTab: (state, action: PayloadAction<string>) => {
      if (state.tabs.some((tab) => tab.id === action.payload)) {
        state.focusedTab = action.payload
      }
    },
    updateTab: (
      state,
      action: PayloadAction<{ url?: string; iframe_url?: string; title?: string }>
    ) => {
      const tab = state.tabs.find((tab) => tab.id === state.focusedTab)
      if (tab) {
        if (action.payload.url !== undefined) {
          tab.url = action.payload.url
          if (!action.payload.title) {
            try {
              const urlObj = new URL(action.payload.url)
              const hostname = urlObj.hostname.replace('www.', '')
              tab.title = hostname.split('.')[0] || 'New Tab'
            } catch {
              if (action.payload.url.includes('startpage.com/sp/search')) {
                tab.title = 'StartPage Search'
              } else if (action.payload.url.includes('html.duckduckgo.com')) {
                tab.title = 'DuckDuckGo Search'
              } else if (action.payload.url.includes('lite.duckduckgo.com')) {
                tab.title = 'DuckDuckGo Search'
              } else if (action.payload.url.includes('bing.com/search')) {
                tab.title = 'Bing Search'
              } else if (action.payload.url.includes('duckduckgo.com/html')) {
                tab.title = 'DuckDuckGo Search'
              } else if (action.payload.url.includes('google.com/search')) {
                tab.title = 'Google Search'
              } else {
                tab.title = 'New Tab'
              }
            }
          }
        }
        if (action.payload.iframe_url !== undefined) {
          tab.iframe_url = action.payload.iframe_url
        }
        if (action.payload.title !== undefined) {
          tab.title = action.payload.title
        }
      }
    },
    resetChrome: (state) => {
      const newTab = createInitialTab()
      state.focusedTab = newTab.id
      state.tabs = [newTab]
    },
  },
})

export const {
  addNewtab,
  removeTab,
  focusTab,
  resetChrome,
  updateTab,
  openUrlTab,
} = chromeSlice.actions

export const chromeReducer = chromeSlice.reducer
