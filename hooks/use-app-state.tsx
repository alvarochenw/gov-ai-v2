"use client"

import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react"
import type { AppState, AppAction } from "@/types"
import { initialFiles } from "@/data/files"

const initialState: AppState = {
  view: "home",
  mode: "快速写作",
  expert: "智能公文专家",
  defaultExpert: "智能公文专家",
  pinnedExperts: ["智能公文专家"],
  sidebarCollapsed: false,
  mobileMenuOpen: false,
  notice: "",
  sessions: [],
  files: initialFiles,
  messages: [],
  chatMode: "快速写作",
  activeSessionId: null,
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_VIEW":
      return { ...state, view: action.view }
    case "SET_MODE":
      return { ...state, mode: action.mode }
    case "SET_EXPERT":
      return { ...state, expert: action.expert }
    case "TOGGLE_SIDEBAR":
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed }
    case "SET_MOBILE_MENU":
      return { ...state, mobileMenuOpen: action.open }
    case "SET_NOTICE":
      return { ...state, notice: action.notice }
    case "ADD_FILE":
      return { ...state, files: [...state.files, action.file] }
    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.message] }
    case "UPDATE_MESSAGE":
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.id ? { ...m, content: action.content } : m,
        ),
      }
    case "CLEAR_CHAT":
      return { ...state, messages: [], activeSessionId: null }
    case "SET_CHAT_MODE":
      return { ...state, chatMode: action.mode }
    case "SAVE_SESSION": {
      const existing = state.sessions.findIndex((s) => s.id === action.session.id)
      const sessions =
        existing >= 0
          ? state.sessions.map((s, i) => (i === existing ? action.session : s))
          : [action.session, ...state.sessions]
      return { ...state, sessions }
    }
    case "DELETE_SESSION":
      return {
        ...state,
        sessions: state.sessions.filter((s) => s.id !== action.id),
        activeSessionId:
          state.activeSessionId === action.id ? null : state.activeSessionId,
      }
    case "SET_ACTIVE_SESSION":
      return { ...state, activeSessionId: action.id }
    case "SET_DEFAULT_EXPERT": {
      // 默认专家一定置顶，且排在所有置顶最前面
      const filtered = state.pinnedExperts.filter((n) => n !== action.name)
      const pinned = [action.name, ...filtered].slice(0, 3)
      return { ...state, defaultExpert: action.name, pinnedExperts: pinned }
    }
    case "PIN_EXPERT": {
      if (state.pinnedExperts.includes(action.name) || state.pinnedExperts.length >= 3)
        return state
      return { ...state, pinnedExperts: [...state.pinnedExperts, action.name] }
    }
    case "UNPIN_EXPERT": {
      // 不能取消默认专家的置顶
      if (action.name === state.defaultExpert) return state
      const updated = state.pinnedExperts.filter((n) => n !== action.name)
      return { ...state, pinnedExperts: updated }
    }
    default:
      return state
  }
}

const AppStateContext = createContext<AppState | null>(null)
const AppDispatchContext = createContext<Dispatch<AppAction> | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  )
}

export function useAppState() {
  const context = useContext(AppStateContext)
  if (!context) {
    throw new Error("useAppState must be used within an AppStateProvider")
  }
  return context
}

export function useAppDispatch() {
  const context = useContext(AppDispatchContext)
  if (!context) {
    throw new Error("useAppDispatch must be used within an AppStateProvider")
  }
  return context
}
