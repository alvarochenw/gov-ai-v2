import {
  Check,
  LayoutGrid,
  Sparkles,
  // Flag,      // [HIDDEN] 公文套红
  // FileText,  // [HIDDEN] 文字识别
  // List,      // [HIDDEN] 内容摘要
  // Copy,      // [HIDDEN] 格式转换
} from "lucide-react"
import type { WritingTool } from "@/types"

export const tools: WritingTool[] = [
  {
    name: "AI润色",
    icon: Sparkles,
    prompt:
      "请对以下公文内容进行润色，优化措辞、调整语气、增强表达力，使其更符合公文行文规范：",
  },
  {
    name: "智能校对",
    icon: Check,
    prompt:
      "请对以下公文内容进行智能校对，逐项标出错别字、语病、称谓、数字和层级编号问题，并给出修改建议：",
  },
  {
    name: "智能排版",
    icon: LayoutGrid,
    prompt:
      "请对以下公文进行智能排版，规范标题、正文层级、段落、落款、日期和附件说明：",
  },
  // [HIDDEN] 公文套红 — temporarily hidden
  // {
  //   name: "公文套红",
  //   icon: Flag,
  //   prompt:
  //     "请根据以下公文内容匹配合适的红头模板，并检查发文机关、文号、标题、版记等套红要素：",
  // },
  // [HIDDEN] 文字识别 — temporarily hidden
  // {
  //   name: "文字识别",
  //   icon: FileText,
  //   prompt:
  //     "请识别上传图片、扫描件或 PDF 中的文字，保持原有段落层级，并整理为可编辑文本：",
  // },
  // [HIDDEN] 内容摘要 — temporarily hidden
  // {
  //   name: "内容摘要",
  //   icon: List,
  //   prompt:
  //     "请对以下材料生成内容摘要，提炼核心观点、关键数据、任务要求和结论：",
  // },
  // [HIDDEN] 格式转换 — temporarily hidden
  // {
  //   name: "格式转换",
  //   icon: Copy,
  //   prompt:
  //     "请将以下材料转换为指定格式，并尽量保留标题、段落层级、表格和附件说明：",
  // },
]
