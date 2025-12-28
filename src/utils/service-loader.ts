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
 * services/ フォルダからすべてのYAMLファイルを読み込む
 * Vite glob importを使用
 */
export async function loadAllServices(): Promise<LoadResult> {
  const services: Service[] = []
  const errors: Array<{ fileName: string; error: string }> = []

  // Vite glob importでYAMLファイルを読み込む
  const yamlModules = import.meta.glob('/services/*.yml', {
    query: '?raw',
    import: 'default',
  })

  for (const [path, loader] of Object.entries(yamlModules)) {
    // ファイル名からサービス名を抽出（例: /services/user-service.yml → user-service）
    const fileName = path.split('/').pop() ?? ''
    const serviceName = fileName.replace(/\.ya?ml$/, '')

    try {
      const content = (await loader()) as string
      const parseResult = parseServiceYaml(content, serviceName)

      if (!parseResult.success) {
        errors.push({ fileName, error: parseResult.error })
        continue
      }

      const validationResult = validateService(parseResult.data)
      if (!validationResult.valid) {
        errors.push({
          fileName,
          error: validationResult.errors.join(', '),
        })
        continue
      }

      services.push(parseResult.data)
    } catch (error) {
      const message = error instanceof Error ? error.message : '不明なエラー'
      errors.push({ fileName, error: message })
    }
  }

  return { services, errors }
}

/**
 * サービス名からサービスを検索
 */
export function findServiceByName(services: Service[], name: string): Service | undefined {
  return services.find((s) => s.name === name)
}
