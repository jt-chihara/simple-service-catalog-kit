import { describe, expect, it } from 'vitest'
import type { Service } from '../../src/types/service'
import { getDependencies, getDependents } from '../../src/utils/dependency-analyzer'

const mockServices: Service[] = [
  {
    name: 'api-gateway',
    description: 'APIゲートウェイ',
    owner: 'platform-team',
    github: 'https://github.com/example/api-gateway',
    dependencies: ['user-service', 'order-service'],
  },
  {
    name: 'user-service',
    description: 'ユーザーサービス',
    owner: 'user-team',
    github: 'https://github.com/example/user-service',
    dependencies: ['database'],
  },
  {
    name: 'order-service',
    description: '注文サービス',
    owner: 'order-team',
    github: 'https://github.com/example/order-service',
    dependencies: ['database', 'user-service'],
  },
  {
    name: 'database',
    description: 'データベース',
    owner: 'infra-team',
    github: 'https://github.com/example/database',
    dependencies: [],
  },
]

describe('getDependencies', () => {
  it('サービスの依存先一覧を取得できる', () => {
    const deps = getDependencies('api-gateway', mockServices)
    expect(deps).toEqual(['user-service', 'order-service'])
  })

  it('依存先がない場合は空配列を返す', () => {
    const deps = getDependencies('database', mockServices)
    expect(deps).toEqual([])
  })

  it('存在しないサービスの場合は空配列を返す', () => {
    const deps = getDependencies('non-existent', mockServices)
    expect(deps).toEqual([])
  })
})

describe('getDependents', () => {
  it('サービスの被依存元一覧を取得できる', () => {
    const dependents = getDependents('user-service', mockServices)
    expect(dependents).toContain('api-gateway')
    expect(dependents).toContain('order-service')
    expect(dependents).toHaveLength(2)
  })

  it('被依存元がない場合は空配列を返す', () => {
    const dependents = getDependents('api-gateway', mockServices)
    expect(dependents).toEqual([])
  })

  it('databaseの被依存元を正しく取得できる', () => {
    const dependents = getDependents('database', mockServices)
    expect(dependents).toContain('user-service')
    expect(dependents).toContain('order-service')
    expect(dependents).toHaveLength(2)
  })

  it('存在しないサービスの場合は空配列を返す', () => {
    const dependents = getDependents('non-existent', mockServices)
    expect(dependents).toEqual([])
  })
})
