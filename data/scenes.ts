/**
 * 快速写作「选择场景」数据:扁平文种列表,每个文种下挂若干细分场景。
 * 卡片网格展示文种名 + "X个场景"(X = scenes.length),点击展开细分场景。
 */

import type { LucideIcon } from "lucide-react"
import {
  Bell, Mic, ClipboardList, FileBarChart, Mail, ListTree,
  HelpCircle, ClipboardCheck, Lightbulb, Scroll, Megaphone,
  AlertCircle, Newspaper, Gavel, CheckCircle2,
} from "lucide-react"
import type { DocumentType } from "@/data/style"

/** 细分场景 */
export interface SceneSubItem {
  id: string
  name: string
  description?: string
  /** 绑定文种(供后续接推荐规格);部分文种不在 DocumentType 联合里,用 string 放宽。 */
  documentType: DocumentType | string
}

/** 文种场景类目(扁平) */
export interface SceneCategory {
  id: string
  name: string
  icon: LucideIcon
  scenes: SceneSubItem[]
}

export const sceneCategories: SceneCategory[] = [
  {
    id: "doc-notice", name: "通知", icon: Bell,
    scenes: [
      { id: "n1", name: "会议通知", documentType: "通知", description: "召集会议的时间地点议题" },
      { id: "n2", name: "工作部署通知", documentType: "通知", description: "部署专项工作任务" },
      { id: "n3", name: "任免通知", documentType: "通知", description: "公布人事任免" },
      { id: "n4", name: "节假日通知", documentType: "通知", description: "放假安排与值班要求" },
      { id: "n5", name: "转发性通知", documentType: "通知", description: "转发上级文件并提要求" },
      { id: "n6", name: "事项性通知", documentType: "通知", description: "告知具体事项" },
      { id: "n7", name: "培训通知", documentType: "通知", description: "组织培训学习" },
      { id: "n8", name: "整改通知", documentType: "通知", description: "限期整改落实" },
    ],
  },
  {
    id: "doc-speech", name: "讲话稿", icon: Mic,
    scenes: [
      { id: "s1", name: "领导讲话", documentType: "讲话" },
      { id: "s2", name: "会议发言", documentType: "讲话" },
      { id: "s3", name: "动员讲话", documentType: "讲话" },
      { id: "s4", name: "总结讲话", documentType: "讲话" },
      { id: "s5", name: "开场致辞", documentType: "讲话" },
      { id: "s6", name: "表态发言", documentType: "讲话" },
      { id: "s7", name: "经验交流发言", documentType: "讲话" },
      { id: "s8", name: "调研座谈发言", documentType: "讲话" },
    ],
  },
  {
    id: "doc-plan", name: "方案", icon: ClipboardList,
    scenes: [
      { id: "p1", name: "工作方案", documentType: "其他", description: "专项工作实施方案" },
      { id: "p2", name: "活动方案", documentType: "其他", description: "会议活动组织方案" },
      { id: "p3", name: "整改方案", documentType: "其他", description: "问题整改落实方案" },
      { id: "p4", name: "培训方案", documentType: "其他", description: "培训学习组织方案" },
      { id: "p5", name: "应急预案", documentType: "其他", description: "突发事件应急预案" },
    ],
  },
  {
    id: "doc-report", name: "报告", icon: FileBarChart,
    scenes: [
      { id: "r1", name: "工作报告", documentType: "报告", description: "汇报全面或阶段工作" },
      { id: "r2", name: "调研报告", documentType: "调研报告", description: "反映调研与建议" },
      { id: "r3", name: "工作总结", documentType: "工作总结", description: "总结成效与经验" },
      { id: "r4", name: "工作简报", documentType: "简报", description: "简明反映动态" },
      { id: "r5", name: "述职报告", documentType: "报告", description: "个人履职情况汇报" },
      { id: "r6", name: "情况报告", documentType: "报告", description: "反映突发或专项情况" },
      { id: "r7", name: "考察报告", documentType: "报告", description: "外出学习考察汇报" },
      { id: "r8", name: "自查报告", documentType: "报告", description: "对照标准自查上报" },
      { id: "r9", name: "进展报告", documentType: "报告", description: "阶段性进展汇报" },
    ],
  },
  {
    id: "doc-letter", name: "函", icon: Mail,
    scenes: [
      { id: "l1", name: "商洽函", documentType: "函" },
      { id: "l2", name: "答复函", documentType: "函" },
      { id: "l3", name: "请求函", documentType: "函" },
      { id: "l4", name: "邀请函", documentType: "函" },
      { id: "l5", name: "告知函", documentType: "函" },
      { id: "l6", name: "委托函", documentType: "函" },
      { id: "l7", name: "催办函", documentType: "函" },
      { id: "l8", name: "联系函", documentType: "函" },
      { id: "l9", name: "转发函", documentType: "函" },
      { id: "l10", name: "回复函", documentType: "函" },
    ],
  },
  {
    id: "doc-minutes", name: "会议纪要", icon: ListTree,
    scenes: [
      { id: "m1", name: "常务会议纪要", documentType: "纪要" },
      { id: "m2", name: "办公会议纪要", documentType: "纪要" },
      { id: "m3", name: "专题会议纪要", documentType: "纪要" },
      { id: "m4", name: "协调会议纪要", documentType: "纪要" },
      { id: "m5", name: "座谈会议纪要", documentType: "纪要" },
      { id: "m6", name: "联席会议纪要", documentType: "纪要" },
    ],
  },
  {
    id: "doc-request", name: "请示", icon: HelpCircle,
    scenes: [
      { id: "q1", name: "经费请示", documentType: "请示" },
      { id: "q2", name: "事项请示", documentType: "请示" },
      { id: "q3", name: "编制请示", documentType: "请示" },
      { id: "q4", name: "人事请示", documentType: "请示" },
      { id: "q5", name: "政策请示", documentType: "请示" },
    ],
  },
  {
    id: "doc-summary", name: "总结", icon: ClipboardCheck,
    scenes: [
      { id: "su1", name: "工作总结", documentType: "工作总结", description: "阶段或年度工作总结" },
    ],
  },
  {
    id: "doc-opinion", name: "意见", icon: Lightbulb,
    scenes: [
      { id: "o1", name: "实施意见", documentType: "其他", description: "对某项工作的指导性意见" },
    ],
  },
  {
    id: "doc-order", name: "命令", icon: Scroll,
    scenes: [
      { id: "c1", name: "命令", documentType: "其他", description: "发布强制性措施" },
    ],
  },
  {
    id: "doc-announcement", name: "公告", icon: Megaphone,
    scenes: [
      { id: "a1", name: "公告", documentType: "其他", description: "向国内外宣布重要事项" },
    ],
  },
  {
    id: "doc-notify", name: "通告", icon: AlertCircle,
    scenes: [
      { id: "t1", name: "通告", documentType: "其他", description: "公布应当遵守事项" },
    ],
  },
  {
    id: "doc-communique", name: "公报", icon: Newspaper,
    scenes: [
      { id: "co1", name: "公报", documentType: "其他", description: "公布重要决定或情况" },
    ],
  },
  {
    id: "doc-resolution", name: "决议", icon: Gavel,
    scenes: [
      { id: "re1", name: "决议", documentType: "其他", description: "会议讨论通过的事项" },
    ],
  },
  {
    id: "doc-reply", name: "批复", icon: CheckCircle2,
    scenes: [
      { id: "rp1", name: "批复", documentType: "批复", description: "答复下级请示事项" },
    ],
  },
]
