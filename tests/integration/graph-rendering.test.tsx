import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ServiceGraph } from '../../src/components/Graph/ServiceGraph'
import type { Service } from '../../src/types/service'

// React Flowのモック（内部でResizeObserverなどを使用するため）
vi.mock('@xyflow/react', async () => {
  const actual = await vi.importActual('@xyflow/react')
  return {
    ...actual,
    ReactFlow: ({
      nodes,
      edges,
      children,
    }: { nodes: unknown[]; edges: unknown[]; children?: React.ReactNode }) => (
      <div data-testid="react-flow">
        <div data-testid="node-count">{nodes.length}</div>
        <div data-testid="edge-count">{edges.length}</div>
        {children}
      </div>
    ),
    MiniMap: () => <div data-testid="minimap" />,
    Controls: () => <div data-testid="controls" />,
    Background: () => <div data-testid="background" />,
  }
})

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
    dependencies: [],
  },
  {
    name: 'order-service',
    description: '注文サービス',
    owner: 'order-team',
    github: 'https://github.com/example/order-service',
    dependencies: ['user-service'],
  },
]

describe('ServiceGraph Integration', () => {
  it('グラフが描画される', () => {
    render(<ServiceGraph services={mockServices} />)

    expect(screen.getByTestId('react-flow')).toBeInTheDocument()
  })

  it('ノード数が正しい', () => {
    render(<ServiceGraph services={mockServices} />)

    expect(screen.getByTestId('node-count').textContent).toBe('3')
  })

  it('エッジ数が正しい', () => {
    render(<ServiceGraph services={mockServices} />)

    // api-gateway -> user-service, order-service (2)
    // order-service -> user-service (1)
    // 合計: 3
    expect(screen.getByTestId('edge-count').textContent).toBe('3')
  })

  it('MiniMapが表示される', () => {
    render(<ServiceGraph services={mockServices} />)

    expect(screen.getByTestId('minimap')).toBeInTheDocument()
  })

  it('コントロールが表示される', () => {
    render(<ServiceGraph services={mockServices} />)

    expect(screen.getByTestId('controls')).toBeInTheDocument()
  })

  it('空のサービス配列でも正常に描画される', () => {
    render(<ServiceGraph services={[]} />)

    expect(screen.getByTestId('react-flow')).toBeInTheDocument()
    expect(screen.getByTestId('node-count').textContent).toBe('0')
    expect(screen.getByTestId('edge-count').textContent).toBe('0')
  })
})
