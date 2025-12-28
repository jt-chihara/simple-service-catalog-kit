import {
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  type Node,
  ReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useMemo } from 'react'
import type { Service } from '../../types/service'
import { calculateLayout, dependenciesToEdges, servicesToNodes } from '../../utils/graph-layout'
import { DependencyEdge } from './DependencyEdge'
import { ServiceNode } from './ServiceNode'

interface ServiceGraphProps {
  services: Service[]
  onNodeClick?: (service: Service) => void
  selectedServiceName?: string | null
  highlightedServiceNames?: Set<string>
}

const nodeTypes = {
  service: ServiceNode,
}

const edgeTypes = {
  dependency: DependencyEdge,
}

export function ServiceGraph({
  services,
  onNodeClick,
  selectedServiceName,
  highlightedServiceNames,
}: ServiceGraphProps) {
  const { nodes, edges } = useMemo(() => {
    const rawNodes = servicesToNodes(services)
    const rawEdges = dependenciesToEdges(services)
    return calculateLayout(rawNodes, rawEdges)
  }, [services])

  // ReactFlow用にノードを変換
  const flowNodes: Node[] = useMemo(() => {
    const hasHighlight = highlightedServiceNames && highlightedServiceNames.size > 0
    return nodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: {
        ...(node.data as unknown as Record<string, unknown>),
        dimmed: hasHighlight && !highlightedServiceNames.has(node.id),
      },
      selected: node.id === selectedServiceName,
    }))
  }, [nodes, selectedServiceName, highlightedServiceNames])

  // ReactFlow用にエッジを変換
  const flowEdges: Edge[] = useMemo(() => {
    return edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type,
      animated: edge.animated,
    }))
  }, [edges])

  return (
    <div className="service-graph" style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={(_, node) => {
          if (onNodeClick && node.data) {
            onNodeClick(node.data as unknown as Service)
          }
        }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          type: 'dependency',
          markerEnd: { type: 'arrowclosed' as const },
        }}
      >
        <Controls />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  )
}
