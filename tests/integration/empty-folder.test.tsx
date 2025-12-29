import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from '../../src/App'

// service-loaderのモック
vi.mock('../../src/utils/service-loader', () => ({
  loadAllServices: vi.fn(),
}))

// React Flowのモック
vi.mock('@xyflow/react', async () => {
  const actual = await vi.importActual('@xyflow/react')
  return {
    ...actual,
    ReactFlow: ({ children }: { children?: React.ReactNode }) => (
      <div data-testid="react-flow">{children}</div>
    ),
    Controls: () => <div data-testid="controls" />,
    Background: () => <div data-testid="background" />,
  }
})

describe('Empty Folder Handling', () => {
  it('サービスがない場合、適切なメッセージを表示する', async () => {
    const { loadAllServices } = await import('../../src/utils/service-loader')
    vi.mocked(loadAllServices).mockResolvedValue({
      services: [],
      errors: [],
    })

    render(<App />)

    // ローディング後にメッセージが表示される
    expect(await screen.findByText(/サービスが見つかりません/)).toBeInTheDocument()
  })

  it('空のフォルダでも検索バーは表示されない', async () => {
    const { loadAllServices } = await import('../../src/utils/service-loader')
    vi.mocked(loadAllServices).mockResolvedValue({
      services: [],
      errors: [],
    })

    render(<App />)

    await screen.findByText(/サービスが見つかりません/)

    // 検索バーが表示されない
    expect(screen.queryByPlaceholderText(/検索/)).not.toBeInTheDocument()
  })

  it('ヘッダーのタイトルは表示される', async () => {
    const { loadAllServices } = await import('../../src/utils/service-loader')
    vi.mocked(loadAllServices).mockResolvedValue({
      services: [],
      errors: [],
    })

    render(<App />)

    await screen.findByText(/サービスが見つかりません/)

    expect(screen.getByText('Simple Service Catalog Kit')).toBeInTheDocument()
  })

  it('すべてのYAMLにエラーがあり、有効なサービスがない場合はエラー状態になる', async () => {
    const { loadAllServices } = await import('../../src/utils/service-loader')
    vi.mocked(loadAllServices).mockResolvedValue({
      services: [],
      errors: [{ fileName: 'broken.yml', error: 'YAMLパースエラー' }],
    })

    render(<App />)

    // エラーが表示される
    expect(await screen.findByText(/エラーが発生しました/)).toBeInTheDocument()
    expect(screen.getByText(/broken.yml/)).toBeInTheDocument()
    expect(screen.getByText(/YAMLパースエラー/)).toBeInTheDocument()
  })
})
