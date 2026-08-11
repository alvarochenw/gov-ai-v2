"use client"

interface ContextChipProps {
  label: string
  onClick: () => void
}

export function ContextChip({ label, onClick }: ContextChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border-0 px-2.5 py-1.5 rounded-full bg-[#f6f3f5] text-muted-text cursor-pointer text-[11px] transition-[background,color] duration-150 hover:bg-accent-soft hover:text-accent-deep"
    >
      {label}
    </button>
  )
}
