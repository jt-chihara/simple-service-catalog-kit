import type { Service } from '../types/service'

/**
 * 指定したサービスの依存先一覧を取得
 */
export function getDependencies(serviceName: string, services: Service[]): string[] {
  const service = services.find((s) => s.name === serviceName)
  return service?.dependencies ?? []
}

/**
 * 指定したサービスの被依存元一覧を取得
 * （このサービスに依存しているサービス）
 */
export function getDependents(serviceName: string, services: Service[]): string[] {
  return services.filter((s) => s.dependencies.includes(serviceName)).map((s) => s.name)
}
