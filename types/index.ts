import type { LucideIcon } from "lucide-react"

export type ViewName =
  | "home"
  | "write-quick"
  | "write-template"
  | "write-style"
  | "write-ref"
  | "tools"
  | "knowledge"
  | "experts"
  | "chat"
  | "sessions"
  | "tool-proofread"
  | "proofread-editor"
  | "tool-typeset"
  | "tool-polish"
  | "template-library"
  | "admin"

export type ModeName = "快速写作" | "模板写作" | "风格写作" | "以文写文"

export interface Mode {
  name: ModeName
  description: string
  icon: LucideIcon
  placeholder: string
  viewName: ViewName
}

export interface WritingTool {
  name: string
  icon: LucideIcon
  prompt: string
}

export type ExpertBackendType = "agent" | "workflow"

export interface ExpertBackendConfig {
  type: ExpertBackendType
  /** workflow 专属：app_id */
  appId?: string
}

export interface Expert {
  name: string
  specialty: string
  description: string
  icon: LucideIcon
  prompt: string
  backend?: ExpertBackendConfig
}

export interface ToolCallInfo {
  id: string
  toolName: string
  toolArgs: string
  status: "running" | "completed" | "error"
  result?: string
}

export interface ChatMessage {
  id: string
  role: "assistant" | "user"
  content: string
  type: "text" | "options" | "document"
  options?: string[]
  timestamp: number
  thinking?: string
  toolCalls?: ToolCallInfo[]
}

export interface ChatSession {
  id: string
  title: string
  expert: string
  mode: ModeName
  createdAt: number
  updatedAt: number
  messages: ChatMessage[]
}

export interface KnowledgeFile {
  name: string
  type: string
  size: string
  addedAt: string
  category?: string
  department?: string
  date?: string
}

export type { TemplateSection, WritingTemplate, SectionWritingMode } from "@/data/template"
export type { StyleDimension, StyleTemplate, StyleSpec, DocumentType, Direction } from "@/data/style"
export type { RefOverview, RefMaterial, WritingMode } from "@/data/ref"
export type { SceneCategory, SceneSubItem } from "@/data/scenes"

export interface ViewMeta {
  title: string
  subtitle: string
}

export interface AppState {
  view: ViewName
  mode: ModeName
  expert: string
  defaultExpert: string
  pinnedExperts: string[]
  sidebarCollapsed: boolean
  mobileMenuOpen: boolean
  notice: string
  sessions: ChatSession[]
  files: KnowledgeFile[]
  messages: ChatMessage[]
  chatMode: ModeName
  activeSessionId: string | null
}

export type AppAction =
  | { type: "SET_VIEW"; view: ViewName }
  | { type: "SET_MODE"; mode: ModeName }
  | { type: "SET_EXPERT"; expert: string }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "SET_MOBILE_MENU"; open: boolean }
  | { type: "SET_NOTICE"; notice: string }
  | { type: "ADD_FILE"; file: KnowledgeFile }
  | { type: "ADD_MESSAGE"; message: ChatMessage }
  | { type: "UPDATE_MESSAGE"; id: string; content: string }
  | { type: "CLEAR_CHAT" }
  | { type: "SET_CHAT_MODE"; mode: ModeName }
  | { type: "SAVE_SESSION"; session: ChatSession }
  | { type: "DELETE_SESSION"; id: string }
  | { type: "SET_ACTIVE_SESSION"; id: string | null }
  | { type: "SET_DEFAULT_EXPERT"; name: string }
  | { type: "PIN_EXPERT"; name: string }
  | { type: "UNPIN_EXPERT"; name: string }
