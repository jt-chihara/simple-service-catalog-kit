import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ServiceDetail } from '../../src/components/Detail/ServiceDetail'
import type { Service } from '../../src/types/service'

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

describe('ServiceDetail', () => {
  it('選択されたサービスの詳細が表示される', () => {
    const selectedService = mockServices[0] // api-gateway
    render(
      <ServiceDetail
        service={selectedService}
        services={mockServices}
        onServiceSelect={() => {}}
        onClose={() => {}}
      />
    )

    expect(screen.getByText('api-gateway')).toBeInTheDocument()
    expect(screen.getByText('APIゲートウェイ')).toBeInTheDocument()
    expect(screen.getByText('platform-team')).toBeInTheDocument()
  })

  it('依存先一覧が表示される', () => {
    const selectedService = mockServices[0] // api-gateway
    render(
      <ServiceDetail
        service={selectedService}
        services={mockServices}
        onServiceSelect={() => {}}
        onClose={() => {}}
      />
    )

    expect(screen.getByText('user-service')).toBeInTheDocument()
    expect(screen.getByText('order-service')).toBeInTheDocument()
  })

  it('被依存元一覧が表示される', () => {
    const selectedService = mockServices[1] // user-service
    render(
      <ServiceDetail
        service={selectedService}
        services={mockServices}
        onServiceSelect={() => {}}
        onClose={() => {}}
      />
    )

    // user-serviceはapi-gatewayとorder-serviceから依存されている
    expect(screen.getByText('api-gateway')).toBeInTheDocument()
    expect(screen.getByText('order-service')).toBeInTheDocument()
  })

  it('依存先クリックで選択が切り替わる', () => {
    const selectedService = mockServices[0] // api-gateway
    const onServiceSelect = vi.fn()

    render(
      <ServiceDetail
        service={selectedService}
        services={mockServices}
        onServiceSelect={onServiceSelect}
        onClose={() => {}}
      />
    )

    const userServiceLink = screen.getByRole('button', { name: 'user-service' })
    fireEvent.click(userServiceLink)

    expect(onServiceSelect).toHaveBeenCalledWith(mockServices[1])
  })

  it('閉じるボタンでパネルを閉じる', () => {
    const selectedService = mockServices[0]
    const onClose = vi.fn()

    render(
      <ServiceDetail
        service={selectedService}
        services={mockServices}
        onServiceSelect={() => {}}
        onClose={onClose}
      />
    )

    const closeButton = screen.getByRole('button', { name: /閉じる/i })
    fireEvent.click(closeButton)

    expect(onClose).toHaveBeenCalled()
  })

  it('GitHubリンクが正しく表示される', () => {
    const selectedService = mockServices[0]
    render(
      <ServiceDetail
        service={selectedService}
        services={mockServices}
        onServiceSelect={() => {}}
        onClose={() => {}}
      />
    )

    const githubLink = screen.getByRole('link', { name: /github/i })
    expect(githubLink).toHaveAttribute('href', 'https://github.com/example/api-gateway')
  })
})
