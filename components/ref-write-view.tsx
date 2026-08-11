"use client"

import { Copy, ArrowRight, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppDispatch } from "@/hooks/use-app-state"
import { modeCopy } from "@/data/modes"

export function RefWriteView() {
  const dispatch = useAppDispatch()
  const copy = modeCopy["以文写文"]

  const handleStart = () => {
    dispatch({ type: "SET_CHAT_MODE", mode: "以文写文" })
    dispatch({ type: "CLEAR_CHAT" })
    dispatch({ type: "SET_VIEW", view: "chat" })
  }

  return (
    <div className="w-[min(640px,100%)] mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <span className="w-14 h-14 grid place-items-center rounded-2xl text-accent-deep bg-accent-soft">
          <Copy className="w-7 h-7" />
        </span>
        <div>
          <h1 className="text-2xl font-[760] tracking-[-0.03em]">{copy.title}</h1>
          <p className="mt-1 text-muted-text text-sm">{copy.subtitle}</p>
        </div>
      </div>

      <div className="bg-white/80 border border-line rounded-2xl p-6 mb-6">
        <div className="flex items-start gap-3">
          <span className="w-9 h-9 grid place-items-center rounded-xl bg-gradient-to-br from-[#d85061] to-[#aa2639] text-white flex-none mt-0.5">
            <Sparkles className="w-[18px] h-[18px]" />
          </span>
          <div>
            <h3 className="text-sm font-[660] mb-2">如何使用以文写文</h3>
            <ul className="space-y-2 text-muted-text text-sm leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 grid place-items-center rounded-full bg-accent-soft text-accent-deep text-[10px] font-[700] flex-none mt-0.5">1</span>
                上传参考材料或粘贴原文内容
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 grid place-items-center rounded-full bg-accent-soft text-accent-deep text-[10px] font-[700] flex-none mt-0.5">2</span>
                说明本次写作需要调整的方向和要求
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 grid place-items-center rounded-full bg-accent-soft text-accent-deep text-[10px] font-[700] flex-none mt-0.5">3</span>
                AI 参考材料结构与表达，延续生成新文稿
              </li>
            </ul>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleStart}
        className={cn(
          "w-full min-h-[48px] border border-accent-deep rounded-2xl px-6 py-3 cursor-pointer",
          "bg-gradient-to-br from-[#cf4657] to-[#aa2639] text-white font-[660] text-base",
          "shadow-[0_10px_22px_rgba(170,38,57,0.18)]",
          "inline-flex items-center justify-center gap-2",
          "hover:from-[#c23b4d] hover:to-[#981f32]",
          "transition-[background,box-shadow] duration-150"
        )}
      >
        开始以文写文
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  )
}
