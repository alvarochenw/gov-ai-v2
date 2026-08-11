"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { useAppState, useAppDispatch } from "@/hooks/use-app-state"
import { Sidebar } from "@/components/sidebar"
import { Scrim } from "@/components/scrim"
import { HeroSection } from "@/components/hero-section"
import { Composer } from "@/components/composer"
import { setPendingChatPrompt } from "@/lib/pending-prompt"
import { ModeCard } from "@/components/mode-card"
import { ToolCard } from "@/components/tool-card"
import { SessionListView } from "@/components/session-list-view"
import { KnowledgeView } from "@/components/knowledge-view"
import { ExpertCard } from "@/components/expert-card"
import { ChatView } from "@/components/chat-view"
import { QuickWriteView } from "@/components/quick-write-view"
import { TemplateWriteView } from "@/components/template-write-view"
import { StyleWriteView } from "@/components/style-write-view"
import { RefWriteView } from "@/components/ref-write-view"
import { ProofreadConfigView } from "@/components/proofread-config-view"
import { ProofreadEditorView } from "@/components/proofread-editor-view"
import { TypesetConfigView } from "@/components/typeset-config-view"
import { modes } from "@/data/modes"
import { tools } from "@/data/tools"
import { experts } from "@/data/experts"
import type { ModeName } from "@/types"

export function AppShell() {
  const state = useAppState()
  const dispatch = useAppDispatch()
  const { view, sidebarCollapsed, mobileMenuOpen, notice } = state
  const [pendingPrompt, setPendingPrompt] = useState("")

  // Close mobile menu on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        dispatch({ type: "SET_MOBILE_MENU", open: false })
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [dispatch])

  const handleSend = (prompt: string) => {
    // Store the prompt so ChatView can pick it up
    setPendingChatPrompt(prompt)
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
    setPendingPrompt(prompt)
    dispatch({ type: "SET_EXPERT", expert: name })
    dispatch({ type: "SET_CHAT_MODE", mode: "快速写作" })
    dispatch({ type: "CLEAR_CHAT" })
    dispatch({ type: "SET_VIEW", view: "chat" })
  }

  const handleExpertChange = (name: string, prompt: string) => {
    dispatch({ type: "SET_EXPERT", expert: name })
  }

  const handleExpertSelectFromPage = (name: string, prompt: string) => {
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
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
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
          <button
            type="button"
            onClick={() => dispatch({ type: "SET_VIEW", view: "tools" })}
            className="border-0 px-[2px] py-[5px] inline-flex items-center gap-[5px] bg-transparent text-accent-deep cursor-pointer text-[11px] font-[680] hover:text-primary"
          >
            查看全部工具
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
            onClick={() => handleExpertSelectFromPage(expert.name, expert.prompt)}
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
      default:
        return renderHome()
    }
  }

  // Chat view needs full height without padding
  const isChat = view === "chat"

  return (
    <div className="min-h-dvh">
      <Scrim
        open={mobileMenuOpen}
        onClose={() => dispatch({ type: "SET_MOBILE_MENU", open: false })}
      />
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
