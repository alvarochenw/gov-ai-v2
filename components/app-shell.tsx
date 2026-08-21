"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppState, useAppDispatch } from "@/hooks/use-app-state"
import { Sidebar } from "@/components/sidebar"
import { HeroSection } from "@/components/hero-section"
import { Composer } from "@/components/composer"
import { setPendingChatPrompt } from "@/lib/pending-prompt"
import type { AttachedFile } from "@/components/chat-input"
import { ModeCard } from "@/components/mode-card"
import { ToolCard } from "@/components/tool-card"
import { SessionListView } from "@/components/session-list-view"
import { KnowledgeView } from "@/components/knowledge-view"
import { ExpertCard } from "@/components/expert-card"
import { TemplateLibraryView } from "@/components/template-library-view"
import { ChatView } from "@/components/chat-view"
import { QuickWriteView } from "@/components/quick-write-view"
import { TemplateWriteView } from "@/components/template-write-view"
import { StyleWriteView } from "@/components/style-write-view"
import { RefWriteView } from "@/components/ref-write-view"
import { ProofreadConfigView } from "@/components/proofread-config-view"
import { ProofreadEditorView } from "@/components/proofread-editor-view"
import { TypesetConfigView } from "@/components/typeset-config-view"
import { PolishConfigView } from "@/components/polish-config-view"
import { modes } from "@/data/modes"
import { tools } from "@/data/tools"
import { experts } from "@/data/experts"
import type { ModeName } from "@/types"

/* ------------------------------------------------------------------ */
/*  Mobile horizontal nav                                             */
/* ------------------------------------------------------------------ */

const writingSubItems = [
  { view: "write-quick", label: "快速写作" },
  { view: "write-template", label: "模板写作" },
  // [HIDDEN] { view: "write-style", label: "风格写作" },
  { view: "write-ref", label: "以文写文" },
]

