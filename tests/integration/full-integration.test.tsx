import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from '../../src/App'
import type { Service } from '../../src/types/service'

// service-loaderのモック
vi.mock('../../src/utils/service-loader', () => ({
  loadAllServices: vi.fn(),
}))

// React Flowのモック
vi.mock('@xyflow/react', async () => {
  const actual = await vi.importActual('@xyflow/react')
  return {
    ...actual,
    ReactFlow: ({
      nodes,
      edges,
      onNodeClick,
      children,
    }: {
      nodes: Array<{ id: string; data: Service & { dimmed?: boolean } }>
      edges: unknown[]
      onNodeClick?: (event: unknown, node: { data: Service }) => void
      children?: React.ReactNode
    }) => (
      <div data-testid="react-flow">
        {nodes.map((node) => (
          <button
            key={node.id}
            data-testid={`node-${node.id}`}
            onClick={() => onNodeClick?.({}, { data: node.data })}
            type="button"
          >
            {node.data.name}
          </button>
        ))}
        <div data-testid="edge-count">{edges.length}</div>
        {children}
      </div>
    ),
    Controls: () => <div data-testid="controls" />,
    Background: () => <div data-testid="background" />,
  }
})

const fullMockServices: Service[] = [
  {
    name: 'api-gateway',
    description: 'APIゲートウェイ - 全リクエストの入口',
    owner: 'platform-team',
    github: 'https://github.com/example/api-gateway',
    dependencies: ['user-service', 'order-service', 'payment-service'],
  },
  {
    name: 'user-service',
    description: 'ユーザー管理サービス',
    owner: 'user-team',
    github: 'https://github.com/example/user-service',
    dependencies: ['notification-service'],
  },
  {
    name: 'order-service',
    description: '注文管理サービス',
    owner: 'order-team',
    github: 'https://github.com/example/order-service',
    dependencies: ['user-service', 'payment-service'],
  },
  {
    name: 'payment-service',
    description: '決済処理サービス',
    owner: 'payment-team',
    github: 'https://github.com/example/payment-service',
    dependencies: ['notification-service'],
  },
  {
    name: 'notification-service',
    description: '通知サービス',
    owner: 'platform-team',
    github: 'https://github.com/example/notification-service',
    dependencies: [],
  },
]

