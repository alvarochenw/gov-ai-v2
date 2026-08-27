"use client"

import { useState, useMemo } from "react"
import { Clock, ArrowRight, ArrowLeft, FileText, ListTree, PenLine } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppDispatch } from "@/hooks/use-app-state"
import { modeCopy } from "@/data/modes"
import { WriteModeCard, type WriteModeId } from "@/components/write-mode-card"
import { ScenePicker } from "@/components/scene-picker"
import { StyleSelect } from "@/components/style-select"
import { loadSavedStyleTemplates, type StyleTemplate } from "@/data/style"
import type { SceneSubItem } from "@/data/scenes"

/* ── 写作模式定义 ── */
const WRITE_MODES: { id: WriteModeId; name: string; description: string; icon: typeof FileText; featured?: boolean }[] = [
  { id: "full", name: "生成全文", description: "直接生成结构完整的公文初稿，一步到位", icon: FileText, featured: true },
  { id: "outline", name: "生成大纲", description: "先生成公文大纲框架，确认后再据此成文", icon: ListTree },
  { id: "outline-to-full", name: "大纲成文", description: "基于已有大纲展开，生成完整文稿", icon: PenLine },
]

/* ── 步骤定义 ── */
const STEPS = ["选择模式", "选择内容", "填写信息", "生成文稿"]

export function QuickWriteView() {
  const dispatch = useAppDispatch()
  const copy = modeCopy["快速写作"]

  const [step, setStep] = useState(0)
  const [selectedMode, setSelectedMode] = useState<WriteModeId | null>(null)

  // step1:选择内容(仅生成全文分支,只保留选择场景)
  const [selectedScene, setSelectedScene] = useState<SceneSubItem | null>(null)

  // step2:填写信息(标题/拟稿单位/全局提示词;不收集占位符值)
  const [documentTitle, setDocumentTitle] = useState("")
  const [draftingUnit, setDraftingUnit] = useState("")
  const [additionalNotes, setAdditionalNotes] = useState("")
  const [selectedStyleId, setSelectedStyleId] = useState("")

  // 风格模板列表(含后台自定义),挂载时读一次
  const styleTemplates = useMemo(() => loadSavedStyleTemplates(), [])

  /** 进入聊天视图:场景分支走旧 mock 流程。 */
  const handleStart = () => {
    dispatch({ type: "SET_CHAT_MODE", mode: "快速写作" })
    dispatch({ type: "CLEAR_CHAT" })
    dispatch({ type: "SET_VIEW", view: "chat" })
  }

  /** step1 是否可进入下一步。 */
  const canAdvanceStep1 = selectedMode === "full" && !!selectedScene

  /** step1 已选项的展示文案。 */
  const step1SelectedLabel =
    selectedMode !== "full"
      ? ""
      : selectedScene
        ? `已选场景：${selectedScene.name}（${selectedScene.documentType}）`
        : "请选择一个场景"

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
              <ScenePicker selected={selectedScene} onSelect={setSelectedScene} />

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
      ) : step === 2 ? (
        /* step 2:填写信息(仅生成全文 + 已选场景/模板时填实,否则占位) */
        <div className="mt-6">
          {selectedMode === "full" && selectedScene ? (
            <BasicInfoStep
              documentTitle={documentTitle}
              draftingUnit={draftingUnit}
              additionalNotes={additionalNotes}
              selectedStyleId={selectedStyleId}
              styleTemplates={styleTemplates}
              onTitle={setDocumentTitle}
              onUnit={setDraftingUnit}
              onNotes={setAdditionalNotes}
              onStyle={setSelectedStyleId}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          ) : (
            <PlaceholderStep
              label={STEPS[step]}
              extra={`已选写作模式：${WRITE_MODES.find((m) => m.id === selectedMode)?.name ?? "未选择"}`}
              onBack={() => setStep(1)}
            />
          )}
        </div>
      ) : (
        /* step 3:确认摘要并开始 */
        <div className="mt-6">
          <ConfirmStep
            selectedMode={selectedMode}
            sceneName={selectedScene?.name}
            styleName={styleTemplates.find((t) => t.id === selectedStyleId)?.name}
            documentTitle={documentTitle}
            draftingUnit={draftingUnit}
            additionalNotes={additionalNotes}
            onBack={() => setStep(2)}
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

/* ── 填写写作基础信息(step2) ── */
function BasicInfoStep({
  documentTitle, draftingUnit, additionalNotes,
  selectedStyleId, styleTemplates,
  onTitle, onUnit, onNotes, onStyle, onBack, onNext,
}: {
  documentTitle: string
  draftingUnit: string
  additionalNotes: string
  selectedStyleId: string
  styleTemplates: StyleTemplate[]
  onTitle: (v: string) => void
  onUnit: (v: string) => void
  onNotes: (v: string) => void
  onStyle: (v: string) => void
  onBack: () => void
  onNext: () => void
}) {
  const canNext = documentTitle.trim().length > 0 && additionalNotes.trim().length > 0
  return (
    <>
      <div className="bg-white/80 border border-line rounded-2xl p-6">
        <h3 className="text-sm font-[660] mb-4">填写写作基础信息</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-[620] text-muted-text mb-1.5">
              公文标题<span className="text-accent-deep ml-0.5" aria-hidden>*</span>
            </label>
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => onTitle(e.target.value)}
              placeholder="如：关于XXX的通知"
              className={cn(
                "w-full h-9 px-4 border border-line rounded-4xl text-sm",
                "bg-white/60 text-foreground placeholder:text-subtle",
                "focus:outline-none focus:border-[rgba(200,60,78,0.36)] focus:ring-2 focus:ring-[rgba(200,60,78,0.08)]",
                "transition-[border-color,box-shadow] duration-150",
              )}
            />
          </div>
          <div>
            <label className="block text-xs font-[620] text-muted-text mb-1.5">拟稿单位</label>
            <input
              type="text"
              value={draftingUnit}
              onChange={(e) => onUnit(e.target.value)}
              placeholder="如：办公室"
              className={cn(
                "w-full h-9 px-4 border border-line rounded-4xl text-sm",
                "bg-white/60 text-foreground placeholder:text-subtle",
                "focus:outline-none focus:border-[rgba(200,60,78,0.36)] focus:ring-2 focus:ring-[rgba(200,60,78,0.08)]",
                "transition-[border-color,box-shadow] duration-150",
              )}
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-xs font-[620] text-muted-text mb-1.5">风格模板</label>
          <StyleSelect
            value={selectedStyleId}
            options={styleTemplates}
            onChange={onStyle}
          />
        </div>
        <div>
          <label className="block text-xs font-[620] text-muted-text mb-1.5">
            写作要求（全局提示词）<span className="text-accent-deep ml-0.5" aria-hidden>*</span>
          </label>
          <textarea
            value={additionalNotes}
            onChange={(e) => onNotes(e.target.value)}
            placeholder="描述本次写作的具体要求,如重点内容、口径、注意事项..."
            className={cn(
              "w-full min-h-[100px] border border-line rounded-xl p-4 text-sm leading-relaxed resize-y",
              "bg-white/60 text-foreground placeholder:text-subtle",
              "focus:outline-none focus:border-[rgba(200,60,78,0.36)] focus:ring-2 focus:ring-[rgba(200,60,78,0.08)]",
              "transition-[border-color,box-shadow] duration-150",
            )}
          />
        </div>
      </div>
      <StepFooter hint="标题和写作要求为必填项" canNext={canNext} onNext={onNext} onBack={onBack} />
    </>
  )
}

