import { describe, expect, it, vi } from 'vitest'
import {
  type DatadogServiceDependencies,
  buildServiceDefinitions,
  fetchServiceDependencies,
  parseArgs,
  toFileName,
  toYaml,
  validateConfig,
} from '../../scripts/generate-from-datadog'

describe('parseArgs', () => {
  it('デフォルト値を返す', () => {
    const config = parseArgs([])
    expect(config.site).toBe('datadoghq.com')
    expect(config.outputDir).toBe('./services')
    expect(config.defaultOwner).toBe('unknown-team')
    expect(config.dryRun).toBe(false)
  })

  it('--api-key オプションをパース', () => {
    const config = parseArgs(['--api-key', 'test-api-key'])
    expect(config.apiKey).toBe('test-api-key')
  })

  it('--app-key オプションをパース', () => {
    const config = parseArgs(['--app-key', 'test-app-key'])
    expect(config.appKey).toBe('test-app-key')
  })

  it('--site オプションをパース', () => {
    const config = parseArgs(['--site', 'datadoghq.eu'])
    expect(config.site).toBe('datadoghq.eu')
  })

  it('--env オプションをパース', () => {
    const config = parseArgs(['--env', 'production'])
    expect(config.env).toBe('production')
  })

  it('--output オプションをパース', () => {
    const config = parseArgs(['--output', './custom-output'])
    expect(config.outputDir).toBe('./custom-output')
  })

  it('--owner オプションをパース', () => {
    const config = parseArgs(['--owner', 'my-team'])
    expect(config.defaultOwner).toBe('my-team')
  })

  it('--dry-run オプションをパース', () => {
    const config = parseArgs(['--dry-run'])
    expect(config.dryRun).toBe(true)
  })

  it('複数のオプションを組み合わせてパース', () => {
    const config = parseArgs([
      '--api-key',
      'api123',
      '--app-key',
      'app456',
      '--site',
      'us5.datadoghq.com',
      '--env',
      'staging',
      '--output',
      '/tmp/services',
      '--owner',
      'platform-team',
      '--dry-run',
    ])
    expect(config).toEqual({
      apiKey: 'api123',
      appKey: 'app456',
      site: 'us5.datadoghq.com',
      env: 'staging',
      outputDir: '/tmp/services',
      defaultOwner: 'platform-team',
      dryRun: true,
    })
  })
})

describe('validateConfig', () => {
  it('有効な設定でエラーなし', () => {
    const errors = validateConfig({
      apiKey: 'key',
      appKey: 'app',
      site: 'datadoghq.com',
      env: 'prod',
      outputDir: './services',
      defaultOwner: 'team',
      dryRun: false,
    })
    expect(errors).toHaveLength(0)
  })

  it('APIキーがない場合エラー', () => {
    const errors = validateConfig({
      apiKey: '',
      appKey: 'app',
      site: 'datadoghq.com',
      env: 'prod',
      outputDir: './services',
      defaultOwner: 'team',
      dryRun: false,
    })
    expect(errors).toContain('APIキーが必要です (--api-key または DD_API_KEY)')
  })

  it('Application Keyがない場合エラー', () => {
    const errors = validateConfig({
      apiKey: 'key',
      appKey: '',
      site: 'datadoghq.com',
      env: 'prod',
      outputDir: './services',
      defaultOwner: 'team',
      dryRun: false,
    })
    expect(errors).toContain('Application Keyが必要です (--app-key または DD_APP_KEY)')
  })

  it('環境がない場合エラー', () => {
    const errors = validateConfig({
      apiKey: 'key',
      appKey: 'app',
      site: 'datadoghq.com',
      env: '',
      outputDir: './services',
      defaultOwner: 'team',
      dryRun: false,
    })
    expect(errors).toContain('環境が必要です (--env)')
  })

  it('複数のエラーを返す', () => {
    const errors = validateConfig({
      apiKey: '',
      appKey: '',
      site: 'datadoghq.com',
      env: '',
      outputDir: './services',
      defaultOwner: 'team',
      dryRun: false,
    })
    expect(errors).toHaveLength(3)
  })
})

describe('toFileName', () => {
  it('小文字に変換する', () => {
    expect(toFileName('UserService')).toBe('userservice')
  })

  it('特殊文字をハイフンに変換する', () => {
    expect(toFileName('user_service')).toBe('user-service')
    expect(toFileName('user.service')).toBe('user-service')
  })

  it('既にハイフン区切りの場合はそのまま', () => {
    expect(toFileName('user-service')).toBe('user-service')
  })
})

