#!/usr/bin/env npx tsx
/**
 * Jaegerのトレース情報からサービス定義YAMLを自動生成するスクリプト
 *
 * 使用方法:
 *   npx tsx scripts/generate-from-jaeger.ts [options]
 *
 * オプション:
 *   --jaeger-url <url>  JaegerのURL (デフォルト: http://localhost:16686)
 *   --output <dir>      出力先ディレクトリ (デフォルト: ./services)
 *   --owner <name>      デフォルトのオーナー名 (デフォルト: unknown-team)
 *   --dry-run           実際にファイルを作成せずに確認
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

export interface JaegerDependency {
  parent: string
  child: string
  callCount: number
}

export interface ServiceDefinition {
  name: string
  description: string
  owner: string
  github: string
  dependencies: string[]
}

export interface Config {
  jaegerUrl: string
  outputDir: string
  defaultOwner: string
  dryRun: boolean
}

/**
 * コマンドライン引数をパース
 */
export function parseArgs(args: string[] = process.argv.slice(2)): Config {
  const config: Config = {
    jaegerUrl: 'http://localhost:16686',
    outputDir: './services',
    defaultOwner: 'unknown-team',
    dryRun: false,
  }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--jaeger-url':
        config.jaegerUrl = args[++i]
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
Jaegerからサービス定義YAMLを生成

使用方法:
  npx tsx scripts/generate-from-jaeger.ts [options]

オプション:
  --jaeger-url <url>  JaegerのURL (デフォルト: http://localhost:16686)
  --output <dir>      出力先ディレクトリ (デフォルト: ./services)
  --owner <name>      デフォルトのオーナー名 (デフォルト: unknown-team)
  --dry-run           実際にファイルを作成せずに確認
  --help              ヘルプを表示
`)
        process.exit(0)
    }
  }

  return config
}

/**
 * Jaegerからサービス一覧を取得
 */
export async function fetchServices(jaegerUrl: string): Promise<string[]> {
  const response = await fetch(`${jaegerUrl}/api/services`)
  if (!response.ok) {
    throw new Error(`Failed to fetch services: ${response.status} ${response.statusText}`)
  }
  const data = (await response.json()) as { data: string[] }
  return data.data.filter((s) => s !== 'jaeger-query') // Jaeger自身を除外
}

/**
 * Jaegerから依存関係を取得
 */
export async function fetchDependencies(jaegerUrl: string): Promise<JaegerDependency[]> {
  // 過去24時間の依存関係を取得
  const endTs = Date.now()
  const lookback = 24 * 60 * 60 * 1000 // 24時間

  const response = await fetch(`${jaegerUrl}/api/dependencies?endTs=${endTs}&lookback=${lookback}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch dependencies: ${response.status} ${response.statusText}`)
  }
  const data = (await response.json()) as { data: JaegerDependency[] }
  return data.data
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
 * 依存関係リストからマップを構築
 * 自己参照（parent === child）は除外する
 */
export function buildDependencyMap(dependencies: JaegerDependency[]): Map<string, Set<string>> {
  const dependencyMap = new Map<string, Set<string>>()
  for (const dep of dependencies) {
    // 自己参照は除外
    if (dep.parent === dep.child) {
      continue
    }
    if (!dependencyMap.has(dep.parent)) {
      dependencyMap.set(dep.parent, new Set())
    }
    dependencyMap.get(dep.parent)!.add(dep.child)
  }
  return dependencyMap
}

/**
 * サービス定義を生成
 */
export function buildServiceDefinitions(
  services: string[],
  dependencyMap: Map<string, Set<string>>,
  defaultOwner: string
): ServiceDefinition[] {
  return services.map((name) => ({
    name,
    description: `${name} サービス`,
    owner: defaultOwner,
    github: `https://github.com/example/${toFileName(name)}`,
    dependencies: Array.from(dependencyMap.get(name) || []),
  }))
}

/**
 * メイン処理
 */
async function main() {
  const config = parseArgs()

  console.log('🔍 Jaegerからサービス情報を取得中...')
  console.log(`   URL: ${config.jaegerUrl}`)

  let services: string[]
  let dependencies: JaegerDependency[]

  try {
    services = await fetchServices(config.jaegerUrl)
    console.log(`   ✓ ${services.length}件のサービスを検出`)
  } catch (error) {
    console.error(`❌ サービス一覧の取得に失敗: ${error}`)
    console.error('   Jaegerが起動しているか確認してください')
    process.exit(1)
  }

  try {
    dependencies = await fetchDependencies(config.jaegerUrl)
    console.log(`   ✓ ${dependencies.length}件の依存関係を検出`)
  } catch (error) {
    console.error(`⚠️  依存関係の取得に失敗: ${error}`)
    console.error('   依存関係なしで続行します')
    dependencies = []
  }

  // 依存関係をマップに変換してサービス定義を生成
  const dependencyMap = buildDependencyMap(dependencies)
  const serviceDefinitions = buildServiceDefinitions(services, dependencyMap, config.defaultOwner)

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
// テスト時はインポートのみ行われるため実行されない
const isDirectRun = process.argv[1]?.includes('generate-from-jaeger')
if (isDirectRun) {
  main().catch((error) => {
    console.error('エラー:', error)
    process.exit(1)
  })
}
