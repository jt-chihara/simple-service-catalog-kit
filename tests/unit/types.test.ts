import { describe, expect, it } from 'vitest'
import type {
  Dependency,
  DependencyEdge,
  Service,
  ServiceGraph,
  ServiceNode,
  Warning,
} from '../../src/types/service'

describe('Service type', () => {
  it('should have required fields', () => {
    const service: Service = {
      name: 'user-service',
      description: 'ユーザー認証・管理を担当するサービス',
      owner: 'platform-team',
      github: 'https://github.com/example/user-service',
      dependencies: ['database-service', 'cache-service'],
    }

    expect(service.name).toBe('user-service')
    expect(service.description).toBe('ユーザー認証・管理を担当するサービス')
    expect(service.owner).toBe('platform-team')
    expect(service.github).toBe('https://github.com/example/user-service')
    expect(service.dependencies).toEqual(['database-service', 'cache-service'])
  })

  it('should allow empty dependencies array', () => {
    const service: Service = {
      name: 'base-service',
      description: '基盤サービス',
      owner: 'infra-team',
      github: 'https://github.com/example/base-service',
      dependencies: [],
    }

    expect(service.dependencies).toEqual([])
  })
})

describe('Dependency type', () => {
  it('should represent a directed relationship', () => {
    const dependency: Dependency = {
      source: 'api-gateway',
      target: 'user-service',
    }

    expect(dependency.source).toBe('api-gateway')
    expect(dependency.target).toBe('user-service')
  })
})

describe('Warning type', () => {
  it('should represent a cycle warning', () => {
    const warning: Warning = {
      type: 'cycle',
      message: '循環依存が検出されました: A → B → C → A',
      services: ['A', 'B', 'C'],
    }

    expect(warning.type).toBe('cycle')
    expect(warning.services).toHaveLength(3)
  })

  it('should represent a missing reference warning', () => {
    const warning: Warning = {
      type: 'missing',
      message: '存在しないサービスへの参照: unknown-service',
      services: ['unknown-service'],
    }

    expect(warning.type).toBe('missing')
    expect(warning.services).toContain('unknown-service')
  })
})

describe('ServiceNode type', () => {
  it('should have React Flow compatible structure', () => {
    const node: ServiceNode = {
      id: 'user-service',
      type: 'service',
      data: {
        name: 'user-service',
        description: 'ユーザー認証・管理',
        owner: 'platform-team',
        github: 'https://github.com/example/user-service',
        dependencies: [],
      },
      position: { x: 0, y: 0 },
    }

    expect(node.id).toBe('user-service')
    expect(node.type).toBe('service')
    expect(node.data.name).toBe('user-service')
    expect(node.position).toEqual({ x: 0, y: 0 })
  })
})

describe('DependencyEdge type', () => {
  it('should have React Flow compatible structure', () => {
    const edge: DependencyEdge = {
      id: 'api-gateway->user-service',
      source: 'api-gateway',
      target: 'user-service',
      type: 'dependency',
      animated: false,
    }

    expect(edge.id).toBe('api-gateway->user-service')
    expect(edge.source).toBe('api-gateway')
    expect(edge.target).toBe('user-service')
    expect(edge.type).toBe('dependency')
    expect(edge.animated).toBe(false)
  })

  it('should support animated flag for cycle warnings', () => {
    const edge: DependencyEdge = {
      id: 'a->b',
      source: 'a',
      target: 'b',
      type: 'dependency',
      animated: true,
    }

    expect(edge.animated).toBe(true)
  })
})

describe('ServiceGraph type', () => {
  it('should contain nodes, edges, and warnings', () => {
    const graph: ServiceGraph = {
      nodes: [],
      edges: [],
      warnings: [],
    }

    expect(graph.nodes).toEqual([])
    expect(graph.edges).toEqual([])
    expect(graph.warnings).toEqual([])
  })
})
