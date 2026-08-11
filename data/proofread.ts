export interface ProofreadEngine {
  id: string
  name: string
  description: string
}

export const proofreadEngines: ProofreadEngine[] = [
  {
    id: "heima",
    name: "黑马校对",
    description: "业界领先的中文校对引擎，覆盖错别字、语病、标点、数字等多维度检查",
  },
]

export interface ProofreadDictionary {
  id: string
  name: string
  description: string
}

export const proofreadDictionaries: ProofreadDictionary[] = [
  {
    id: "police",
    name: "公安术语词库",
    description: "公安领域专有术语、职务称谓与规范用语检查",
  },
  {
    id: "discipline",
    name: "纪委术语词库",
    description: "纪检监察领域专有术语与规范表达检查",
  },
]

export type ProofreadErrorType = "错别字" | "语病" | "称谓" | "数字" | "标点" | "层级"

export interface ProofreadError {
  id: string
  type: ProofreadErrorType
  original: string
  corrected: string
  position: number
  description: string
}

export interface ProofreadResult {
  originalText: string
  correctedText: string
  errorCount: number
  errors: ProofreadError[]
}

export const mockProofreadResult: ProofreadResult = {
  originalText:
    "关于进一步加强基层治理体系建设的通知\n\n各局、各直属单位：\n\n为深入贯彻落实党中央、国务院关于基层治理的决策部署，以进一步推动基层治理体系和治理能力现代化，现就有关事项通知如下：\n\n一、总体要求\n\n坚持以习近平新时代中国特色社会主义思想为指导，全面落实基层治理各项任务。到2025年底，全国基层治理水平显著提升，3个以上地级市完成基层治理示范创建。\n\n（一）完善组织体系\n\n各级人名政府要切实履行主体责任，加强基层治理组织体系建设。建立健全乡镇（街道）统筹协调机制，推动各类资源向基层倾斜。\n\n（二）强化人才保障\n\n加大基层人才引进力度，完善基层工作人员职业发展通道，确保基层「留的住、干的好」。\n\n二、重点任务\n\n（一）深化「放管服」改革\n\n持续推进简政放权，优化营商环境。对确需下放的事项，要确保基层接的住、管的好\n\n（二）推进智慧治理\n\n运用大数据、云计算等技术手段，建设基层智慧治理平台，实现数据共享和业务协同。",
  correctedText:
    "关于进一步加强基层治理体系建设的通知\n\n各局、各直属单位：\n\n为深入贯彻落实党中央、国务院关于基层治理的决策部署，以进一步推动基层治理体系和治理能力现代化，现就有关事项通知如下：\n\n一、总体要求\n\n坚持以习近平新时代中国特色社会主义思想为指导，全面落实基层治理各项任务。到2025年底，全国基层治理水平显著提升，三个以上地级市完成基层治理示范创建。\n\n（一）完善组织体系\n\n各级人民政府要切实履行主体责任，加强基层治理组织体系建设。建立健全乡镇（街道）统筹协调机制，推动各类资源向基层倾斜。\n\n（二）强化人才保障\n\n加大基层人才引进力度，完善基层工作人员职业发展通道，确保基层「留得住、干得好」。\n\n二、重点任务\n\n（一）深化「放管服」改革\n\n持续推进简政放权，优化营商环境。对确需下放的事项，要确保基层接得住、管得好。\n\n（二）推进智慧治理\n\n运用大数据、云计算等技术手段，建设基层智慧治理平台，实现数据共享和业务协同。",
  errorCount: 7,
  errors: [
    {
      id: "e1",
      type: "数字",
      original: "3个",
      corrected: "三个",
      position: 168,
      description: "公文中概数应使用汉字数字「三个」",
    },
    {
      id: "e2",
      type: "错别字",
      original: "人名",
      corrected: "人民",
      position: 213,
      description: "「各级人名政府」应为「各级人民政府」，「名」为「民」之误",
    },
    {
      id: "e3",
      type: "错别字",
      original: "的住",
      corrected: "得住",
      position: 284,
      description: "「留的住」应为「留得住」，补语应用「得」",
    },
    {
      id: "e4",
      type: "错别字",
      original: "干的好",
      corrected: "干得好",
      position: 288,
      description: "「干的好」应为「干得好」，补语应用「得」",
    },
    {
      id: "e5",
      type: "标点",
      original: "接的住",
      corrected: "接得住",
      position: 355,
      description: "「接的住」应为「接得住」，补语应用「得」",
    },
    {
      id: "e6",
      type: "标点",
      original: "管的好",
      corrected: "管得好",
      position: 360,
      description: "「管的好」应为「管得好」，补语应用「得」",
    },
    {
      id: "e7",
      type: "标点",
      original: "管的好",
      corrected: "管得好。",
      position: 368,
      description: "句末缺少句号",
    },
  ],
}
