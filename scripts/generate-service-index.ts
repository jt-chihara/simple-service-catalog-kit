#!/usr/bin/env npx tsx
/**
 * services/index.json を生成するスクリプト
 *
 * S3デプロイ時に、サービス一覧を動的に取得するために使用
 *
 * 使用方法:
 *   npx tsx scripts/generate-service-index.ts [options]
 *
 * オプション:
 *   --input <dir>   サービス定義ディレクトリ (デフォルト: ./services)
 *   --output <file> 出力ファイルパス (デフォルト: ./services/index.json)
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

export interface Config {
  inputDir: string
  outputFile: string
}

/**
 * コマンドライン引数をパース
 */
export function parseArgs(args: string[] = process.argv.slice(2)): Config {
  const config: Config = {
    inputDir: './services',
    outputFile: './services/index.json',
  }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--input':
        config.inputDir = args[++i]
        break
      case '--output':
        config.outputFile = args[++i]
        break
      case '--help':
        console.log(`
services/index.json を生成

使用方法:
  npx tsx scripts/generate-service-index.ts [options]

オプション:
  --input <dir>   サービス定義ディレクトリ (デフォルト: ./services)
  --output <file> 出力ファイルパス (デフォルト: ./services/index.json)
  --help          ヘルプを表示
`)
        process.exit(0)
    }
  }

  return config
}

/**
 * ファイル一覧からYAMLファイルのみを抽出
 */
export function getServiceFiles(files: string[]): string[] {
  return files.filter((f) => /\.ya?ml$/.test(f)).sort()
}

/**
 * サービスインデックスJSONを生成
 */
export function generateIndex(files: string[]): string {
  return JSON.stringify({ services: files }, null, 2)
}

/**
 * メイン処理
 */
async function main() {
  const config = parseArgs()

  console.log('📁 サービスインデックスを生成中...')
  console.log(`   入力: ${config.inputDir}`)
  console.log(`   出力: ${config.outputFile}`)

  // ディレクトリの存在確認
  if (!fs.existsSync(config.inputDir)) {
    console.error(`❌ ディレクトリが見つかりません: ${config.inputDir}`)
    process.exit(1)
  }

  // ファイル一覧を取得
  const allFiles = fs.readdirSync(config.inputDir)
  const serviceFiles = getServiceFiles(allFiles)

  console.log(`   ✓ ${serviceFiles.length}件のサービスファイルを検出`)

  // インデックスを生成
  const indexJson = generateIndex(serviceFiles)

  // ファイルに書き込み
  const outputDir = path.dirname(config.outputFile)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  fs.writeFileSync(config.outputFile, indexJson)
  console.log(`✅ 完了: ${config.outputFile}`)
}

// CLIとして直接実行された場合のみmainを実行
const isDirectRun = process.argv[1]?.includes('generate-service-index')
if (isDirectRun) {
  main().catch((error) => {
    console.error('エラー:', error)
    process.exit(1)
  })
}
