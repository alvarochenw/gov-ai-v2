/**
 * Module-level store for passing style writing input data from the config page
 * to the chat page. Follows the same pattern as template-data.ts.
 */

import type { StyleDimension } from "@/data/style"
import type { ReferenceFile } from "@/lib/template-data"

export interface StyleWritingInput {
  templateName: string
  dimensions: StyleDimension[]
  styleNote: string
  referenceFiles: ReferenceFile[]
  additionalNotes: string
}

let pendingInput: StyleWritingInput | null = null
let consumed = true

export function setStyleWritingInput(input: StyleWritingInput) {
  pendingInput = input
  consumed = false
}

export function consumeStyleWritingInput(): StyleWritingInput | null {
  if (consumed) return null
  consumed = true
  const value = pendingInput
  pendingInput = null
  return value
}
