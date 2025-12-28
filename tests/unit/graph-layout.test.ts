import { describe, expect, it } from 'vitest'
import type { Service } from '../../src/types/service'
import { calculateLayout, dependenciesToEdges, servicesToNodes } from '../../src/utils/graph-layout'

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

describe('servicesToNodes', () => {
  it('サービスをノードに変換できる', () => {
    const nodes = servicesToNodes(mockServices)

    expect(nodes).toHaveLength(4)
    expect(nodes[0].id).toBe('api-gateway')
    expect(nodes[0].type).toBe('service')
    expect(nodes[0].data).toEqual(mockServices[0])
  })

  it('各ノードにposition属性がある', () => {
    const nodes = servicesToNodes(mockServices)

    for (const node of nodes) {
      expect(node.position).toBeDefined()
      expect(typeof node.position.x).toBe('number')
      expect(typeof node.position.y).toBe('number')
    }
  })

  it('空のサービス配列の場合は空のノード配列を返す', () => {
    const nodes = servicesToNodes([])
    expect(nodes).toHaveLength(0)
  })
})

describe('dependenciesToEdges', () => {
  it('依存関係をエッジに変換できる', () => {
    const edges = dependenciesToEdges(mockServices)

    // api-gateway -> user-service, order-service (2)
    // user-service -> database (1)
    // order-service -> database, user-service (2)
    // database -> none (0)
    expect(edges).toHaveLength(5)
  })

  it('各エッジにsourceとtargetがある', () => {
    const edges = dependenciesToEdges(mockServices)

    for (const edge of edges) {
      expect(edge.source).toBeDefined()
      expect(edge.target).toBeDefined()
      expect(typeof edge.source).toBe('string')
      expect(typeof edge.target).toBe('string')
    }
  })

  it('エッジのtypeがdependencyである', () => {
    const edges = dependenciesToEdges(mockServices)

    for (const edge of edges) {
      expect(edge.type).toBe('dependency')
    }
  })

  it('エッジIDはユニークである', () => {
    const edges = dependenciesToEdges(mockServices)
    const ids = edges.map((e) => e.id)
    const uniqueIds = new Set(ids)

    expect(uniqueIds.size).toBe(ids.length)
  })

  it('依存関係がないサービスのみの場合は空配列を返す', () => {
    const services: Service[] = [
      {
        name: 'standalone',
        description: '独立サービス',
        owner: 'team',
        github: 'https://github.com/example/standalone',
        dependencies: [],
      },
    ]
    const edges = dependenciesToEdges(services)
    expect(edges).toHaveLength(0)
  })
})

describe('calculateLayout', () => {
  it('dagreでレイアウト計算ができる', () => {
    const nodes = servicesToNodes(mockServices)
    const edges = dependenciesToEdges(mockServices)
    const result = calculateLayout(nodes, edges)

    expect(result.nodes).toHaveLength(4)
    expect(result.edges).toHaveLength(5)
  })

  it('レイアウト後のノードは異なる位置を持つ', () => {
    const nodes = servicesToNodes(mockServices)
    const edges = dependenciesToEdges(mockServices)
    const result = calculateLayout(nodes, edges)

    const positions = result.nodes.map((n) => `${n.position.x},${n.position.y}`)
    const uniquePositions = new Set(positions)

    // 少なくとも2つの異なる位置があるはず（完全に同じ位置は避ける）
    expect(uniquePositions.size).toBeGreaterThan(1)
  })

  it('空の入力でも正常に動作する', () => {
    const result = calculateLayout([], [])

    expect(result.nodes).toHaveLength(0)
    expect(result.edges).toHaveLength(0)
  })
})
