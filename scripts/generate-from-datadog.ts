#!/usr/bin/env npx tsx
/**
 * Datadogのトレース情報からサービス定義YAMLを自動生成するスクリプト
 *
 * 使用方法:
 *   npx tsx scripts/generate-from-datadog.ts [options]
 *
 * オプション:
 *   --api-key <key>     Datadog APIキー (または環境変数 DD_API_KEY)
 *   --app-key <key>     Datadog Application Key (または環境変数 DD_APP_KEY)
 *   --site <site>       Datadogサイト (デフォルト: datadoghq.com)
 *   --env <env>         APM環境 (必須)
 *   --output <dir>      出力先ディレクトリ (デフォルト: ./services)
 *   --owner <name>      デフォルトのオーナー名 (デフォルト: unknown-team)
 *   --dry-run           実際にファイルを作成せずに確認
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

export interface DatadogServiceDependencies {
  [serviceName: string]: {
    calls: string[]
  }
}

export interface ServiceDefinition {
  name: string
  description: string
  owner: string
  github: string
  dependencies: string[]
}

export interface Config {
  apiKey: string
  appKey: string
  site: string
  env: string
  outputDir: string
  defaultOwner: string
  dryRun: boolean
}

/**
 * コマンドライン引数をパース
 */
export function parseArgs(args: string[] = process.argv.slice(2)): Config {
  const config: Config = {
    apiKey: process.env.DD_API_KEY || '',
    appKey: process.env.DD_APP_KEY || '',
    site: 'datadoghq.com',
    env: '',
    outputDir: './services',
    defaultOwner: 'unknown-team',
    dryRun: false,
  }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--api-key':
        config.apiKey = args[++i]
        break
      case '--app-key':
        config.appKey = args[++i]
        break
      case '--site':
        config.site = args[++i]
        break
      case '--env':
        config.env = args[++i]
        break
      case '--output':
        config.outputDir = args[++i]
        break
      case '--owner':
        config.defaultOwner = args[++i]
        break
      case '--dry-run':
        config.dryRun = true
        break
      case '--help':
        console.log(`
Datadogからサービス定義YAMLを生成

使用方法:
  npx tsx scripts/generate-from-datadog.ts [options]

オプション:
  --api-key <key>     Datadog APIキー (または環境変数 DD_API_KEY)
  --app-key <key>     Datadog Application Key (または環境変数 DD_APP_KEY)
  --site <site>       Datadogサイト (デフォルト: datadoghq.com)
                      例: datadoghq.com, datadoghq.eu, us3.datadoghq.com, us5.datadoghq.com
  --env <env>         APM環境 (必須、例: prod, staging)
  --output <dir>      出力先ディレクトリ (デフォルト: ./services)
  --owner <name>      デフォルトのオーナー名 (デフォルト: unknown-team)
  --dry-run           実際にファイルを作成せずに確認
  --help              ヘルプを表示

環境変数:
  DD_API_KEY          Datadog APIキー
  DD_APP_KEY          Datadog Application Key
`)
        process.exit(0)
    }
  }

  return config
}

/**
 * 設定のバリデーション
 */
export function validateConfig(config: Config): string[] {
  const errors: string[] = []
  if (!config.apiKey) {
    errors.push('APIキーが必要です (--api-key または DD_API_KEY)')
  }
  if (!config.appKey) {
    errors.push('Application Keyが必要です (--app-key または DD_APP_KEY)')
  }
  if (!config.env) {
    errors.push('環境が必要です (--env)')
  }
  return errors
}

/**
 * Datadogからサービス依存関係を取得
 */
export async function fetchServiceDependencies(
  config: Config
): Promise<DatadogServiceDependencies> {
  const url = `https://api.${config.site}/api/v1/service_dependencies?env=${encodeURIComponent(config.env)}`

  const response = await fetch(url, {
    headers: {
      'DD-API-KEY': config.apiKey,
      'DD-APPLICATION-KEY': config.appKey,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Failed to fetch service dependencies: ${response.status} ${response.statusText}\n${errorText}`
    )
  }

  const data = (await response.json()) as DatadogServiceDependencies
  return data
}

/**
 * サービス名をファイル名に変換
 */
export function toFileName(serviceName: string): string {
  return serviceName.toLowerCase().replace(/[^a-z0-9-]/g, '-')
}

/**
 * サービス定義をYAML形式に変換
 */
export function toYaml(service: ServiceDefinition): string {
  const lines = [
    `description: ${service.description}`,
    `owner: ${service.owner}`,
    `github: ${service.github}`,
  ]

  if (service.dependencies.length === 0) {
    lines.push('dependencies: []')
  } else {
    lines.push('dependencies:')
    for (const dep of service.dependencies) {
      lines.push(`  - ${dep}`)
    }
  }

  return `${lines.join('\n')}\n`
}

/**
 * サービス定義を生成
 */
export function buildServiceDefinitions(
  dependencies: DatadogServiceDependencies,
  defaultOwner: string
): ServiceDefinition[] {
  const serviceNames = Object.keys(dependencies)

  return serviceNames.map((name) => ({
    name,
    description: `${name} サービス`,
    owner: defaultOwner,
    github: `https://github.com/example/${toFileName(name)}`,
    dependencies: dependencies[name]?.calls || [],
  }))
}

/**
 * メイン処理
 */
async function main() {
  const config = parseArgs()

  // バリデーション
  const errors = validateConfig(config)
  if (errors.length > 0) {
    console.error('❌ 設定エラー:')
    for (const error of errors) {
      console.error(`   - ${error}`)
    }
    process.exit(1)
  }

  console.log('🔍 Datadogからサービス情報を取得中...')
  console.log(`   Site: ${config.site}`)
  console.log(`   Environment: ${config.env}`)

  let dependencies: DatadogServiceDependencies

  try {
    dependencies = await fetchServiceDependencies(config)
    const serviceCount = Object.keys(dependencies).length
    console.log(`   ✓ ${serviceCount}件のサービスを検出`)
  } catch (error) {
    console.error(`❌ サービス情報の取得に失敗: ${error}`)
    process.exit(1)
  }

  // サービス定義を生成
  const serviceDefinitions = buildServiceDefinitions(dependencies, config.defaultOwner)

  console.log('\n📝 生成されるサービス定義:')
  for (const service of serviceDefinitions) {
    const deps = service.dependencies.length > 0 ? ` → ${service.dependencies.join(', ')}` : ''
    console.log(`   - ${service.name}${deps}`)
  }

  if (config.dryRun) {
    console.log('\n🔸 --dry-run モードのため、ファイルは作成されません')
    return
  }

  // 出力ディレクトリを作成
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true })
  }

  // YAMLファイルを生成
  console.log(`\n📁 ${config.outputDir} にファイルを生成中...`)
  let created = 0
  let skipped = 0

  for (const service of serviceDefinitions) {
    const fileName = `${toFileName(service.name)}.yml`
    const filePath = path.join(config.outputDir, fileName)

    if (fs.existsSync(filePath)) {
      console.log(`   ⏭️  ${fileName} (既存のためスキップ)`)
      skipped++
      continue
    }

    const yaml = toYaml(service)
    fs.writeFileSync(filePath, yaml)
    console.log(`   ✓ ${fileName}`)
    created++
  }

  console.log(`\n✅ 完了: ${created}件作成, ${skipped}件スキップ`)
}

// CLIとして直接実行された場合のみmainを実行
const isDirectRun = process.argv[1]?.includes('generate-from-datadog')
if (isDirectRun) {
  main().catch((error) => {
    console.error('エラー:', error)
    process.exit(1)
  })
}