describe('Full Integration Test', () => {
  it('アプリ全体が正常にレンダリングされる', async () => {
    const { loadAllServices } = await import('../../src/utils/service-loader')
    vi.mocked(loadAllServices).mockResolvedValue({
      services: fullMockServices,
      errors: [],
    })

    render(<App />)

    // ヘッダーが表示される
    expect(screen.getByText('Service Dependency Catalog')).toBeInTheDocument()

    // グラフが表示される
    await waitFor(() => {
      expect(screen.getByTestId('react-flow')).toBeInTheDocument()
    })

    // 全サービスノードが表示される
    for (const service of fullMockServices) {
      expect(screen.getByTestId(`node-${service.name}`)).toBeInTheDocument()
    }
  })

  it('サービスをクリックすると詳細パネルが表示される', async () => {
    const { loadAllServices } = await import('../../src/utils/service-loader')
    vi.mocked(loadAllServices).mockResolvedValue({
      services: fullMockServices,
      errors: [],
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('node-api-gateway')).toBeInTheDocument()
    })

    // サービスをクリック
    fireEvent.click(screen.getByTestId('node-api-gateway'))

    // 詳細パネルが表示される
    await waitFor(() => {
      expect(screen.getByText('APIゲートウェイ - 全リクエストの入口')).toBeInTheDocument()
    })
    expect(screen.getByText('platform-team')).toBeInTheDocument()
  })

  it('検索機能が動作する', async () => {
    const { loadAllServices } = await import('../../src/utils/service-loader')
    vi.mocked(loadAllServices).mockResolvedValue({
      services: fullMockServices,
      errors: [],
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('サービスを検索...')).toBeInTheDocument()
    })

    // 検索を実行
    const searchInput = screen.getByPlaceholderText('サービスを検索...')
    fireEvent.change(searchInput, { target: { value: 'payment' } })

    // 検索結果が表示される
    await waitFor(() => {
      expect(screen.getByText(/1件/)).toBeInTheDocument()
    })
  })

  it('詳細パネルから依存サービスに遷移できる', async () => {
    const { loadAllServices } = await import('../../src/utils/service-loader')
    vi.mocked(loadAllServices).mockResolvedValue({
      services: fullMockServices,
      errors: [],
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('node-api-gateway')).toBeInTheDocument()
    })

    // api-gatewayを選択
    fireEvent.click(screen.getByTestId('node-api-gateway'))

    await waitFor(() => {
      expect(screen.getByText('APIゲートウェイ - 全リクエストの入口')).toBeInTheDocument()
    })

    // 依存サービスをクリック（service-list内のボタンを選択）
    const serviceListButtons = screen.getAllByRole('button', { name: 'user-service' })
    // 詳細パネル内のボタン（ReactFlowモック内のボタンではない方）
    const detailButton = serviceListButtons.find((btn) => btn.closest('.service-list'))
    if (detailButton) {
      fireEvent.click(detailButton)
    }

    // user-serviceの詳細に遷移
    await waitFor(() => {
      expect(screen.getByText('ユーザー管理サービス')).toBeInTheDocument()
    })
  })

  it('詳細パネルを閉じることができる', async () => {
    const { loadAllServices } = await import('../../src/utils/service-loader')
    vi.mocked(loadAllServices).mockResolvedValue({
      services: fullMockServices,
      errors: [],
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('node-api-gateway')).toBeInTheDocument()
    })

    // サービスを選択
    fireEvent.click(screen.getByTestId('node-api-gateway'))

    await waitFor(() => {
      expect(screen.getByText('APIゲートウェイ - 全リクエストの入口')).toBeInTheDocument()
    })

    // 閉じるボタンをクリック（aria-labelで指定）
    const closeButton = screen.getByRole('button', { name: '閉じる' })
    fireEvent.click(closeButton)

    // 詳細パネルが閉じる
    await waitFor(() => {
      expect(screen.queryByText('APIゲートウェイ - 全リクエストの入口')).not.toBeInTheDocument()
    })
  })

  it('エラーがあるYAMLでも他のサービスは表示される', async () => {
    const { loadAllServices } = await import('../../src/utils/service-loader')
    vi.mocked(loadAllServices).mockResolvedValue({
      services: fullMockServices.slice(0, 3), // 一部のサービスのみ
      errors: [{ fileName: 'broken.yml', error: 'パースエラー' }],
    })

    render(<App />)

    // エラーが表示される
    await waitFor(() => {
      expect(screen.getByText(/broken.yml/)).toBeInTheDocument()
    })

    // 有効なサービスも表示される
    expect(screen.getByTestId('node-api-gateway')).toBeInTheDocument()
  })

  it('検索をクリアできる', async () => {
    const { loadAllServices } = await import('../../src/utils/service-loader')
    vi.mocked(loadAllServices).mockResolvedValue({
      services: fullMockServices,
      errors: [],
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('サービスを検索...')).toBeInTheDocument()
    })

    // 検索を実行
    const searchInput = screen.getByPlaceholderText('サービスを検索...')
    fireEvent.change(searchInput, { target: { value: 'payment' } })

    await waitFor(() => {
      expect(screen.getByText(/1件/)).toBeInTheDocument()
    })

    // クリアボタンをクリック（aria-labelで指定）
    const clearButton = screen.getByRole('button', { name: 'クリア' })
    fireEvent.click(clearButton)

    // 検索がクリアされる
    await waitFor(() => {
      expect(screen.queryByText(/1件/)).not.toBeInTheDocument()
    })
  })
})
