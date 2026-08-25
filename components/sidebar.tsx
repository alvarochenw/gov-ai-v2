"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import {
  BookOpen,
  Plus,
  FileText,
  Wrench,
  Library,
  Layers,
  UserCheck,
  MessageSquare,
  ChevronRight,
  Shield,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppState, useAppDispatch } from "@/hooks/use-app-state"

const subNavItems: { view: string; label: string }[] = [
  { view: "write-quick", label: "快速写作" },
  // [HIDDEN] { view: "write-template", label: "模板写作" },
  // [HIDDEN] { view: "write-style", label: "风格写作" },
  { view: "write-ref", label: "以文写文" },
]

const toolSubItems: { view: string; label: string }[] = [
  { view: "tool-polish", label: "AI润色" },
  { view: "tool-proofread", label: "智能校对" },
  { view: "tool-typeset", label: "智能排版" },
]

export function Sidebar() {
  const state = useAppState()
  const dispatch = useAppDispatch()
  const [writeExpanded, setWriteExpanded] = useState(true)
  const [toolsExpanded, setToolsExpanded] = useState(true)
  const [adminMenuOpen, setAdminMenuOpen] = useState(false)
  const [adminMenuStyle, setAdminMenuStyle] = useState<React.CSSProperties>({})
  const avatarRef = useRef<HTMLButtonElement>(null)
  const adminMenuRef = useRef<HTMLDivElement>(null)

  const { view, sidebarCollapsed, mobileMenuOpen } = state

  const handleNavClick = (viewName: string) => {
    dispatch({ type: "SET_VIEW", view: viewName as typeof state.view })
  }

  // 头像下拉菜单:定位 + outside-click + 滚动/resize 关闭
  const openAdminMenu = () => {
    if (avatarRef.current) {
      const rect = avatarRef.current.getBoundingClientRect()
      setAdminMenuStyle({
        position: "fixed",
        bottom: window.innerHeight - rect.top + 8, // 菜单在头像上方
        left: rect.left,
        width: Math.min(rect.width + 160, 220),
      })
    }
    setAdminMenuOpen(true)
  }
  const closeAdminMenu = () => setAdminMenuOpen(false)
  const goAdmin = () => {
    closeAdminMenu()
    dispatch({ type: "SET_VIEW", view: "admin" })
  }

  useEffect(() => {
    if (!adminMenuOpen) return
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (avatarRef.current?.contains(target) || adminMenuRef.current?.contains(target)) return
      closeAdminMenu()
    }
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") closeAdminMenu() }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleEsc)
    window.addEventListener("scroll", closeAdminMenu, true)
    window.addEventListener("resize", closeAdminMenu)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleEsc)
      window.removeEventListener("scroll", closeAdminMenu, true)
      window.removeEventListener("resize", closeAdminMenu)
    }
  }, [adminMenuOpen])

  // Check if any write sub-view is active
  const isWriteActive = view.startsWith("write-")

  // Check if any tool sub-view is active
  const isToolsActive = view === "tool-proofread" || view === "proofread-editor" || view === "tool-typeset" || view === "tool-polish"

  // "会话列表" should also highlight when inside a chat
  const isSessionsActive = view === "sessions" || view === "chat"

  // Check if a specific write sub-view is active
  const isSubNavActive = (subView: string) => view === subView

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-10 h-dvh flex flex-col",
        "border-r border-line transition-[width] duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
        // Mobile: off-canvas by default
        "max-[800px]:w-[min(290px,88vw)] max-[800px]:-translate-x-full max-[800px]:shadow-[0_22px_60px_rgba(74,49,60,0.10)]",
        // Mobile: slide in when open
        mobileMenuOpen && "max-[800px]:translate-x-0",
        // Desktop width
        sidebarCollapsed
          ? "w-[84px] px-3.5"
          : "w-[276px] px-3.5",
        "pt-5 pb-3.5"
      )}
      style={{
        background:
          "radial-gradient(circle at 25% 0%, rgba(200,60,78,0.09), transparent 28%), linear-gradient(180deg, #f7f3f4 0%, #f2f2f5 100%)",
      }}
      aria-label="主导航"
    >
      {/* Collapse button - desktop only */}
      <button
        type="button"
        onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
        className={cn(
          "absolute top-7 right-0 translate-x-1/2 z-20",
          "w-7 h-7 grid place-items-center rounded-full border border-line",
          "bg-white shadow-[0_2px_8px_rgba(74,49,60,0.10)] cursor-pointer",
          "text-muted-text transition-[color,border-color,transform,box-shadow] duration-150",
          "hover:text-accent-deep hover:border-[rgba(200,60,78,0.24)] hover:shadow-[0_4px_12px_rgba(74,49,60,0.14)]",
          "max-[800px]:hidden"
        )}
        aria-label={sidebarCollapsed ? "展开侧边栏" : "收起侧边栏"}
        aria-expanded={!sidebarCollapsed}
      >
        <ChevronRight
          className={cn(
            "w-3.5 h-3.5 transition-transform duration-[280ms]",
            !sidebarCollapsed && "rotate-180"
          )}
        />
      </button>

      {/* Brand */}
      <div
        className={cn(
          "flex items-center gap-3 min-w-0 pb-5 overflow-hidden px-2"
        )}
      >
        <span
          className={cn(
            "w-11 h-11 grid place-items-center rounded-[14px] text-white flex-none",
            "bg-gradient-to-br from-[#d85061] to-[#aa2639]",
            "shadow-[0_12px_28px_rgba(170,38,57,0.22)]"
          )}
        >
          <BookOpen className="w-[27px] h-[27px]" strokeWidth={1.7} />
        </span>
        <span
          className={cn(
            "min-w-0 overflow-hidden whitespace-nowrap",
            "transition-[opacity,max-width] duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
            sidebarCollapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[180px]"
          )}
        >
          <strong className="block text-[15px] tracking-[0.01em]">
            政务办公 AI 一体机
          </strong>
          <small className="block mt-1 text-subtle text-[11px]">
            公文创作工作台
          </small>
        </span>
      </div>

      {/* Navigation */}
      <nav className="grid gap-1.5 overflow-hidden">
        {/* 新建任务 */}
        <button
          type="button"
          onClick={() => handleNavClick("home")}
          title="新建任务"
          className={cn(
            "w-full border-0 cursor-pointer text-left text-inherit",
            "flex items-center transition-[background,color,transform,box-shadow] duration-150",
            "min-h-12 gap-[11px] rounded-[14px] px-[10px] py-[7px] font-[660] overflow-hidden",
            view === "home"
              ? "bg-white/92 text-accent-deep shadow-[0_8px_24px_rgba(74,49,60,0.06)]"
              : "bg-transparent hover:bg-white/64 active:translate-y-[1px]"
          )}
        >
          <span
            className={cn(
              "w-[34px] h-[34px] grid place-items-center rounded-[11px] flex-none",
              view === "home"
                ? "text-white bg-gradient-to-br from-[#d85061] to-[#b22b3e] shadow-[0_8px_18px_rgba(178,43,62,0.18)]"
                : "text-muted-text bg-white/55"
            )}
          >
            <Plus className="w-[19px] h-[19px]" />
          </span>
          <span
            className={cn(
              "whitespace-nowrap overflow-hidden",
              "transition-[opacity,max-width] duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
              sidebarCollapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[140px]"
            )}
          >
            新建任务
          </span>
        </button>

        {/* 会话列表 */}
        <button
          type="button"
          onClick={() => handleNavClick("sessions")}
          title="会话列表"
          className={cn(
            "w-full border-0 cursor-pointer text-left text-inherit",
            "flex items-center transition-[background,color,transform,box-shadow] duration-150",
            "min-h-12 gap-[11px] rounded-[14px] px-[10px] py-[7px] font-[660] overflow-hidden",
            isSessionsActive
              ? "bg-white/92 text-accent-deep shadow-[0_8px_24px_rgba(74,49,60,0.06)]"
              : "bg-transparent hover:bg-white/64 active:translate-y-[1px]"
          )}
        >
          <span
            className={cn(
              "w-[34px] h-[34px] grid place-items-center rounded-[11px] flex-none",
              isSessionsActive
                ? "text-white bg-gradient-to-br from-[#d85061] to-[#b22b3e] shadow-[0_8px_18px_rgba(178,43,62,0.18)]"
                : "text-subtle bg-white/60"
            )}
          >
            <MessageSquare className="w-[19px] h-[19px]" />
          </span>
          <span
            className={cn(
              "whitespace-nowrap overflow-hidden",
              "transition-[opacity,max-width] duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
              sidebarCollapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[140px]"
            )}
          >
            会话列表
          </span>
        </button>

        {/* 公文创作 with subnav */}
        <div className="grid gap-[3px]">
          <button
            type="button"
            onClick={() => {
              setWriteExpanded(!writeExpanded)
            }}
            title="公文创作"
            className={cn(
              "w-full border-0 cursor-pointer text-left text-inherit",
              "flex items-center transition-[background,color,transform,box-shadow] duration-150",
              "min-h-12 gap-[11px] rounded-[14px] px-[10px] py-[7px] font-[660] overflow-hidden",
              isWriteActive
                ? "bg-white/92 text-accent-deep shadow-[0_8px_24px_rgba(74,49,60,0.06)]"
                : "bg-transparent hover:bg-white/64 active:translate-y-[1px]"
            )}
          >
            <span
              className={cn(
                "w-[34px] h-[34px] grid place-items-center rounded-[11px] flex-none",
                isWriteActive
                  ? "text-white bg-gradient-to-br from-[#d85061] to-[#b22b3e] shadow-[0_8px_18px_rgba(178,43,62,0.18)]"
                  : "text-muted-text bg-white/55"
              )}
            >
              <FileText className="w-[19px] h-[19px]" />
            </span>
            <span
              className={cn(
                "whitespace-nowrap overflow-hidden",
                "transition-[opacity,max-width] duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
                sidebarCollapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[140px]"
              )}
            >
              公文创作
            </span>
            <ChevronRight
              className={cn(
                "ml-auto w-4 h-4 text-subtle transition-[transform,opacity,max-width] duration-[280ms]",
                writeExpanded && "rotate-90",
                sidebarCollapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-4"
              )}
            />
          </button>

          {/* Subnav */}
          <div
            className={cn(
              "ml-[27px] pl-[19px] grid gap-[3px] py-1 border-l border-[rgba(169,38,57,0.14)]",
              "transition-[max-height,opacity] duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden",
              writeExpanded && !sidebarCollapsed
                ? "max-h-[200px] opacity-100"
                : "max-h-0 opacity-0 py-0 border-l-0"
            )}
            aria-label="公文创作模式"
          >
            {subNavItems.map((item) => (
              <button
                key={item.view}
                type="button"
                onClick={() => handleNavClick(item.view)}
                className={cn(
                  "flex items-center min-h-[34px] px-[11px] py-[7px] rounded-[10px]",
                  "bg-transparent text-muted-text text-[13px] border-0 cursor-pointer text-left",
                  "transition-[background,color] duration-150 hover:bg-white/64",
                  isSubNavActive(item.view) &&
                    "text-accent-deep bg-accent-soft font-[680]"
                )}
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full mr-[9px] flex-none",
                    isSubNavActive(item.view)
                      ? "bg-primary shadow-[0_0_0_4px_rgba(200,60,78,0.10)]"
                      : "bg-[#d7cdd1]"
                  )}
                />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 写作工具 with subnav */}
        <div className="grid gap-[3px]">
          <button
            type="button"
            onClick={() => {
              setToolsExpanded(!toolsExpanded)
            }}
            title="写作工具"
            className={cn(
              "w-full border-0 cursor-pointer text-left text-inherit",
              "flex items-center transition-[background,color,transform,box-shadow] duration-150",
              "min-h-12 gap-[11px] rounded-[14px] px-[10px] py-[7px] font-[660] overflow-hidden",
              isToolsActive
                ? "bg-white/92 text-accent-deep shadow-[0_8px_24px_rgba(74,49,60,0.06)]"
                : "bg-transparent hover:bg-white/64 active:translate-y-[1px]"
            )}
          >
            <span
              className={cn(
                "w-[34px] h-[34px] grid place-items-center rounded-[11px] flex-none",
                isToolsActive
                  ? "text-white bg-gradient-to-br from-[#d85061] to-[#b22b3e] shadow-[0_8px_18px_rgba(178,43,62,0.18)]"
                  : "text-muted-text bg-white/55"
              )}
            >
              <Wrench className="w-[19px] h-[19px]" />
            </span>
            <span
              className={cn(
                "whitespace-nowrap overflow-hidden",
                "transition-[opacity,max-width] duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
                sidebarCollapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[140px]"
              )}
            >
              写作工具
            </span>
            <ChevronRight
              className={cn(
                "ml-auto w-4 h-4 text-subtle transition-[transform,opacity,max-width] duration-[280ms]",
                toolsExpanded && "rotate-90",
                sidebarCollapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-4"
              )}
            />
          </button>

          {/* Tool subnav */}
          <div
            className={cn(
              "ml-[27px] pl-[19px] grid gap-[3px] py-1 border-l border-[rgba(169,38,57,0.14)]",
              "transition-[max-height,opacity] duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden",
              toolsExpanded && !sidebarCollapsed
                ? "max-h-[200px] opacity-100"
                : "max-h-0 opacity-0 py-0 border-l-0"
            )}
            aria-label="写作工具"
          >
            {toolSubItems.map((item) => (
              <button
                key={item.view}
                type="button"
                onClick={() => handleNavClick(item.view)}
                className={cn(
                  "flex items-center min-h-[34px] px-[11px] py-[7px] rounded-[10px]",
                  "bg-transparent text-muted-text text-[13px] border-0 cursor-pointer text-left",
                  "transition-[background,color] duration-150 hover:bg-white/64",
                  view === item.view &&
                    "text-accent-deep bg-accent-soft font-[680]"
                )}
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full mr-[9px] flex-none",
                    view === item.view
                      ? "bg-primary shadow-[0_0_0_4px_rgba(200,60,78,0.10)]"
                      : "bg-[#d7cdd1]"
                  )}
                />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 模板库 */}
        <button
          type="button"
          onClick={() => handleNavClick("template-library")}
          title="模板库"
          className={cn(
            "w-full border-0 cursor-pointer text-left text-inherit",
            "flex items-center transition-[background,color,transform,box-shadow] duration-150",
            "min-h-12 gap-[11px] rounded-[14px] px-[10px] py-[7px] font-[660] overflow-hidden",
            view === "template-library"
              ? "bg-white/92 text-accent-deep shadow-[0_8px_24px_rgba(74,49,60,0.06)]"
              : "bg-transparent hover:bg-white/64 active:translate-y-[1px]"
          )}
        >
          <span
            className={cn(
              "w-[34px] h-[34px] grid place-items-center rounded-[11px] flex-none",
              view === "template-library"
                ? "text-white bg-gradient-to-br from-[#d85061] to-[#b22b3e] shadow-[0_8px_18px_rgba(178,43,62,0.18)]"
                : "text-muted-text bg-white/55"
            )}
          >
            <Layers className="w-[19px] h-[19px]" />
          </span>
          <span
            className={cn(
              "whitespace-nowrap overflow-hidden",
              "transition-[opacity,max-width] duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
              sidebarCollapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[140px]"
            )}
          >
            模板库
          </span>
        </button>

        {/* 知识库 */}
        <button
          type="button"
          onClick={() => handleNavClick("knowledge")}
          title="知识库"
          className={cn(
            "w-full border-0 cursor-pointer text-left text-inherit",
            "flex items-center transition-[background,color,transform,box-shadow] duration-150",
            "min-h-12 gap-[11px] rounded-[14px] px-[10px] py-[7px] font-[660] overflow-hidden",
            view === "knowledge"
              ? "bg-white/92 text-accent-deep shadow-[0_8px_24px_rgba(74,49,60,0.06)]"
              : "bg-transparent hover:bg-white/64 active:translate-y-[1px]"
          )}
        >
          <span
            className={cn(
              "w-[34px] h-[34px] grid place-items-center rounded-[11px] flex-none",
              view === "knowledge"
                ? "text-white bg-gradient-to-br from-[#d85061] to-[#b22b3e] shadow-[0_8px_18px_rgba(178,43,62,0.18)]"
                : "text-muted-text bg-white/55"
            )}
          >
            <Library className="w-[19px] h-[19px]" />
          </span>
          <span
            className={cn(
              "whitespace-nowrap overflow-hidden",
              "transition-[opacity,max-width] duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
              sidebarCollapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[140px]"
            )}
          >
            知识库
          </span>
        </button>

        {/* 数字专家 */}
        <button
          type="button"
          onClick={() => handleNavClick("experts")}
          title="数字专家"
          className={cn(
            "w-full border-0 cursor-pointer text-left text-inherit",
            "flex items-center transition-[background,color,transform,box-shadow] duration-150",
            "min-h-12 gap-[11px] rounded-[14px] px-[10px] py-[7px] font-[660] overflow-hidden",
            view === "experts"
              ? "bg-white/92 text-accent-deep shadow-[0_8px_24px_rgba(74,49,60,0.06)]"
              : "bg-transparent hover:bg-white/64 active:translate-y-[1px]"
          )}
        >
          <span
            className={cn(
              "w-[34px] h-[34px] grid place-items-center rounded-[11px] flex-none",
              view === "experts"
                ? "text-white bg-gradient-to-br from-[#d85061] to-[#b22b3e] shadow-[0_8px_18px_rgba(178,43,62,0.18)]"
                : "text-muted-text bg-white/55"
            )}
          >
            <UserCheck className="w-[19px] h-[19px]" />
          </span>
          <span
            className={cn(
              "whitespace-nowrap overflow-hidden",
              "transition-[opacity,max-width] duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
              sidebarCollapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[140px]"
            )}
          >
            数字专家
          </span>
        </button>
      </nav>

      {/* User */}
      <div
        className={cn(
          "mt-auto pt-[13px] pb-[2px] px-[9px] border-t border-line flex items-center gap-2.5 overflow-hidden"
        )}
      >
        <button
          ref={avatarRef}
          type="button"
          onClick={() => (adminMenuOpen ? closeAdminMenu() : openAdminMenu())}
          className={cn(
            "w-[38px] h-[38px] grid place-items-center rounded-full flex-none cursor-pointer",
            "bg-gradient-to-br from-white to-accent-soft text-accent-deep",
            "border border-[rgba(200,60,78,0.12)] font-[760]",
            "transition-[box-shadow] duration-150",
            adminMenuOpen && "ring-2 ring-[rgba(200,60,78,0.24)]"
          )}
          title="系统管理员"
        >
          管
        </button>
        <span
          className={cn(
            "min-w-0 overflow-hidden whitespace-nowrap",
            "transition-[opacity,max-width] duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
            sidebarCollapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[180px]"
          )}
        >
          <strong className="block text-[13px]">系统管理员</strong>
          <small className="block mt-[3px] text-subtle text-[11px]">
            内网演示账号
          </small>
        </span>
      </div>

      {adminMenuOpen && createPortal(
        <div
          ref={adminMenuRef}
          style={adminMenuStyle}
          className="z-[9999] bg-background border border-line rounded-xl shadow-[0_12px_32px_rgba(74,49,60,0.12)] py-1.5 overflow-hidden"
        >
          <button
            type="button"
            onClick={goAdmin}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left cursor-pointer hover:bg-accent-soft/60 transition-[background] duration-150"
          >
            <span className="w-7 h-7 grid place-items-center rounded-lg bg-accent-soft text-accent-deep flex-none">
              <Shield className="w-4 h-4" />
            </span>
            <span className="text-sm font-[620] text-foreground">系统管理后台</span>
          </button>
        </div>,
        document.body,
      )}
    </aside>
  )
}
