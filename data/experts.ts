import {
  UserCheck,
  Flag,
  Calendar,
  MessageSquare,
  BarChart3,
  Library,
  Users,
  List,
  ShieldCheck,
  Search,
  FileText,
  Check,
} from "lucide-react"
import type { Expert } from "@/types"

export const experts: Expert[] = [
  {
    name: "智能公文专家",
    specialty: "综合起草",
    description:
      "支持通知、请示、报告、函、纪要等常用文种，按正式机关口径组织内容。",
    icon: UserCheck,
    prompt: "请起草一份正式公文，事项和要求如下：",
  },
  {
    name: "专项汇报助手",
    specialty: "专题材料",
    description:
      "围绕专项工作梳理背景、进展、成效、问题和下一步安排，形成完整专题报告。",
    icon: Flag,
    prompt:
      "请围绕以下专项工作起草报告，按背景、进展成效、问题和下一步安排组织：",
  },
  {
    name: "日报周报助手",
    specialty: "周期汇总",
    description:
      "汇总每日或每周工作进展、重要数据、待协调事项和下一阶段计划。",
    icon: Calendar,
    prompt:
      "请将以下工作记录整理为日报或周报，突出进展、数据、问题和后续计划：",
  },
  {
    name: "会议纪要助手",
    specialty: "会议成文",
    description:
      "从会议记录中提取议定事项、责任单位、完成时限和工作要求，形成规范纪要。",
    icon: MessageSquare,
    prompt:
      "请将以下会议记录整理为规范会议纪要，提取议定事项、责任单位和完成时限：",
  },
  {
    name: "数据分析助手",
    specialty: "数据研判",
    description:
      "分析政务业务数据的变化、结构和异常，将结论转化为可直接用于报告的规范表述。",
    icon: BarChart3,
    prompt:
      "请分析以下政务业务数据，提炼趋势、结构、异常及原因，并形成报告表述：",
  },
  {
    name: "政策解读助手",
    specialty: "政策落实",
    description:
      "提炼政策依据、核心要求、影响范围和落实任务，形成政策解读或贯彻材料。",
    icon: Library,
    prompt:
      "请解读以下政策文件，提炼核心要求、影响范围和本单位落实建议：",
  },
  {
    name: "领导讲话助手",
    specialty: "讲话发言",
    description:
      "结合会议主题、工作部署和受众特点，起草重点突出、层次清晰的讲话或发言材料。",
    icon: Users,
    prompt:
      "请根据以下会议主题和工作要求起草领导讲话稿，突出形势、任务和落实要求：",
  },
  {
    name: "工作总结助手",
    specialty: "总结复盘",
    description:
      "归纳阶段性工作、成绩亮点、经验做法、问题不足和下一步计划。",
    icon: List,
    prompt:
      "请根据以下材料起草工作总结，突出成绩、经验、问题和下一步计划：",
  },
  {
    name: "督查督办助手",
    specialty: "整改通报",
    description:
      "梳理督查事项、问题表现、责任分工、整改时限和跟踪要求，形成督办材料。",
    icon: ShieldCheck,
    prompt:
      "请根据以下督查情况整理问题清单，并起草督办通知或整改情况通报：",
  },
  {
    name: "调研报告助手",
    specialty: "调查研究",
    description:
      "整理调研背景、方法、发现、问题成因和对策建议，形成规范调研报告。",
    icon: Search,
    prompt:
      "请根据以下调研材料起草调研报告，按背景、主要发现、问题成因和对策建议组织：",
  },
  {
    name: "信息简报助手",
    specialty: "动态简报",
    description:
      "将多来源信息压缩为短篇政务简报，突出关键动态、核心数据和风险提示。",
    icon: FileText,
    prompt:
      "请将以下信息整理为政务简报，突出关键动态、核心数据和风险提示：",
  },
  {
    name: "任务分解助手",
    specialty: "部署落实",
    description:
      "从政策、会议或领导批示中提取任务、责任部门、协同单位和时间节点。",
    icon: Check,
    prompt:
      "请从以下材料中提取任务、责任部门、协同单位和完成时限，形成任务清单：",
  },
]
