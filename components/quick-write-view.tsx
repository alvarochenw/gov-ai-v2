"use client"

import { useState, useCallback } from "react"
import { Clock, ArrowRight, ArrowLeft, FileText, ListTree, PenLine, Layers, LayoutGrid } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppDispatch } from "@/hooks/use-app-state"
import { modeCopy } from "@/data/modes"
import { WriteModeCard, type WriteModeId } from "@/components/write-mode-card"
import { ScenePicker } from "@/components/scene-picker"
import { TemplatePickerPanel } from "@/components/template-picker-panel"
import type { WritingTemplate, TemplateSection } from "@/data/template"
import type { SceneSubItem } from "@/data/scenes"

/* ── 写作模式定义 ── */
const WRITE_MODES: { id: WriteModeId; name: string; description: string; icon: typeof FileText; featured?: boolean }[] = [
  { id: "full", name: "生成全文", description: "直接生成结构完整的公文初稿，一步到位", icon: FileText, featured: true },
  { id: "outline", name: "生成大纲", description: "先生成公文大纲框架，确认后再据此成文", icon: ListTree },
  { id: "outline-to-full", name: "大纲成文", description: "基于已有大纲展开，生成完整文稿", icon: PenLine },
]

/* ── 步骤定义 ── */
const STEPS = ["选择模式", "选择内容", "填写信息", "生成文稿"]

type ContentTab = "scene" | "template"

