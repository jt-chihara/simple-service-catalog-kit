import { describe, expect, it } from 'vitest'
import type { Service } from '../../src/types/service'
import { parseServiceYaml, validateService } from '../../src/utils/yaml-parser'

describe('parseServiceYaml', () => {
  it('正常なYAMLファイルをパースできる', () => {
    const yaml = `
description: ユーザー認証・管理を担当するサービス
owner: platform-team
github: https://github.com/example/user-service
dependencies:
  - database-service
  - cache-service
`
    const result = parseServiceYaml(yaml, 'user-service')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('user-service')
      expect(result.data.description).toBe('ユーザー認証・管理を担当するサービス')
      expect(result.data.owner).toBe('platform-team')
      expect(result.data.github).toBe('https://github.com/example/user-service')
      expect(result.data.dependencies).toEqual(['database-service', 'cache-service'])
    }
  })

  it('依存関係がない場合は空配列を返す', () => {
    const yaml = `
description: 基盤サービス
owner: infra-team
github: https://github.com/example/base-service
`
    const result = parseServiceYaml(yaml, 'base-service')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.dependencies).toEqual([])
    }
  })

  it('不正なYAML構文でエラーメッセージを返す', () => {
    const yaml = `
description: テスト
owner: team
github: https://github.com/example/test
dependencies:
  - item1
  item2  # インデントエラー
`
    const result = parseServiceYaml(yaml, 'test-service')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('YAML')
    }
  })

  it('複数の依存関係を正しく認識する', () => {
    const yaml = `
description: APIゲートウェイ
owner: platform-team
github: https://github.com/example/api-gateway
dependencies:
  - user-service
  - order-service
  - payment-service
  - notification-service
`
    const result = parseServiceYaml(yaml, 'api-gateway')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.dependencies).toHaveLength(4)
      expect(result.data.dependencies).toContain('user-service')
      expect(result.data.dependencies).toContain('order-service')
      expect(result.data.dependencies).toContain('payment-service')
      expect(result.data.dependencies).toContain('notification-service')
    }
  })
})

describe('validateService', () => {
  it('有効なサービスはバリデーションを通過する', () => {
    const service: Service = {
      name: 'valid-service',
      description: '有効なサービス',
      owner: 'team',
      github: 'https://github.com/example/valid-service',
      dependencies: [],
    }

    const result = validateService(service)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('必須フィールド欠落でバリデーションエラー', () => {
    const service: Service = {
      name: 'invalid-service',
      description: '', // 空文字列は必須フィールド欠落とみなす
      owner: 'team',
      github: 'https://github.com/example/invalid-service',
      dependencies: [],
    }

    const result = validateService(service)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('GitHubURL形式のバリデーション', () => {
    const service: Service = {
      name: 'invalid-github',
      description: 'テスト',
      owner: 'team',
      github: 'https://gitlab.com/example/repo', // GitLabはNG
      dependencies: [],
    }

    const result = validateService(service)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('github'))).toBe(true)
  })

  it('サービス名の形式バリデーション', () => {
    const service: Service = {
      name: 'Invalid Service Name!', // スペースと特殊文字はNG
      description: 'テスト',
      owner: 'team',
      github: 'https://github.com/example/repo',
      dependencies: [],
    }

    const result = validateService(service)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('name'))).toBe(true)
  })
})
