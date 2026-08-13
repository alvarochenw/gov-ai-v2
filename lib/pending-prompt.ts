/**
 * Module-level store for passing a pending prompt (and optional file)
 * from the home Composer to the ChatView when it mounts.
 * This avoids polluting the global app state.
 */

import type { AttachedFile } from "@/components/chat-input"

let pendingChatPrompt = ""
let pendingChatFile: AttachedFile | null = null
let pendingChatPromptConsumed = false

export function setPendingChatPrompt(prompt: string, file?: AttachedFile) {
  pendingChatPrompt = prompt
  pendingChatFile = file ?? null
  pendingChatPromptConsumed = false
}

export function consumePendingChatPrompt(): { text: string; file: AttachedFile | null } {
  if (pendingChatPromptConsumed) return { text: "", file: null }
  pendingChatPromptConsumed = true
  const value = pendingChatPrompt
  const file = pendingChatFile
  pendingChatPrompt = ""
  pendingChatFile = null
  return { text: value, file }
}
