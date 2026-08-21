"use client"

import { useEffect } from "react"
import { useAppDispatch } from "@/hooks/use-app-state"

/**
 * Legacy "风格写作" config page. Its functionality has been merged into the
 * 模板库 → 风格模板 tab (see `template-library-view.tsx` StyleEditPanel).
 * This entry is kept only because `app-shell.tsx` still routes `write-style`
 * here; it redirects to the template library.
 */
export function StyleWriteView() {
  const dispatch = useAppDispatch()
  useEffect(() => {
    dispatch({ type: "SET_VIEW", view: "template-library" })
  }, [dispatch])
  return null
}
