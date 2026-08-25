"use client"

import { useState } from "react"
import { Braces } from "lucide-react"
import { cn } from "@/lib/utils"

interface PlaceholderFieldsFormProps {
  /** Unique placeholder names collected from fill-mode sections. */
  fields: string[]
  /** Current values keyed by placeholder name. */
  values: Record<string, string>
  onChange: (values: Record<string, string>) => void
}

/**
 * Collect user input for {{placeholder}} tokens found in a template's fill-mode
 * sections. Renders one input per placeholder so the user fills them in one pass
 * instead of hunting through fill templates.
 */
export function PlaceholderFieldsForm({
  fields,
  values,
  onChange,
}: PlaceholderFieldsFormProps) {
  const [focused, setFocused] = useState<string | null>(null)

  if (fields.length === 0) return null

  const update = (name: string, v: string) => {
    onChange({ ...values, [name]: v })
  }

  return (
    <div className="bg-white/80 border border-line rounded-2xl p-6 mb-6">
      <div className="flex items-center gap-2 mb-1">
        <Braces className="w-4 h-4 text-accent-deep" />
        <h3 className="text-sm font-[660]">三、待填字段</h3>
      </div>
      <p className="text-xs text-muted-text mb-4">
        模板中包含占位符，请一次性填写以下字段，生成时将自动替换。
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map((name) => (
          <div key={name}>
            <label className="block text-xs font-[620] text-muted-text mb-1.5">
              {name}
            </label>
            <input
              type="text"
              value={values[name] ?? ""}
              onChange={(e) => update(name, e.target.value)}
              onFocus={() => setFocused(name)}
              onBlur={() => setFocused(null)}
              placeholder={`请输入${name}`}
              className={cn(
                "w-full h-9 px-4 border border-line rounded-4xl text-sm",
                "bg-white/60 text-foreground placeholder:text-subtle",
                "focus:outline-none focus:border-[rgba(200,60,78,0.36)] focus:ring-2 focus:ring-[rgba(200,60,78,0.08)]",
                "transition-[border-color,box-shadow] duration-150",
                focused === name && "border-[rgba(200,60,78,0.36)]",
              )}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
