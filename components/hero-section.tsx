"use client"

import { cn } from "@/lib/utils"
import { modeCopy } from "@/data/modes"
import type { ModeName } from "@/types"

interface HeroSectionProps {
  view: "home" | "write"
  mode: ModeName
}

export function HeroSection({ view, mode }: HeroSectionProps) {
  const isWrite = view === "write"
  const copy = modeCopy[mode]

  return (
    <div className="text-center py-6 pb-8">
      <h1
        className={cn(
          "mx-auto max-w-[780px] font-bold",
          "text-[clamp(30px,4.2vw,44px)] leading-[1.20] tracking-[-0.045em]",
          "max-[500px]:text-[29px]"
        )}
      >
        {isWrite ? (
          <>
            <span className="inline-block">{copy.title}</span>
            <span className="text-primary inline-block">让规范成文更简单</span>
          </>
        ) : (
          <>
            <span className="inline-block">全能助手，</span>
            <span className="text-primary inline-block">一步开启高效公文写作</span>
          </>
        )}
      </h1>
    </div>
  )
}
