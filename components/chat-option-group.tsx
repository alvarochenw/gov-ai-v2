"use client"

import { cn } from "@/lib/utils"

interface ChatOptionGroupProps {
  options: string[]
  onSelect: (option: string) => void
}

export function ChatOptionGroup({ options, onSelect }: ChatOptionGroupProps) {
  return (
    <div className="flex justify-end">
      <div className="flex flex-wrap gap-2 max-w-[80%]">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            className={cn(
              "px-4 py-2 text-sm font-[660] rounded-xl cursor-pointer",
              "border border-[rgba(200,60,78,0.20)] bg-accent-faint text-accent-deep",
              "hover:bg-accent-soft hover:border-[rgba(200,60,78,0.36)]",
              "transition-[background,border-color] duration-150",
              "active:scale-[0.97]"
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}
