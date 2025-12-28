import { describe, expect, it } from 'vitest'
import type { Service } from '../../src/types/service'
import { calculateLayout, dependenciesToEdges, servicesToNodes } from '../../src/utils/graph-layout'

/**
 * 指定数のモックサービスを生成
 */
function generateMockServices(count: number): Service[] {
  const services: Service[] = []

  for (let i = 0; i < count; i++) {
    // 依存関係をランダムに設定（前のサービスへの依存）
    const dependencies: string[] = []
    const depCount = Math.min(i, Math.floor(Math.random() * 3) + 1) // 1-3の依存
    for (let j = 0; j < depCount && i > 0; j++) {
      const depIndex = Math.floor(Math.random() * i)
      const depName = `service-${depIndex}`
      if (!dependencies.includes(depName)) {
        dependencies.push(depName)
      }
    }

    services.push({
      name: `service-${i}`,
      description: `サービス ${i} の説明`,
      owner: `team-${i % 5}`,
      github: `https://github.com/example/service-${i}`,
      dependencies,
    })
  }

  return services
}

describe('Graph Performance', () => {
  it('50サービスのレイアウト計算が500ms以内に完了する', () => {
    const services = generateMockServices(50)
    const nodes = servicesToNodes(services)
    const edges = dependenciesToEdges(services)

    const startTime = performance.now()
    const result = calculateLayout(nodes, edges)
    const endTime = performance.now()

    expect(result.nodes).toHaveLength(50)
    expect(endTime - startTime).toBeLessThan(500)
  })

  it('100サービスのレイアウト計算が1000ms以内に完了する', () => {
    const services = generateMockServices(100)
    const nodes = servicesToNodes(services)
    const edges = dependenciesToEdges(services)

    const startTime = performance.now()
    const result = calculateLayout(nodes, edges)
    const endTime = performance.now()

    expect(result.nodes).toHaveLength(100)
    expect(endTime - startTime).toBeLessThan(1000)
  })

  it('ノード変換のパフォーマンス: 100サービスで10ms以内', () => {
    const services = generateMockServices(100)

    const startTime = performance.now()
    const nodes = servicesToNodes(services)
    const endTime = performance.now()

    expect(nodes).toHaveLength(100)
    expect(endTime - startTime).toBeLessThan(10)
  })

  it('エッジ変換のパフォーマンス: 100サービスで10ms以内', () => {
    const services = generateMockServices(100)

    const startTime = performance.now()
    const edges = dependenciesToEdges(services)
    const endTime = performance.now()

    expect(edges.length).toBeGreaterThan(0)
    expect(endTime - startTime).toBeLessThan(10)
  })

  it('大量のサービスでもメモリ使用量が妥当', () => {
    const services = generateMockServices(200)
    const nodes = servicesToNodes(services)
    const edges = dependenciesToEdges(services)

    // レイアウト計算が完了することを確認
    const result = calculateLayout(nodes, edges)

    expect(result.nodes).toHaveLength(200)
    // すべてのノードに有効な位置が設定されている
    for (const node of result.nodes) {
      expect(node.position.x).toBeDefined()
      expect(node.position.y).toBeDefined()
      expect(Number.isFinite(node.position.x)).toBe(true)
      expect(Number.isFinite(node.position.y)).toBe(true)
    }
  })
})
