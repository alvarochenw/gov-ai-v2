/**
 * 结构模板章节操作纯函数:增删/移动/升降级。
 * 抽自 template-library-view,供模板库与系统后台共用。
 */

import type { TemplateSection } from "@/data/template"

const uid = () => crypto.randomUUID()

/** 分组:[一级父, ...其二级子],按数组顺序。 */
export function toGroups(sections: TemplateSection[]): TemplateSection[][] {
  const groups: TemplateSection[][] = []
  let current: TemplateSection[] = []
  for (const s of sections) {
    if (s.level === 1) {
      if (current.length) groups.push(current)
      current = [s]
    } else {
      if (current.length === 0) {
        current = [{ ...s, level: 1, parentId: null }]
      } else {
        current.push(s)
      }
    }
  }
  if (current.length) groups.push(current)
  return groups
}

export function fromGroups(groups: TemplateSection[][]): TemplateSection[] {
  return groups.flat()
}

export function reindex(sections: TemplateSection[]): TemplateSection[] {
  return sections.map((s, i) => ({ ...s, order: i }))
}

export function updateSection(sections: TemplateSection[], id: string, patch: Partial<TemplateSection>): TemplateSection[] {
  return sections.map((s) => (s.id === id ? { ...s, ...patch } : s))
}

export function addSection(sections: TemplateSection[]): TemplateSection[] {
  const section: TemplateSection = {
    id: uid(), title: "", fixedTitle: false, required: true,
    level: 1, parentId: null, writingMode: "prompt",
    generationHint: "", fillTemplate: "", referenceFiles: [],
    wordCountMin: null, wordCountMax: null, order: sections.length,
  }
  return [...sections, section]
}

export function addSubsection(sections: TemplateSection[], parentId: string): TemplateSection[] {
  const groups = toGroups(sections)
  const gi = groups.findIndex((g) => g[0].id === parentId)
  if (gi < 0) return sections
  const sub: TemplateSection = {
    id: uid(), title: "", fixedTitle: false, required: true,
    level: 2, parentId, writingMode: "prompt",
    generationHint: "", fillTemplate: "", referenceFiles: [],
    wordCountMin: null, wordCountMax: null, order: 0,
  }
  const group = [...groups[gi], sub]
  const nextGroups = [...groups.slice(0, gi), group, ...groups.slice(gi + 1)]
  return reindex(fromGroups(nextGroups))
}

export function promoteSection(sections: TemplateSection[], id: string): TemplateSection[] {
  const groups = toGroups(sections)
  for (let gi = 0; gi < groups.length; gi++) {
    const idx = groups[gi].findIndex((s) => s.id === id)
    if (idx > 0) {
      const [promoted] = groups[gi].splice(idx, 1)
      const newGroup: TemplateSection[] = [{ ...promoted, level: 1, parentId: null }]
      const nextGroups = [...groups.slice(0, gi + 1), newGroup, ...groups.slice(gi + 1)]
      return reindex(fromGroups(nextGroups))
    }
  }
  return sections
}

export function demoteSection(sections: TemplateSection[], id: string): TemplateSection[] {
  const groups = toGroups(sections)
  const gi = groups.findIndex((g) => g[0].id === id && g[0].level === 1)
  if (gi < 0 || gi >= groups.length - 1) return sections
  const targetParent = groups[gi + 1][0]
  const moved: TemplateSection[] = groups[gi].map((s) => ({ ...s, level: 2, parentId: targetParent.id }))
  const newTargetGroup = [groups[gi + 1][0], ...moved, ...groups[gi + 1].slice(1)]
  const nextGroups = [...groups.slice(0, gi), newTargetGroup, ...groups.slice(gi + 2)]
  return reindex(fromGroups(nextGroups))
}

export function removeSection(sections: TemplateSection[], id: string): TemplateSection[] {
  const target = sections.find((s) => s.id === id)
  if (!target) return sections
  let next: TemplateSection[]
  if (target.level === 1) {
    next = sections.filter((s) => s.id !== id && s.parentId !== id)
  } else {
    next = sections.filter((s) => s.id !== id)
  }
  return reindex(next)
}

export function moveSection(sections: TemplateSection[], id: string, direction: "up" | "down"): TemplateSection[] {
  const groups = toGroups(sections)
  let gi = -1, si = -1
  for (let i = 0; i < groups.length; i++) {
    const j = groups[i].findIndex((s) => s.id === id)
    if (j >= 0) { gi = i; si = j; break }
  }
  if (gi < 0) return sections

  if (si === 0) {
    const swap = direction === "up" ? gi - 1 : gi + 1
    if (swap < 0 || swap >= groups.length) return sections
    const nextGroups = [...groups]
    ;[nextGroups[gi], nextGroups[swap]] = [nextGroups[swap], nextGroups[gi]]
    return reindex(fromGroups(nextGroups))
  } else {
    const group = groups[gi]
    const swap = direction === "up" ? si - 1 : si + 1
    if (swap <= 0 || swap >= group.length) return sections
    const nextGroup = [...group]
    ;[nextGroup[si], nextGroup[swap]] = [nextGroup[swap], nextGroup[si]]
    const nextGroups = [...groups.slice(0, gi), nextGroup, ...groups.slice(gi + 1)]
    return reindex(fromGroups(nextGroups))
  }
}
