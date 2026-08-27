"use client"

import { useState, useMemo, useEffect } from "react"
import { Shield, X, ChevronRight, Box, Check, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type DepartmentNode,
  departmentTree,
  flattenDepartments,
  loadPermissionsFor,
  savePermissionsFor,
} from "@/data/departments"

/**
 * 设置智能体权限弹窗。
 * 左栏:部门树(复选框,父子联动);右栏:已选择列表(计数/清空)。
 * 选中部门即获得对该模板(智能体)的可见访问权限。
 */
export function PermissionDialog({
  open,
  templateId,
  templateName,
  onOpenChange,
}: {
  open: boolean
  templateId: string
  templateName: string
  onOpenChange: (open: boolean) => void
}) {
  // 已选部门 id 集合
  const [selected, setSelected] = useState<Set<string>>(new Set())
  // 展开的节点 id 集合(默认全部展开)
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const init = new Set<string>()
    for (const n of departmentTree) {
      if (n.children?.length) {
        init.add(n.id)
        for (const c of n.children) if (c.children?.length) init.add(c.id)
      }
    }
    return init
  })

  // 打开时载入该模板已存权限
  useEffect(() => {
    if (!open) return
    setSelected(new Set(loadPermissionsFor(templateId)))
  }, [open, templateId])

  const allNodes = useMemo(() => flattenDepartments(departmentTree), [])

  /** 节点的全部后代 id。 */
  const descendantsOf = (node: DepartmentNode): string[] => {
    const out: string[] = []
    const walk = (n: DepartmentNode) => {
      for (const c of n.children ?? []) {
        out.push(c.id)
        walk(c)
      }
    }
    walk(node)
    return out
  }

  const toggleCheck = (node: DepartmentNode) => {
    setSelected((prev) => {
      const next = new Set(prev)
      const desc = descendantsOf(node)
      const willCheck = !next.has(node.id)
      if (willCheck) {
        next.add(node.id)
        desc.forEach((id) => next.add(id))
      } else {
        next.delete(node.id)
        desc.forEach((id) => next.delete(id))
      }
      return next
    })
  }

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clearAll = () => setSelected(new Set())

  const handleSave = () => {
    savePermissionsFor(templateId, [...selected])
    onOpenChange(false)
  }

  const selectedList = useMemo(
    () => allNodes.filter((n) => selected.has(n.id)),
    [allNodes, selected],
  )

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[9999] grid place-items-center bg-black/40 supports-backdrop-filter:backdrop-blur-[2px] p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onOpenChange(false) }}
    >
      <div className="w-[min(860px,100%)] h-[88vh] max-h-[88vh] flex flex-col bg-popover rounded-2xl ring-1 ring-foreground/5 shadow-[0_24px_60px_rgba(74,49,60,0.22)] overflow-hidden">
        {/* 标题栏 */}
        <div className="flex items-center justify-between gap-3 px-6 h-14 flex-none border-b border-line">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 grid place-items-center rounded-lg bg-gradient-to-br from-[#d85061] to-[#aa2639] text-white flex-none shadow-[0_6px_14px_rgba(170,38,57,0.22)]">
              <Shield className="w-4 h-4" />
            </span>
            <h2 className="text-[15px] font-[680] text-foreground truncate">设置智能体权限</h2>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 grid place-items-center rounded-lg text-muted-text hover:text-foreground hover:bg-accent-soft/50 cursor-pointer border-0 bg-transparent transition-[background,color] duration-150"
            aria-label="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 智能体标识 */}
        <div className="px-6 pt-4 pb-2 flex-none">
          <span className="inline-flex items-center gap-1.5 text-xs font-[600] text-muted-text">
            智能体：
            <span className="text-foreground font-[680]">{templateName}</span>
          </span>
        </div>

        {/* 主内容区:双栏 */}
        <div className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-[1fr_300px] gap-4 px-6 pb-4 overflow-hidden">
          {/* 左栏:部门用户列表 */}
          <div className="flex flex-col min-h-0 border border-line rounded-xl bg-white/50">
            <div className="flex items-center justify-between gap-2 px-4 h-11 flex-none border-b border-line">
              <span className="text-[13px] font-[660] text-foreground">部门用户列表</span>
              <span className="text-[10px] font-[600] px-2 py-0.5 rounded-md bg-gradient-to-r from-[#d85061] to-[#b22b3e] text-white">
                勾选后可见
              </span>
            </div>
            <div
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-1.5
                [scrollbar-width:thin] [scrollbar-color:rgba(200,60,78,0.22)_transparent]
                [&::-webkit-scrollbar]:w-1.5
                [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[rgba(200,60,78,0.18)]
                [&::-webkit-scrollbar-track]:bg-transparent"
            >
              {departmentTree.map((node) => (
                <DeptTreeRow
                  key={node.id}
                  node={node}
                  depth={0}
                  selected={selected}
                  expanded={expanded}
                  onToggleCheck={toggleCheck}
                  onToggleExpand={toggleExpand}
                />
              ))}
            </div>
          </div>

          {/* 右栏:已选择 */}
          <div className="flex flex-col min-h-0 border border-line rounded-xl bg-white/50">
            <div className="flex items-center justify-between gap-2 px-4 h-11 flex-none border-b border-line">
              <span className="text-[13px] font-[660] text-foreground">
                已选择 <span className="text-accent-deep">({selectedList.length})</span>
              </span>
              <button
                type="button"
                onClick={clearAll}
                disabled={selectedList.length === 0}
                className={cn(
                  "text-xs font-[580] border-0 bg-transparent cursor-pointer transition-colors duration-150",
                  selectedList.length === 0
                    ? "text-subtle cursor-not-allowed"
                    : "text-muted-text hover:text-accent-deep",
                )}
              >
                清空
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2
              [scrollbar-width:thin] [scrollbar-color:rgba(200,60,78,0.22)_transparent]
              [&::-webkit-scrollbar]:w-1.5
              [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[rgba(200,60,78,0.18)]
              [&::-webkit-scrollbar-track]:bg-transparent">
              {selectedList.length === 0 ? (
                <div className="h-full grid place-items-center py-10">
                  <p className="text-xs text-subtle">暂无已选内容</p>
                </div>
              ) : (
                <ul className="space-y-1">
                  {selectedList.map((n) => (
                    <li
                      key={n.id}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-accent-soft/40 text-[12px] text-foreground"
                    >
                      <Box className="w-3.5 h-3.5 text-[#3b82f6] flex-none" />
                      <span className="truncate flex-1">{n.name}</span>
                      <button
                        type="button"
                        onClick={() => toggleCheck(n)}
                        className="text-muted-text hover:text-accent-deep cursor-pointer border-0 bg-transparent p-0 flex-none"
                        aria-label={`移除 ${n.name}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="flex items-center justify-end gap-2 px-6 h-16 flex-none border-t border-line">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex items-center justify-center px-5 h-9 rounded-xl text-sm font-[620] border border-line bg-white text-muted-text hover:text-foreground hover:bg-white/80 cursor-pointer transition-[background,color] duration-150"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center justify-center px-5 h-9 rounded-xl text-sm font-[660] text-white bg-gradient-to-r from-[#d85061] to-[#aa2639] hover:from-[#c23b4d] hover:to-[#981f32] border border-accent-deep cursor-pointer shadow-[0_8px_18px_rgba(170,38,57,0.16)] transition-[background] duration-150"
          >
            保存权限
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── 树形行(递归) ── */
function DeptTreeRow({
  node, depth, selected, expanded, onToggleCheck, onToggleExpand,
}: {
  node: DepartmentNode
  depth: number
  selected: Set<string>
  expanded: Set<string>
  onToggleCheck: (n: DepartmentNode) => void
  onToggleExpand: (id: string) => void
}) {
  const hasChildren = !!node.children?.length
  const isOpen = expanded.has(node.id)

  // 父子联动状态计算
  const descIds = useMemo(() => {
    const out: string[] = []
    const walk = (n: DepartmentNode) => {
      for (const c of n.children ?? []) {
        out.push(c.id)
        walk(c)
      }
    }
    walk(node)
    return out
  }, [node])

  const checkedCount = descIds.filter((id) => selected.has(id)).length
  const selfChecked = selected.has(node.id)
  const indeterminate = hasChildren && !selfChecked && checkedCount > 0 && checkedCount < descIds.length
  const fullyChecked = hasChildren ? selfChecked && checkedCount === descIds.length : selfChecked

  return (
    <>
      <div
        className="group flex items-center gap-2 pr-3 hover:bg-accent-soft/30"
        style={{ paddingLeft: 12 + depth * 18 }}
      >
        {/* 展开/折叠箭头 */}
        <button
          type="button"
          onClick={() => hasChildren && onToggleExpand(node.id)}
          className={cn(
            "w-5 h-5 grid place-items-center flex-none border-0 bg-transparent cursor-pointer rounded transition-transform duration-150",
            !hasChildren && "invisible",
          )}
          aria-label={isOpen ? "折叠" : "展开"}
        >
          <ChevronRight className={cn("w-3.5 h-3.5 text-muted-text transition-transform duration-150", isOpen && "rotate-90")} />
        </button>

        {/* 复选框 */}
        <button
          type="button"
          onClick={() => onToggleCheck(node)}
          className={cn(
            "w-4 h-4 grid place-items-center rounded-[5px] border flex-none cursor-pointer transition-[background,border-color] duration-150",
            fullyChecked
              ? "bg-accent-deep border-accent-deep text-white"
              : indeterminate
                ? "bg-accent-deep border-accent-deep text-white"
                : "bg-white border-line text-transparent hover:border-[rgba(200,60,78,0.36)]",
          )}
          aria-checked={fullyChecked ? "true" : indeterminate ? "mixed" : "false"}
          role="checkbox"
        >
          {fullyChecked
            ? <Check className="w-3 h-3" strokeWidth={3} />
            : indeterminate
              ? <Minus className="w-3 h-3" strokeWidth={3} />
              : null}
        </button>

        {/* 蓝色立方体图标 */}
        <span className="w-5 h-5 grid place-items-center flex-none">
          <Box className={cn("w-4 h-4 transition-colors", fullyChecked || indeterminate ? "text-accent-deep" : "text-[#3b82f6]")} />
        </span>

        {/* 名称 */}
        <span className={cn("flex-1 truncate text-[13px] py-[7px]", fullyChecked ? "text-accent-deep font-[600]" : "text-foreground")}>
          {node.name}
        </span>

        {/* 组织标签 */}
        <span className="text-[10px] font-[560] px-1.5 py-0.5 rounded bg-muted/60 text-muted-text flex-none">
          组织
        </span>
      </div>

      {hasChildren && isOpen && node.children!.map((c) => (
        <DeptTreeRow
          key={c.id}
          node={c}
          depth={depth + 1}
          selected={selected}
          expanded={expanded}
          onToggleCheck={onToggleCheck}
          onToggleExpand={onToggleExpand}
        />
      ))}
    </>
  )
}