export function QuickWriteView() {
  const dispatch = useAppDispatch()
  const copy = modeCopy["快速写作"]

  const [step, setStep] = useState(0)
  const [selectedMode, setSelectedMode] = useState<WriteModeId | null>(null)

  // step1:选择内容(仅生成全文分支)
  const [activeTab, setActiveTab] = useState<ContentTab>("scene")
  const [selectedScene, setSelectedScene] = useState<SceneSubItem | null>(null)
  const [selectedTplInfo, setSelectedTplInfo] = useState<{ template: WritingTemplate; sections: TemplateSection[] } | null>(null)

  /** 进入聊天视图(后续步骤完成后调用,当前留作复用)。 */
  const handleStart = () => {
    dispatch({ type: "SET_CHAT_MODE", mode: "快速写作" })
    dispatch({ type: "CLEAR_CHAT" })
    dispatch({ type: "SET_VIEW", view: "chat" })
  }

  /** step1 是否可进入下一步。 */
  const canAdvanceStep1 =
    selectedMode === "full" &&
    (activeTab === "scene" ? !!selectedScene : !!selectedTplInfo)

  /** step1 已选项的展示文案。 */
  const step1SelectedLabel =
    selectedMode !== "full" ? ""
    : activeTab === "scene"
      ? selectedScene ? `已选场景：${selectedScene.name}（${selectedScene.documentType}）` : "请选择一个场景"
      : selectedTplInfo ? `已选模板：${selectedTplInfo.template.name}` : "请选择一个模板"

  /** 切 tab 时清掉另一 tab 的已选,避免误用。 */
  const switchTab = useCallback((tab: ContentTab) => {
    setActiveTab(tab)
  }, [])

  /** 模板面板选定后同步(由 panel 内 useEffect 调用)。 */
  const handleTplConfirm = useCallback((template: WritingTemplate, sections: TemplateSection[]) => {
    setSelectedTplInfo({ template, sections })
  }, [])

  return (
    <div className="w-[min(960px,100%)] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <span className="w-14 h-14 grid place-items-center rounded-2xl text-accent-deep bg-accent-soft">
          <Clock className="w-7 h-7" />
        </span>
        <div>
          <h1 className="text-2xl font-[760] tracking-[-0.03em]">{copy.title}</h1>
          <p className="mt-1 text-muted-text text-sm">{copy.subtitle}</p>
        </div>
      </div>

      {/* Step indicator */}
      <StepIndicator current={step} />

      {/* Step content */}
      {step === 0 ? (
        <div className="mt-6">
          {/* 品字型:上方大卡片(生成全文) + 下方两小卡片 */}
          <div className="space-y-3">
            <WriteModeCard
              id="full"
              name="生成全文"
              description="直接生成结构完整的公文初稿，一步到位"
              icon={FileText}
              featured
              selected={selectedMode === "full"}
              onClick={setSelectedMode}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <WriteModeCard
                id="outline"
                name="生成大纲"
                description="先生成公文大纲框架，确认后再据此成文"
                icon={ListTree}
                selected={selectedMode === "outline"}
                onClick={setSelectedMode}
              />
              <WriteModeCard
                id="outline-to-full"
                name="大纲成文"
                description="基于已有大纲展开，生成完整文稿"
                icon={PenLine}
                selected={selectedMode === "outline-to-full"}
                onClick={setSelectedMode}
              />
            </div>
          </div>

          {/* 下一步 */}
          <StepFooter
            hint={selectedMode ? `已选择：${WRITE_MODES.find((m) => m.id === selectedMode)?.name}` : "请选择一种写作模式"}
            canNext={!!selectedMode}
            onNext={() => setStep(1)}
          />
        </div>
      ) : step === 1 ? (
        <div className="mt-6">
          {selectedMode === "full" ? (
            <>
              {/* 顶部 tab:选择场景 / 选择模板 */}
              <div className="flex gap-2 mb-5">
                {([
                  { key: "scene" as ContentTab, label: "选择场景", icon: Layers },
                  { key: "template" as ContentTab, label: "选择模板", icon: LayoutGrid },
                ]).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => switchTab(tab.key)}
                    className={cn(
                      "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-[620] cursor-pointer border transition-[background,color,border-color] duration-150",
                      activeTab === tab.key
                        ? "bg-accent-soft text-accent-deep border-[rgba(200,60,78,0.24)]"
                        : "bg-transparent text-muted-text border-transparent hover:bg-white/60"
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === "scene" ? (
                <ScenePicker selected={selectedScene} onSelect={setSelectedScene} />
              ) : (
                <TemplatePickerPanel onConfirm={handleTplConfirm} />
              )}

              <StepFooter
                hint={step1SelectedLabel}
                canNext={canAdvanceStep1}
                onNext={() => setStep(2)}
                onBack={() => setStep(0)}
              />
            </>
          ) : (
            /* 大纲/大纲成文:选择内容步骤占位 */
            <PlaceholderStep
              label={STEPS[step]}
              extra={`已选写作模式：${WRITE_MODES.find((m) => m.id === selectedMode)?.name ?? "未选择"}`}
              onBack={() => setStep(0)}
            />
          )}
        </div>
      ) : (
        /* step 2/3:占位 */
        <div className="mt-6">
          <PlaceholderStep
            label={STEPS[step]}
            extra={`已选写作模式：${WRITE_MODES.find((m) => m.id === selectedMode)?.name ?? "未选择"}`}
            onBack={() => setStep(step - 1)}
            isLast={step === STEPS.length - 1}
            onStart={handleStart}
          />
        </div>
      )}
    </div>
  )
}

/* ── 步骤指示器 ── */
function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-start">
      {STEPS.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={label} className={cn("flex flex-col items-center", i < STEPS.length - 1 && "flex-1")}>
            <div className="flex items-center w-full">
              <span
                className={cn(
                  "w-7 h-7 grid place-items-center rounded-full text-[11px] font-[700] flex-none",
                  done && "bg-accent-deep text-white",
                  active && "bg-accent-soft text-accent-deep ring-2 ring-[rgba(200,60,78,0.24)]",
                  !done && !active && "bg-muted text-subtle"
                )}
              >
                {i + 1}
              </span>
              {i < STEPS.length - 1 && (
                <span className={cn("h-0.5 flex-1 mx-2", done ? "bg-accent-deep" : "bg-line")} />
              )}
            </div>
            <span className={cn("mt-2 text-[11px] flex-none", active ? "text-accent-deep font-[620]" : "text-muted-text")}>
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/* ── 步骤底栏:返回上一步 + 提示 + 下一步 ── */
function StepFooter({
  hint, canNext, onNext, onBack,
}: {
  hint: string
  canNext: boolean
  onNext: () => void
  onBack?: () => void
}) {
  return (
    <div className="flex items-center justify-between mt-6 gap-3">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-[620] border border-line bg-white/60 text-muted-text hover:text-accent-deep hover:bg-white/80 cursor-pointer transition-[background,color] duration-150"
          >
            <ArrowLeft className="w-4 h-4" />
            返回上一步
          </button>
        )}
        <span className="text-xs text-muted-text">{hint}</span>
      </div>
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        className={cn(
          "inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-[660] border cursor-pointer",
          "transition-[background,opacity] duration-150",
          canNext
            ? "text-white bg-gradient-to-r from-[#cf4657] to-[#aa2639] hover:from-[#c23b4d] hover:to-[#981f32] border-accent-deep shadow-[0_8px_18px_rgba(170,38,57,0.16)]"
            : "border-line text-muted-text opacity-50 cursor-not-allowed"
        )}
      >
        下一步
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}

/* ── 占位步骤 ── */
function PlaceholderStep({
  label, extra, onBack, isLast, onStart,
}: {
  label: string
  extra?: string
  onBack: () => void
  isLast?: boolean
  onStart?: () => void
}) {
  return (
    <>
      <div className="bg-white/80 border border-line rounded-2xl p-10 text-center">
        <div className="w-14 h-14 mx-auto grid place-items-center rounded-2xl bg-accent-soft text-accent-deep mb-4">
          <ListTree className="w-7 h-7" />
        </div>
        <p className="text-sm font-[620] text-foreground">「{label}」步骤正在开发中</p>
        {extra && <p className="text-xs text-muted-text mt-1">{extra}</p>}
      </div>

      <div className="flex items-center gap-3 mt-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-[620] border border-line bg-white/60 text-muted-text hover:text-accent-deep hover:bg-white/80 cursor-pointer transition-[background,color] duration-150"
        >
          <ArrowLeft className="w-4 h-4" />
          返回上一步
        </button>
        {isLast && onStart && (
          <button
            type="button"
            onClick={onStart}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-[660] text-white bg-gradient-to-r from-[#cf4657] to-[#aa2639] hover:from-[#c23b4d] hover:to-[#981f32] border border-accent-deep cursor-pointer transition-[background] duration-150"
          >
            开始快速写作
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </>
  )
}

