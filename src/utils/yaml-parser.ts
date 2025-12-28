import yaml from 'js-yaml'
import type { Service } from '../types/service'

/**
 * パース結果の型
 */
export type ParseResult<T> = { success: true; data: T } | { success: false; error: string }

/**
 * バリデーション結果の型
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * GitHub URLのバリデーション
 */
export function validateGithubUrl(url: string): boolean {
  if (!url) return false
  return /^https:\/\/github\.com\/.+/.test(url)
}

/**
 * サービス名のバリデーション
 * 英数字、ハイフン、アンダースコアのみ許可（1-50文字）
 */
export function validateServiceName(name: string): boolean {
  if (!name) return false
  if (name.length > 50) return false
  return /^[a-zA-Z0-9_-]+$/.test(name)
}

/**
 * YAMLコンテンツをパースしてServiceオブジェクトを返す
 */
export function parseServiceYaml(content: string, serviceName: string): ParseResult<Service> {
  try {
    const parsed = yaml.load(content) as Record<string, unknown>

    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'YAMLパースエラー: 有効なオブジェクトではありません' }
    }

    const service: Service = {
      name: serviceName,
      description: String(parsed.description ?? ''),
      owner: String(parsed.owner ?? ''),
      github: String(parsed.github ?? ''),
      dependencies: Array.isArray(parsed.dependencies) ? parsed.dependencies.map(String) : [],
    }

    return { success: true, data: service }
  } catch (error) {
    const message = error instanceof Error ? error.message : '不明なエラー'
    return { success: false, error: `YAMLパースエラー: ${message}` }
  }
}

/**
 * Serviceオブジェクトのバリデーション
 */
export function validateService(service: Service): ValidationResult {
  const errors: string[] = []

  // 必須フィールドのチェック
  if (!service.description || service.description.trim() === '') {
    errors.push('description: 必須フィールドです')
  } else if (service.description.length > 500) {
    errors.push('description: 500文字以内で入力してください')
  }

  if (!service.owner || service.owner.trim() === '') {
    errors.push('owner: 必須フィールドです')
  } else if (service.owner.length > 100) {
    errors.push('owner: 100文字以内で入力してください')
  }

  if (!service.github || service.github.trim() === '') {
    errors.push('github: 必須フィールドです')
  } else if (!validateGithubUrl(service.github)) {
    errors.push('github: https://github.com/ で始まるURLを入力してください')
  }

  if (!validateServiceName(service.name)) {
    errors.push('name: 英数字、ハイフン、アンダースコアのみ使用可能です（1-50文字）')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
