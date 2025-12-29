import type { Service } from '../types/service'
import { parseServiceYaml, validateService } from './yaml-parser'

/**
 * ロード結果の型
 */
export interface LoadResult {
  services: Service[]
  errors: Array<{
    fileName: string
    error: string
  }>
}

/**
 * サービスインデックスの型
 */
interface ServiceIndex {
  services: string[]
}

type FetchResult =
  | { service: Service }
  | { fileName: string; error: string }

/**
 * services/ フォルダからすべてのYAMLファイルを読み込む
 * S3デプロイ対応のためfetchを使用
 */
export async function loadAllServices(): Promise<LoadResult> {
  const services: Service[] = []
  const errors: Array<{ fileName: string; error: string }> = []

  try {
    // index.jsonからサービス一覧を取得
    const indexResponse = await fetch('/services/index.json')
    if (!indexResponse.ok) {
      throw new Error(`Failed to fetch service index: ${indexResponse.status}`)
    }

    const index: ServiceIndex = await indexResponse.json()

    // 各サービスファイルを並列で取得
    const fetchPromises = index.services.map(async (fileName): Promise<FetchResult> => {
      const serviceName = fileName.replace(/\.ya?ml$/, '')

      try {
        const response = await fetch(`/services/${fileName}`)
        if (!response.ok) {
          return { fileName, error: `HTTP ${response.status}` }
        }

        const content = await response.text()
        const parseResult = parseServiceYaml(content, serviceName)

        if (!parseResult.success) {
          return { fileName, error: parseResult.error }
        }

        const validationResult = validateService(parseResult.data)
        if (!validationResult.valid) {
          return { fileName, error: validationResult.errors.join(', ') }
        }

        return { service: parseResult.data }
      } catch (error) {
        const message = error instanceof Error ? error.message : '不明なエラー'
        return { fileName, error: message }
      }
    })

    const results = await Promise.all(fetchPromises)

    for (const result of results) {
      if ('service' in result) {
        services.push(result.service)
      } else {
        errors.push({ fileName: result.fileName, error: result.error })
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '不明なエラー'
    errors.push({ fileName: 'index.json', error: message })
  }

  return { services, errors }
}

/**
 * サービス名からサービスを検索
 */
export function findServiceByName(services: Service[], name: string): Service | undefined {
  return services.find((s) => s.name === name)
}