describe('toYaml', () => {
  it('依存関係なしのサービスをYAMLに変換', () => {
    const service = {
      name: 'user-service',
      description: 'ユーザーサービス',
      owner: 'platform-team',
      github: 'https://github.com/example/user-service',
      dependencies: [],
    }
    const yaml = toYaml(service)
    expect(yaml).toBe(`description: ユーザーサービス
owner: platform-team
github: https://github.com/example/user-service
dependencies: []
`)
  })

  it('依存関係ありのサービスをYAMLに変換', () => {
    const service = {
      name: 'api-gateway',
      description: 'APIゲートウェイ',
      owner: 'platform-team',
      github: 'https://github.com/example/api-gateway',
      dependencies: ['user-service', 'order-service'],
    }
    const yaml = toYaml(service)
    expect(yaml).toBe(`description: APIゲートウェイ
owner: platform-team
github: https://github.com/example/api-gateway
dependencies:
  - user-service
  - order-service
`)
  })
})

describe('buildServiceDefinitions', () => {
  it('Datadog形式の依存関係からサービス定義を生成', () => {
    const dependencies: DatadogServiceDependencies = {
      'api-gateway': { calls: ['user-service', 'order-service'] },
      'user-service': { calls: [] },
      'order-service': { calls: ['user-service'] },
    }
    const definitions = buildServiceDefinitions(dependencies, 'my-team')

    expect(definitions).toHaveLength(3)

    const apiGateway = definitions.find((d) => d.name === 'api-gateway')
    expect(apiGateway).toEqual({
      name: 'api-gateway',
      description: 'api-gateway サービス',
      owner: 'my-team',
      github: 'https://github.com/example/api-gateway',
      dependencies: ['user-service', 'order-service'],
    })

    const userService = definitions.find((d) => d.name === 'user-service')
    expect(userService?.dependencies).toEqual([])
  })

  it('空の依存関係を処理', () => {
    const dependencies: DatadogServiceDependencies = {}
    const definitions = buildServiceDefinitions(dependencies, 'team')
    expect(definitions).toHaveLength(0)
  })
})

describe('fetchServiceDependencies', () => {
  it('サービス依存関係を取得', async () => {
    const mockDependencies: DatadogServiceDependencies = {
      'service-a': { calls: ['service-b'] },
      'service-b': { calls: [] },
    }
    const mockResponse = {
      ok: true,
      json: async () => mockDependencies,
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))

    const config = {
      apiKey: 'test-api-key',
      appKey: 'test-app-key',
      site: 'datadoghq.com',
      env: 'prod',
      outputDir: './services',
      defaultOwner: 'team',
      dryRun: false,
    }
    const dependencies = await fetchServiceDependencies(config)

    expect(dependencies).toEqual(mockDependencies)
    expect(fetch).toHaveBeenCalledWith(
      'https://api.datadoghq.com/api/v1/service_dependencies?env=prod',
      expect.objectContaining({
        headers: {
          'DD-API-KEY': 'test-api-key',
          'DD-APPLICATION-KEY': 'test-app-key',
          'Content-Type': 'application/json',
        },
      })
    )

    vi.unstubAllGlobals()
  })

  it('APIエラー時に例外をスロー', async () => {
    const mockResponse = {
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      text: async () => 'Invalid API key',
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))

    const config = {
      apiKey: 'invalid',
      appKey: 'invalid',
      site: 'datadoghq.com',
      env: 'prod',
      outputDir: './services',
      defaultOwner: 'team',
      dryRun: false,
    }

    await expect(fetchServiceDependencies(config)).rejects.toThrow(
      'Failed to fetch service dependencies'
    )

    vi.unstubAllGlobals()
  })

  it('異なるサイトでURLが変わる', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({}),
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))

    const config = {
      apiKey: 'key',
      appKey: 'app',
      site: 'datadoghq.eu',
      env: 'staging',
      outputDir: './services',
      defaultOwner: 'team',
      dryRun: false,
    }
    await fetchServiceDependencies(config)

    expect(fetch).toHaveBeenCalledWith(
      'https://api.datadoghq.eu/api/v1/service_dependencies?env=staging',
      expect.anything()
    )

    vi.unstubAllGlobals()
  })
})
