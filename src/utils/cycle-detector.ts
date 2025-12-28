import type { Service, Warning } from '../types/service'

/**
 * 深さ優先探索で循環を検出
 * Kahn's algorithmの代わりにDFSベースの循環検出を使用
 */
export function detectCycles(services: Service[]): Warning[] {
  if (services.length === 0) {
    return []
  }

  const serviceMap = new Map<string, Service>()
  for (const service of services) {
    serviceMap.set(service.name, service)
  }

  const visited = new Set<string>()
  const recursionStack = new Set<string>()
  const cycleNodes = new Set<string>()

  function dfs(nodeName: string, path: string[]): boolean {
    visited.add(nodeName)
    recursionStack.add(nodeName)

    const service = serviceMap.get(nodeName)
    if (!service) {
      recursionStack.delete(nodeName)
      return false
    }

    for (const dep of service.dependencies) {
      // 存在しない依存先はスキップ（循環ではない）
      if (!serviceMap.has(dep)) {
        continue
      }

      if (!visited.has(dep)) {
        if (dfs(dep, [...path, nodeName])) {
          return true
        }
      } else if (recursionStack.has(dep)) {
        // 循環を検出
        const cycleStartIndex = path.indexOf(dep)
        const cycleMembers = cycleStartIndex >= 0 ? path.slice(cycleStartIndex) : path
        cycleMembers.push(nodeName)
        for (const member of cycleMembers) {
          cycleNodes.add(member)
        }
        cycleNodes.add(dep)
        return true
      }
    }

    recursionStack.delete(nodeName)
    return false
  }

  // 全ノードからDFSを開始
  for (const service of services) {
    if (!visited.has(service.name)) {
      dfs(service.name, [])
    }
  }

  if (cycleNodes.size === 0) {
    return []
  }

  // 循環に参加しているノードをまとめて1つの警告として返す
  return [
    {
      type: 'cycle',
      message: `循環依存が検出されました: ${Array.from(cycleNodes).join(' → ')}`,
      services: Array.from(cycleNodes),
    },
  ]
}
