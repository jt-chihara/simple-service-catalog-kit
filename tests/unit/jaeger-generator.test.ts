import { describe, expect, it, vi } from 'vitest'
import {
  type JaegerDependency,
  buildDependencyMap,
  buildServiceDefinitions,
  fetchDependencies,
  fetchServices,
  parseArgs,
  toFileName,
  toYaml,
} from '../../scripts/generate-from-jaeger'

describe('parseArgs', () => {
  it('デフォルト値を返す', () => {
    const config = parseArgs([])
    expect(config).toEqual({
      jaegerUrl: 'http://localhost:16686',
      outputDir: './services',
      defaultOwner: 'unknown-team',
      dryRun: false,
    })
  })

  it('--jaeger-url オプションをパース', () => {
    const config = parseArgs(['--jaeger-url', 'http://jaeger.example.com:16686'])
    expect(config.jaegerUrl).toBe('http://jaeger.example.com:16686')
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
      '--jaeger-url',
      'http://custom:8080',
      '--output',
      '/tmp/services',
      '--owner',
      'platform-team',
      '--dry-run',
    ])
    expect(config).toEqual({
      jaegerUrl: 'http://custom:8080',
      outputDir: '/tmp/services',
      defaultOwner: 'platform-team',
      dryRun: true,
    })
  })
})

describe('toFileName', () => {
  it('小文字に変換する', () => {
    expect(toFileName('UserService')).toBe('userservice')
  })

  it('特殊文字をハイフンに変換する', () => {
    expect(toFileName('user_service')).toBe('user-service')
    expect(toFileName('user.service')).toBe('user-service')
    expect(toFileName('user/service')).toBe('user-service')
  })

  it('既にハイフン区切りの場合はそのまま', () => {
    expect(toFileName('user-service')).toBe('user-service')
  })

  it('数字は保持する', () => {
    expect(toFileName('service123')).toBe('service123')
  })

  it('連続する特殊文字を処理する', () => {
    expect(toFileName('my__service')).toBe('my--service')
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

describe('buildDependencyMap', () => {
  it('空の依存関係リストを処理', () => {
    const map = buildDependencyMap([])
    expect(map.size).toBe(0)
  })

  it('依存関係をマップに変換', () => {
    const dependencies: JaegerDependency[] = [
      { parent: 'api-gateway', child: 'user-service', callCount: 100 },
      { parent: 'api-gateway', child: 'order-service', callCount: 50 },
      { parent: 'order-service', child: 'user-service', callCount: 30 },
    ]
    const map = buildDependencyMap(dependencies)

    expect(map.size).toBe(2)
    expect(Array.from(map.get('api-gateway') || [])).toEqual(['user-service', 'order-service'])
    expect(Array.from(map.get('order-service') || [])).toEqual(['user-service'])
  })

  it('同じ依存関係が重複しない', () => {
    const dependencies: JaegerDependency[] = [
      { parent: 'api-gateway', child: 'user-service', callCount: 100 },
      { parent: 'api-gateway', child: 'user-service', callCount: 50 },
    ]
    const map = buildDependencyMap(dependencies)

    expect(Array.from(map.get('api-gateway') || [])).toEqual(['user-service'])
  })

  it('自己参照を除外する', () => {
    const dependencies: JaegerDependency[] = [
      { parent: 'api-gateway', child: 'user-service', callCount: 100 },
      { parent: 'user-service', child: 'user-service', callCount: 50 }, // 自己参照
      { parent: 'order-service', child: 'order-service', callCount: 30 }, // 自己参照
    ]
    const map = buildDependencyMap(dependencies)

    expect(map.size).toBe(1)
    expect(Array.from(map.get('api-gateway') || [])).toEqual(['user-service'])
    expect(map.has('user-service')).toBe(false)
    expect(map.has('order-service')).toBe(false)
  })
})

describe('buildServiceDefinitions', () => {
  it('サービス定義を生成', () => {
    const services = ['api-gateway', 'user-service']
    const dependencyMap = new Map<string, Set<string>>([['api-gateway', new Set(['user-service'])]])
    const definitions = buildServiceDefinitions(services, dependencyMap, 'my-team')

    expect(definitions).toHaveLength(2)
    expect(definitions[0]).toEqual({
      name: 'api-gateway',
      description: 'api-gateway サービス',
      owner: 'my-team',
      github: 'https://github.com/example/api-gateway',
      dependencies: ['user-service'],
    })
    expect(definitions[1]).toEqual({
      name: 'user-service',
      description: 'user-service サービス',
      owner: 'my-team',
      github: 'https://github.com/example/user-service',
      dependencies: [],
    })
  })

  it('依存関係マップにないサービスは空の依存配列', () => {
    const services = ['standalone-service']
    const dependencyMap = new Map<string, Set<string>>()
    const definitions = buildServiceDefinitions(services, dependencyMap, 'team')

    expect(definitions[0].dependencies).toEqual([])
  })
})

describe('fetchServices', () => {
  it('サービス一覧を取得', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ data: ['service-a', 'service-b', 'jaeger-query'] }),
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))

    const services = await fetchServices('http://localhost:16686')

    expect(services).toEqual(['service-a', 'service-b'])
    expect(fetch).toHaveBeenCalledWith('http://localhost:16686/api/services')

    vi.unstubAllGlobals()
  })

  it('jaeger-queryを除外する', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ data: ['jaeger-query', 'my-service'] }),
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))

    const services = await fetchServices('http://localhost:16686')

    expect(services).toEqual(['my-service'])

    vi.unstubAllGlobals()
  })

  it('APIエラー時に例外をスロー', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))

    await expect(fetchServices('http://localhost:16686')).rejects.toThrow(
      'Failed to fetch services: 500 Internal Server Error'
    )

    vi.unstubAllGlobals()
  })
})

describe('fetchDependencies', () => {
  it('依存関係を取得', async () => {
    const mockDependencies = [{ parent: 'service-a', child: 'service-b', callCount: 10 }]
    const mockResponse = {
      ok: true,
      json: async () => ({ data: mockDependencies }),
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))

    const dependencies = await fetchDependencies('http://localhost:16686')

    expect(dependencies).toEqual(mockDependencies)
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/dependencies'))

    vi.unstubAllGlobals()
  })

  it('APIエラー時に例外をスロー', async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      statusText: 'Not Found',
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))

    await expect(fetchDependencies('http://localhost:16686')).rejects.toThrow(
      'Failed to fetch dependencies: 404 Not Found'
    )

    vi.unstubAllGlobals()
  })
})
