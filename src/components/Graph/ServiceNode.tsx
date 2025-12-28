import { Handle, Position } from '@xyflow/react'
import type { Service } from '../../types/service'

interface ServiceNodeProps {
  data: Service & { dimmed?: boolean }
  selected?: boolean
}

export function ServiceNode({ data, selected }: ServiceNodeProps) {
  const dimmed = data.dimmed ?? false
  return (
    <div className={`service-node ${selected ? 'selected' : ''} ${dimmed ? 'dimmed' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="service-node-content">
        <div className="service-name">{data.name}</div>
        <div className="service-owner">{data.owner}</div>
        <a
          href={data.github}
          target="_blank"
          rel="noopener noreferrer"
          className="github-link"
          onClick={(e) => e.stopPropagation()}
        >
          GitHub
        </a>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
