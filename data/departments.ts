/**
 * 部门/组织树 mock 数据 + 权限持久化(localStorage)。
 * 用于后台「设置智能体权限」弹窗的左栏部门列表。
 */

export interface DepartmentNode {
  id: string
  name: string
  /** 子部门;无则为空数组 */
  children?: DepartmentNode[]
}

/** 部门树(含一级部门及其下属)。 */
export const departmentTree: DepartmentNode[] = [
  {
    id: "dept-gov-ai",
    name: "政务一体机",
    children: [
      { id: "dept-gov-ai-office", name: "办公室" },
      { id: "dept-gov-ai-policy", name: "政策研究室" },
      { id: "dept-gov-ai-secretariat", name: "秘书处" },
    ],
  },
  {
    id: "dept-test-1",
    name: "测试1级部门",
    children: [
      { id: "dept-test-1-a", name: "测试1级-A科室" },
      { id: "dept-test-1-b", name: "测试1级-B科室" },
    ],
  },
  { id: "dept-3", name: "部门3" },
  { id: "dept-4", name: "综合业务部" },
  { id: "dept-5", name: "信息中心" },
  { id: "dept-6", name: "督查室" },
  { id: "dept-7", name: "信访办" },
  { id: "dept-8", name: "机关党委" },
]

/* ------------------------------------------------------------------ */
/*  Flatten / lookup helpers                                          */
/* ------------------------------------------------------------------ */

/** 深度优先铺平部门树,返回所有节点。 */
export function flattenDepartments(nodes: DepartmentNode[]): DepartmentNode[] {
  const out: DepartmentNode[] = []
  const walk = (ns: DepartmentNode[]) => {
    for (const n of ns) {
      out.push(n)
      if (n.children?.length) walk(n.children)
    }
  }
  walk(nodes)
  return out
}

/** id → 节点 映射。 */
export function buildDeptMap(nodes: DepartmentNode[]): Map<string, DepartmentNode> {
  const map = new Map<string, DepartmentNode>()
  for (const n of flattenDepartments(nodes)) map.set(n.id, n)
  return map
}

/* ------------------------------------------------------------------ */
/*  权限持久化                                                         */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "gov-ai-v2:template-permissions"

/** 读取全部模板权限映射 { [templateId]: deptId[] }。 */
export function loadTemplatePermissions(): Record<string, string[]> {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

/** 读取单个模板已授权部门 id 列表。 */
export function loadPermissionsFor(templateId: string): string[] {
  return loadTemplatePermissions()[templateId] ?? []
}

/** 写入单个模板的授权部门 id 列表。 */
export function savePermissionsFor(templateId: string, deptIds: string[]): void {
  if (typeof window === "undefined") return
  const all = loadTemplatePermissions()
  all[templateId] = deptIds
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    /* quota / privacy mode — 静默忽略 */
  }
}
