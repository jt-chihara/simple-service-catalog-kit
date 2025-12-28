import type { Service, Warning } from '../types/service'

/**
 * 存在しないサービスへの参照を検出
 */
export function detectMissingReferences(services: Service[]): Warning[] {
  const serviceNames = new Set(services.map((s) => s.name))
  const warnings: Warning[] = []

  for (const service of services) {
    for (const dep of service.dependencies) {
      if (!serviceNames.has(dep)) {
        warnings.push({
          type: 'missing',
          message: `${service.name} が参照する ${dep} は存在しません`,
          services: [dep],
        })
      }
    }
  }

  return warnings
}
