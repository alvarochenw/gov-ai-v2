/**
 * .docx 文件解析(纯前端,基于 mammoth 浏览器构建)。
 * 仅会话内使用,不持久化。
 *
 * mammoth 在 Next.js 客户端用动态 import 加载,避免构建期对 Node 内置模块的静态分析报错。
 */

/** 从 .docx File 提取纯文本。非 .docx 或损坏文件抛明确错误。 */
export async function extractDocxText(file: File): Promise<string> {
  const lower = file.name.toLowerCase()
  if (!lower.endsWith(".docx")) {
    throw new Error("仅支持 .docx 格式(旧版 .doc 请先另存为 .docx)")
  }
  // 动态 import:避免 Next.js 构建期对 mammoth 的 Node 依赖做静态分析
  const mammoth = await import("mammoth")
  const arrayBuffer = await file.arrayBuffer()
  try {
    const result = await mammoth.extractRawText({ arrayBuffer })
    const text = (result.value ?? "").trim()
    if (!text) throw new Error("文件内容为空,无法提取文本")
    return text
  } catch (err) {
    if (err instanceof Error && err.message.includes("文件内容为空")) throw err
    throw new Error("解析 .docx 失败,文件可能已损坏或格式不规范")
  }
}