function MobileNav() {
  const state = useAppState()
  const dispatch = useAppDispatch()
  const [writingExpanded, setWritingExpanded] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const navRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Position dropdown relative to the trigger button
  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 8,
        left: rect.left,
        width: Math.min(rect.width + 32, 160),
      })
    }
  }, [])

  useEffect(() => {
    if (writingExpanded) {
      updatePosition()
      window.addEventListener("scroll", updatePosition, true)
      window.addEventListener("resize", updatePosition)
      return () => {
        window.removeEventListener("scroll", updatePosition, true)
        window.removeEventListener("resize", updatePosition)
      }
    }
  }, [writingExpanded, updatePosition])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (
        navRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) return
      setWritingExpanded(false)
    }
    if (writingExpanded) {
      document.addEventListener("mousedown", handleClick)
      return () => document.removeEventListener("mousedown", handleClick)
    }
  }, [writingExpanded])

  // Close dropdown when viewport expands beyond mobile breakpoint
  useEffect(() => {
    if (!writingExpanded) return
    const mq = window.matchMedia("(min-width: 800px)")
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setWritingExpanded(false)
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [writingExpanded])

  const isWritingActive = state.view.startsWith("write-") || state.view === "chat"

  const isActive = (view: string) => {
    if (view === "home") return state.view === "home"
    if (view === "tools")
      return ["tools", "tool-proofread", "proofread-editor", "tool-typeset", "tool-polish"].includes(state.view)
    return state.view === view
  }

  const handleNav = (view: string) => {
    dispatch({ type: "SET_VIEW", view: view as typeof state.view })
    setWritingExpanded(false)
  }

  const navItems = [
    { label: "新建", view: "home" },
    // writing is special — expandable
    { label: "工具", view: "tools" },
    { label: "模板", view: "template-library" },
    { label: "知识", view: "knowledge" },
    { label: "专家", view: "experts" },
  ]

  return (
    <nav
      ref={navRef}
      className="hidden max-[800px]:flex items-center gap-1 px-3 h-11 flex-none border-b border-line bg-white/80 backdrop-blur-[12px]"
    >
      {navItems.map((item) => (
        <button
          key={item.view}
          type="button"
          onClick={() => handleNav(item.view)}
          className={cn(
            "relative px-3 py-1.5 rounded-lg text-[13px] font-[620] cursor-pointer",
            "transition-[background,color] duration-150",
            isActive(item.view)
              ? "text-accent-deep bg-accent-soft"
              : "text-muted-text bg-transparent hover:bg-white/60"
          )}
        >
          {item.label}
        </button>
      ))}

      {/* Writing dropdown */}
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setWritingExpanded(!writingExpanded)}
          className={cn(
            "inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[13px] font-[620] cursor-pointer",
            "transition-[background,color] duration-150",
            isWritingActive
              ? "text-accent-deep bg-accent-soft"
              : "text-muted-text bg-transparent hover:bg-white/60"
          )}
        >
          公文创作
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 transition-transform duration-150",
              writingExpanded && "rotate-180"
            )}
          />
        </button>

        {/* Dropdown — rendered via Portal to escape overflow-hidden */}
        {writingExpanded && createPortal(
          <div
            ref={dropdownRef}
            style={dropdownStyle}
            className={cn(
              "py-1.5",
              "bg-white/95 backdrop-blur-[12px] border border-line rounded-xl",
              "shadow-[0_8px_24px_rgba(74,49,60,0.10)] z-[9999]"
            )}
          >
            {writingSubItems.map((item) => (
              <button
                key={item.view}
                type="button"
                onClick={() => handleNav(item.view)}
                className={cn(
                  "w-full text-left px-4 py-2 text-[13px] font-[620] cursor-pointer",
                  "transition-[background,color] duration-150",
                  state.view === item.view
                    ? "text-accent-deep bg-accent-soft"
                    : "text-muted-text hover:bg-white/60"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>,
          document.body
        )}
      </div>
    </nav>
  )
}

/* ------------------------------------------------------------------ */
/*  App shell                                                         */
/* ------------------------------------------------------------------ */

export function AppShell() {
  const state = useAppState()
  const dispatch = useAppDispatch()
  const { view, sidebarCollapsed, notice } = state
  const [pendingPrompt, setPendingPrompt] = useState("")

  const handleSend = (prompt: string, file?: AttachedFile) => {
    setPendingChatPrompt(prompt, file)
    dispatch({ type: "SET_CHAT_MODE", mode: "快速写作" })
    dispatch({ type: "CLEAR_CHAT" })
    dispatch({ type: "SET_VIEW", view: "chat" })
  }

  const handleModeClick = (modeName: ModeName, viewName: string) => {
    dispatch({ type: "SET_MODE", mode: modeName })
    dispatch({ type: "SET_VIEW", view: viewName as typeof state.view })
  }

  const handleToolExpertClick = (name: string, prompt: string) => {
    if (name === "智能校对") {
      dispatch({ type: "SET_VIEW", view: "tool-proofread" })
      return
    }
    if (name === "智能排版") {
      dispatch({ type: "SET_VIEW", view: "tool-typeset" })
      return
    }
    if (name === "AI润色") {
      dispatch({ type: "SET_VIEW", view: "tool-polish" })
      return
    }
    setPendingPrompt(prompt)
    dispatch({ type: "SET_EXPERT", expert: name })
    dispatch({ type: "SET_CHAT_MODE", mode: "快速写作" })
    dispatch({ type: "CLEAR_CHAT" })
    dispatch({ type: "SET_VIEW", view: "chat" })
  }

  const handleExpertChange = (name: string) => {
    dispatch({ type: "SET_EXPERT", expert: name })
  }

  const handleExpertSelectFromPage = (name: string) => {
    dispatch({ type: "SET_EXPERT", expert: name })
    dispatch({ type: "SET_VIEW", view: "home" })
  }

  // Home view
  const renderHome = () => (
    <section className="w-[min(960px,100%)] mx-auto">
      <HeroSection view="home" mode={state.mode} />

      <Composer
        mode={state.mode}
        expert={state.expert}
        defaultExpert={state.defaultExpert}
        pinnedExperts={state.pinnedExperts}
        onSend={handleSend}
        onExpertChange={handleExpertChange}
        initialPrompt={pendingPrompt}
        onPromptConsumed={() => setPendingPrompt("")}
      />

      {/* Mode cards */}
      <div className="flex items-end justify-between gap-[18px] mt-10 mb-4">
        <h2 className="m-0 inline-flex items-center gap-2 text-[14px] font-[660] text-foreground before:content-[''] before:w-1 before:h-4 before:rounded-full before:bg-gradient-to-b before:from-[#d85061] before:to-[#aa2639]">
          公文创作模式
        </h2>
      </div>
      <div
        className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-3"
        aria-label="写作模式"
      >
        {modes.map((m) => (
          <ModeCard
            key={m.name}
            name={m.name}
            description={m.description}
            icon={m.icon}
            active={false}
            onClick={() => handleModeClick(m.name, m.viewName)}
          />
        ))}
      </div>

      {/* Home tools — no description */}
      <section aria-labelledby="home-tools-title">
        <div className="flex items-end justify-between gap-[18px] mt-10 mb-4">
          <div>
            <h2 id="home-tools-title" className="m-0 inline-flex items-center gap-2 text-[14px] font-[660] text-foreground before:content-[''] before:w-1 before:h-4 before:rounded-full before:bg-gradient-to-b before:from-[#d85061] before:to-[#aa2639]">
              常用写作工具
            </h2>
          </div>
          {/* [HIDDEN] 查看全部工具 */}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {tools.slice(0, 4).map((tool) => (
            <ToolCard
              key={tool.name}
              name={tool.name}
              icon={tool.icon}
              variant="card"
              onClick={() => handleToolExpertClick(tool.name, tool.prompt)}
            />
          ))}
        </div>
      </section>


      {/* Notice */}
      {notice && (
        <p
          className="min-h-[22px] mt-3 mx-[2px] text-accent-deep text-xs"
          role="status"
        >
          {notice}
        </p>
      )}
    </section>
  )

  // Tools view — no description
  const renderTools = () => (
    <section className="w-[min(1120px,100%)] mx-auto">
      <div className="mb-[22px] flex items-end justify-between gap-[18px]">
        <div>
          <h1 className="m-0 text-[27px] tracking-[-0.03em]">写作工具</h1>
          <p className="m-0 mt-2 text-muted-text leading-relaxed text-[13px]">
            提供公文成稿、规范处理和材料转换所需的六项基础工具。
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {tools.map((tool) => (
          <ToolCard
            key={tool.name}
            name={tool.name}
            icon={tool.icon}
            variant="card"
            onClick={() => handleToolExpertClick(tool.name, tool.prompt)}
          />
        ))}
      </div>
    </section>
  )

  // Experts view
  const renderExperts = () => (
    <section className="w-[min(1120px,100%)] mx-auto">
      <div className="mb-[22px] flex items-end justify-between gap-[18px]">
        <div>
          <h1 className="m-0 text-[27px] tracking-[-0.03em]">数字专家</h1>
          <p className="m-0 mt-2 text-muted-text leading-relaxed text-[13px]">
            以具体公文任务为入口，选择专业助手即可进入对应写作流程。
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {[...experts].sort((a, b) => {
          const aPinned = state.pinnedExperts.includes(a.name)
          const bPinned = state.pinnedExperts.includes(b.name)
          const aDefault = a.name === state.defaultExpert
          const bDefault = b.name === state.defaultExpert
          if (aDefault) return -1
          if (bDefault) return 1
          if (aPinned && !bPinned) return -1
          if (!aPinned && bPinned) return 1
          return 0
        }).map((expert) => (
          <ExpertCard
            key={expert.name}
            expert={expert}
            isSelected={state.expert === expert.name}
            isPinned={state.pinnedExperts.includes(expert.name)}
            isDefault={state.defaultExpert === expert.name}
            pinnedCount={state.pinnedExperts.length}
            onClick={() => handleExpertSelectFromPage(expert.name)}
            onPin={(name) => dispatch({ type: "PIN_EXPERT", name })}
            onUnpin={(name) => dispatch({ type: "UNPIN_EXPERT", name })}
            onSetDefault={(name) => dispatch({ type: "SET_DEFAULT_EXPERT", name })}
          />
        ))}
      </div>
    </section>
  )

  // Select view
  const renderContent = () => {
    switch (view) {
      case "home":
        return renderHome()
      case "write-quick":
        return <QuickWriteView />
      case "write-template":
        return <TemplateWriteView />
      case "write-style":
        return <StyleWriteView />
      case "write-ref":
        return <RefWriteView />
      case "knowledge":
        return <KnowledgeView />
      case "template-library":
        return <TemplateLibraryView />
      case "tools":
        return renderTools()
      case "experts":
        return renderExperts()
      case "sessions":
        return <SessionListView />
      case "chat":
        return <ChatView />
      case "tool-proofread":
        return <ProofreadConfigView />
      case "proofread-editor":
        return <ProofreadEditorView />
      case "tool-typeset":
        return <TypesetConfigView />
      case "tool-polish":
        return <PolishConfigView />
      default:
        return renderHome()
    }
  }

  // Chat view needs full height without padding
  const isChat = view === "chat"

  return (
    <div className="min-h-dvh">
      <Sidebar />

      <section
        className={cn(
          "min-w-0 h-dvh flex flex-col overflow-hidden",
          "transition-[margin] duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
          sidebarCollapsed
            ? "ml-[84px] max-[800px]:ml-0"
            : "ml-[276px] max-[800px]:ml-0"
        )}
      >
        {/* Mobile horizontal nav — only visible on narrow screens */}
        <MobileNav />

        <main
          className={cn(
            "flex-1 min-h-0 overflow-auto",
            !isChat && "p-9 max-[800px]:p-[25px_16px_42px]"
          )}
          style={
            !isChat
              ? {
                  background:
                    "radial-gradient(circle at 48% 5%, rgba(200,60,78,.08), transparent 24%), radial-gradient(circle at 90% 12%, rgba(242,178,188,.13), transparent 26%), linear-gradient(180deg, #faf9fb 0%, #f6f6f8 100%)",
                }
              : undefined
          }
          tabIndex={-1}
        >
          {renderContent()}
        </main>
      </section>
    </div>
  )
}
