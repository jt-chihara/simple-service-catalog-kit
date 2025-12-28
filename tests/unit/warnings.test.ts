import { describe, expect, it } from 'vitest'
import type { Service } from '../../src/types/service'
import { detectMissingReferences } from '../../src/utils/warning-detector'

describe('detectMissingReferences', () => {
  it('存在しないサービスへの参照を検出する', () => {
    const services: Service[] = [
      {
        name: 'api-gateway',
        description: 'APIゲートウェイ',
        owner: 'team',
        github: 'https://github.com/example/api',
        dependencies: ['user-service', 'non-existent-service'],
      },
      {
        name: 'user-service',
        description: 'ユーザーサービス',
        owner: 'team',
        github: 'https://github.com/example/user',
        dependencies: [],
      },
    ]

    const warnings = detectMissingReferences(services)

    expect(warnings).toHaveLength(1)
    expect(warnings[0].type).toBe('missing')
    expect(warnings[0].services).toContain('non-existent-service')
    expect(warnings[0].message).toContain('non-existent-service')
  })

  it('複数の未定義参照を検出する', () => {
    const services: Service[] = [
      {
        name: 'api-gateway',
        description: 'APIゲートウェイ',
        owner: 'team',
        github: 'https://github.com/example/api',
        dependencies: ['missing-1', 'missing-2'],
      },
    ]

    const warnings = detectMissingReferences(services)

    expect(warnings).toHaveLength(2)
    expect(warnings.every((w) => w.type === 'missing')).toBe(true)
  })

  it('すべての参照が存在する場合は警告なし', () => {
    const services: Service[] = [
      {
        name: 'api-gateway',
        description: 'APIゲートウェイ',
        owner: 'team',
        github: 'https://github.com/example/api',
        dependencies: ['user-service'],
      },
      {
        name: 'user-service',
        description: 'ユーザーサービス',
        owner: 'team',
        github: 'https://github.com/example/user',
        dependencies: [],
      },
    ]

    const warnings = detectMissingReferences(services)

    expect(warnings).toHaveLength(0)
  })

  it('空のサービス配列では警告なし', () => {
    const warnings = detectMissingReferences([])

    expect(warnings).toHaveLength(0)
  })

  it('警告メッセージに参照元サービス名を含む', () => {
    const services: Service[] = [
      {
        name: 'api-gateway',
        description: 'APIゲートウェイ',
        owner: 'team',
        github: 'https://github.com/example/api',
        dependencies: ['missing-service'],
      },
    ]

    const warnings = detectMissingReferences(services)

    expect(warnings[0].message).toContain('api-gateway')
  })
})