/* ── 确认摘要并开始(step3) ── */
function ConfirmStep({
  selectedMode, sceneName, styleName,
  documentTitle, draftingUnit, additionalNotes, onBack, onStart,
}: {
  selectedMode: WriteModeId | null
  sceneName?: string
  styleName?: string
  documentTitle: string
  draftingUnit: string
  additionalNotes: string
  onBack: () => void
  onStart: () => void
}) {
  const modeLabel = WRITE_MODES.find((m) => m.id === selectedMode)?.name ?? "未选择"
  return (
    <>
      <div className="bg-white/80 border border-line rounded-2xl p-6">
        <h3 className="text-sm font-[660] mb-4">确认写作信息</h3>
        <dl className="space-y-3 text-sm">
          <SummaryRow label="写作模式" value={modeLabel} />
          <SummaryRow label="已选场景" value={sceneName ?? "未选择"} />
          <SummaryRow label="风格模板" value={styleName || "不指定"} />
          <SummaryRow label="公文标题" value={documentTitle || "未填写"} />
          <SummaryRow label="拟稿单位" value={draftingUnit || "未填写"} />
          <SummaryRow label="写作要求" value={additionalNotes || "未填写"} multiline />
        </dl>
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
        <button
          type="button"
          onClick={onStart}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-[660] text-white bg-gradient-to-r from-[#cf4657] to-[#aa2639] hover:from-[#c23b4d] hover:to-[#981f32] border border-accent-deep cursor-pointer transition-[background] duration-150"
        >
          开始快速写作
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </>
  )
}

function SummaryRow({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div className={cn("flex gap-3", multiline ? "flex-col" : "items-start")}>
      <dt className="text-xs font-[620] text-muted-text flex-none w-20">{label}</dt>
      <dd className={cn("text-foreground", multiline ? "text-sm leading-relaxed whitespace-pre-wrap break-words" : "text-sm")}>{value}</dd>
    </div>
  )
}

