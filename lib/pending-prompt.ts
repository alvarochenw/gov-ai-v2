/**
 * Module-level store for passing a pending prompt from the home Composer
 * to the ChatView when it mounts. This avoids polluting the global app state.
 */

let pendingChatPrompt = ""
let pendingChatPromptConsumed = false

export function setPendingChatPrompt(prompt: string) {
  pendingChatPrompt = prompt
  pendingChatPromptConsumed = false
}

export function consumePendingChatPrompt(): string {
  if (pendingChatPromptConsumed) return ""
  pendingChatPromptConsumed = true
  const value = pendingChatPrompt
  pendingChatPrompt = ""
  return value
}
