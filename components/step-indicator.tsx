"use client"

import { Fragment } from "react"
import { cn } from "@/lib/utils"

const STEPS = [
  { n: 1, label: "写作配置" },
  { n: 2, label: "参考文档" },
  { n: 3, label: "生成初稿" },
] as const

/** 三步面包屑:写作配置 → 参考文档 → 生成初稿。
 *  当前步高亮,已完成的步骤在传入 onNavigate 时可点击回退。 */
export function StepIndicator({
  step,
  onNavigate,
}: {
  step: 1 | 2 | 3
  onNavigate?: (target: number) => void
}) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {STEPS.map((s, i) => {
        const active = step === s.n
        const done = s.n < step
        const clickable = !!onNavigate && done
        return (
          <Fragment key={s.n}>
            <button
              type="button"
              disabled={!clickable}
              onClick={clickable && onNavigate ? () => onNavigate(s.n) : undefined}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-[620] border transition-[background,color,border-color] duration-150",
                active
                  ? "bg-accent-soft text-accent-deep border-[rgba(200,60,78,0.24)]"
                  : done
                    ? "bg-white/60 text-muted-text border-line"
                    : "bg-transparent text-subtle border-line",
                clickable ? "cursor-pointer hover:bg-white/80" : "cursor-default",
              )}
            >
              <span
                className={cn(
                  "w-5 h-5 grid place-items-center rounded-full text-[11px] flex-none",
                  active ? "bg-accent-deep text-white" : done ? "bg-muted text-muted-text" : "bg-muted/40 text-subtle",
                )}
              >
                {s.n}
              </span>
              {s.label}
            </button>
            {i < STEPS.length - 1 && <span className="w-6 h-px bg-line flex-none" />}
          </Fragment>
        )
      })}
    </div>
  )
}
