/**
 * Module-level store for passing proofreading input data from the config page
 * to the editor page. Follows the same pattern as pending-prompt.ts.
 */

export interface ProofreadInput {
  sourceType: "file" | "paste" | "knowledge"
  fileName?: string
  text: string
  selectedDictionaries: string[]
}

let pendingProofreadInput: ProofreadInput | null = null
let consumed = true

export function setProofreadInput(input: ProofreadInput) {
  pendingProofreadInput = input
  consumed = false
}

export function consumeProofreadInput(): ProofreadInput | null {
  if (consumed) return null
  consumed = true
  const value = pendingProofreadInput
  pendingProofreadInput = null
  return value
}
