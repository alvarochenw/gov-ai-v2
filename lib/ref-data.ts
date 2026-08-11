/**
 * Module-level store for passing ref-writing input data from the config page
 * to the chat page. Follows the same pattern as template-data.ts.
 */

import type { RefMaterial, RefOverview, WritingMode } from "@/data/ref"
import type { ReferenceFile } from "@/lib/template-data"

export interface RefWritingInput {
  materials: RefMaterial[]
  refOverview: RefOverview | null
  writingMode: WritingMode
  referenceFiles: ReferenceFile[]
  direction: string
  additionalNotes: string
}

let pendingInput: RefWritingInput | null = null
let consumed = true

export function setRefWritingInput(input: RefWritingInput) {
  pendingInput = input
  consumed = false
}

export function consumeRefWritingInput(): RefWritingInput | null {
  if (consumed) return null
  consumed = true
  const value = pendingInput
  pendingInput = null
  return value
}
