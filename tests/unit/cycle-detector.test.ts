import { describe, expect, it } from 'vitest'
import type { Service } from '../../src/types/service'
import { detectCycles } from '../../src/utils/cycle-detector'

describe('detectCycles', () => {
  it('循環依存を検出できる', () => {
    const services: Service[] = [
      {
        name: 'service-a',
        description: 'サービスA',
        owner: 'team',
        github: 'https://github.com/example/a',
        dependencies: ['service-b'],
      },
      {
        name: 'service-b',
        description: 'サービスB',
        owner: 'team',
        github: 'https://github.com/example/b',
        dependencies: ['service-a'], // 循環: A -> B -> A
      },
    ]

    const warnings = detectCycles(services)

    expect(warnings).toHaveLength(1)
    expect(warnings[0].type).toBe('cycle')
    expect(warnings[0].services).toContain('service-a')
    expect(warnings[0].services).toContain('service-b')
  })

  it('循環がない場合は空配列を返す', () => {
    const services: Service[] = [
      {
        name: 'service-a',
        description: 'サービスA',
        owner: 'team',
        github: 'https://github.com/example/a',
        dependencies: ['service-b'],
      },
      {
        name: 'service-b',
        description: 'サービスB',
        owner: 'team',
        github: 'https://github.com/example/b',
        dependencies: ['service-c'],
      },
      {
        name: 'service-c',
        description: 'サービスC',
        owner: 'team',
        github: 'https://github.com/example/c',
        dependencies: [],
      },
    ]

    const warnings = detectCycles(services)

    expect(warnings).toHaveLength(0)
  })

  it('複数の循環を検出できる', () => {
    const services: Service[] = [
      {
        name: 'a',
        description: 'A',
        owner: 'team',
        github: 'https://github.com/example/a',
        dependencies: ['b'],
      },
      {
        name: 'b',
        description: 'B',
        owner: 'team',
        github: 'https://github.com/example/b',
        dependencies: ['a'], // 循環1: A <-> B
      },
      {
        name: 'x',
        description: 'X',
        owner: 'team',
        github: 'https://github.com/example/x',
        dependencies: ['y'],
      },
      {
        name: 'y',
        description: 'Y',
        owner: 'team',
        github: 'https://github.com/example/y',
        dependencies: ['z'],
      },
      {
        name: 'z',
        description: 'Z',
        owner: 'team',
        github: 'https://github.com/example/z',
        dependencies: ['x'], // 循環2: X -> Y -> Z -> X
      },
    ]

    const warnings = detectCycles(services)

    // 循環に関与するサービスが検出される
    expect(warnings.length).toBeGreaterThan(0)
    expect(warnings.every((w) => w.type === 'cycle')).toBe(true)
  })

  it('自己参照（自分自身への依存）を検出できる', () => {
    const services: Service[] = [
      {
        name: 'self-ref',
        description: '自己参照',
        owner: 'team',
        github: 'https://github.com/example/self',
        dependencies: ['self-ref'], // 自分自身に依存
      },
    ]

    const warnings = detectCycles(services)

    expect(warnings).toHaveLength(1)
    expect(warnings[0].type).toBe('cycle')
    expect(warnings[0].services).toContain('self-ref')
  })

  it('3つ以上のサービスによる循環を検出できる', () => {
    const services: Service[] = [
      {
        name: 'a',
        description: 'A',
        owner: 'team',
        github: 'https://github.com/example/a',
        dependencies: ['b'],
      },
      {
        name: 'b',
        description: 'B',
        owner: 'team',
        github: 'https://github.com/example/b',
        dependencies: ['c'],
      },
      {
        name: 'c',
        description: 'C',
        owner: 'team',
        github: 'https://github.com/example/c',
        dependencies: ['a'], // A -> B -> C -> A
      },
    ]

    const warnings = detectCycles(services)

    expect(warnings).toHaveLength(1)
    expect(warnings[0].type).toBe('cycle')
    expect(warnings[0].services).toHaveLength(3)
  })

  it('空のサービス配列では警告なし', () => {
    const warnings = detectCycles([])
    expect(warnings).toHaveLength(0)
  })

  it('存在しない依存先は循環としてカウントしない', () => {
    const services: Service[] = [
      {
        name: 'service-a',
        description: 'サービスA',
        owner: 'team',
        github: 'https://github.com/example/a',
        dependencies: ['non-existent'], // 存在しないサービスへの依存
      },
    ]

    const warnings = detectCycles(services)

    // 循環ではないので警告なし（存在しない依存は別の警告タイプ）
    expect(warnings.filter((w) => w.type === 'cycle')).toHaveLength(0)
  })
})
