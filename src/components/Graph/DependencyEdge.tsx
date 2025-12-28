import { BaseEdge, type Position, getSmoothStepPath } from '@xyflow/react'

interface DependencyEdgeProps {
  id: string
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
  sourcePosition: Position
  targetPosition: Position
  data?: { isCyclic?: boolean }
  markerEnd?: string
}

export function DependencyEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: DependencyEdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const isCyclic = data?.isCyclic ?? false

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      className={`dependency-edge ${isCyclic ? 'cyclic' : ''}`}
      style={{
        stroke: isCyclic ? '#ef4444' : '#64748b',
        strokeWidth: 2,
        animation: isCyclic ? 'pulse 1s infinite' : undefined,
      }}
    />
  )
}
