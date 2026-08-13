import {
  Clock,
  // LayoutGrid,  // [HIDDEN] 模板写作
  // Palette,     // [HIDDEN] 风格写作
  Copy,
} from "lucide-react"
import type { Mode } from "@/types"

export const modes: Mode[] = [
  {
    name: "快速写作",
    description: "从空白页快速起草完整初稿",
    icon: Clock,
    placeholder: "请输入具体事项、背景材料、使用对象和成稿要求",
    viewName: "write-quick",
  },
  // [HIDDEN] 模板写作 — temporarily hidden; entry point moved to 模板库
  // {
  //   name: "模板写作",
  //   description: "按文种模板规范组织结构",
  //   icon: LayoutGrid,
  //   placeholder: "请选择公文文种模板",
  //   viewName: "write-template",
  // },
  // [HIDDEN] 风格写作 — temporarily hidden; entry point moved to 模板库
  // {
  //   name: "风格写作",
  //   description: "按指定口径和表达风格成文",
  //   icon: Palette,
  //   placeholder: "请描述参考的风格或口径",
  //   viewName: "write-style",
  // },
  {
    name: "以文写文",
    description: "参考已有材料延续结构表达",
    icon: Copy,
    placeholder: "请上传参考材料或粘贴原文",
    viewName: "write-ref",
  },
]

export const modeCopy: Record<
  Mode["name"],
  { title: string; subtitle: string }
> = {
  快速写作: {
    title: "快速写作",
    subtitle: "直接说明事项、对象和要求，快速生成结构完整的公文初稿。",
  },
  模板写作: {
    title: "模板写作",
    subtitle: "选择标准文种和固定结构，按规范模板完成内容填充。",
  },
  风格写作: {
    title: "风格写作",
    subtitle: "指定领导口径、单位表达习惯或语气风格，生成一致的文稿。",
  },
  以文写文: {
    title: "以文写文",
    subtitle: "上传历史材料或优秀范文，参考结构与表达延续写作。",
  },
}
