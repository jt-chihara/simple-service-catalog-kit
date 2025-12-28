import dagre from 'dagre'
import type { DependencyEdge, Service, ServiceNode } from '../types/service'

const NODE_WIDTH = 180
const NODE_HEIGHT = 80

/**
 * サービス配列をReact Flowノード配列に変換
 */
export function servicesToNodes(services: Service[]): ServiceNode[] {
  return services.map((service, index) => ({
    id: service.name,
    type: 'service',
    data: service,
    position: { x: 0, y: index * 100 }, // 初期位置（calculateLayoutで更新される）
  }))
}

/**
 * サービス配列から依存関係エッジ配列を生成
 */
export function dependenciesToEdges(services: Service[]): DependencyEdge[] {
  const edges: DependencyEdge[] = []

  for (const service of services) {
    for (const dep of service.dependencies) {
      edges.push({
        id: `${service.name}->${dep}`,
        source: service.name,
        target: dep,
        type: 'dependency',
        animated: false,
      })
    }
  }

  return edges
}

/**
 * レイアウト計算結果
 */
export interface LayoutResult {
  nodes: ServiceNode[]
  edges: DependencyEdge[]
}

/**
 * dagreを使用してノードの位置を計算
 */
export function calculateLayout(nodes: ServiceNode[], edges: DependencyEdge[]): LayoutResult {
  if (nodes.length === 0) {
    return { nodes: [], edges: [] }
  }

  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'TB', nodesep: 50, ranksep: 100 })
  g.setDefaultEdgeLabel(() => ({}))

  // ノードを追加
  for (const node of nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  }

  // エッジを追加
  for (const edge of edges) {
    // 存在するノードへのエッジのみ追加
    if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
      g.setEdge(edge.source, edge.target)
    }
  }

  // レイアウト計算
  dagre.layout(g)

  // 計算された位置でノードを更新
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id)
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    }
  })

  return { nodes: layoutedNodes, edges }
}
