import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Service, Warning } from '../types/service'
import { detectCycles } from '../utils/cycle-detector'
import { loadAllServices } from '../utils/service-loader'
import { detectMissingReferences } from '../utils/warning-detector'

/**
 * サービス読み込み状態
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

/**
 * useServices フックの戻り値
 */
export interface UseServicesResult {
  /** ロードされたサービス一覧 */
  services: Service[]
  /** ローディング状態 */
  state: LoadingState
  /** エラーメッセージ一覧 */
  errors: Array<{ fileName: string; error: string }>
  /** 警告一覧 */
  warnings: Warning[]
  /** サービスを再読み込み */
  reload: () => Promise<void>
  /** 選択中のサービス */
  selectedService: Service | null
  /** サービスを選択 */
  selectService: (service: Service | null) => void
  /** 検索クエリ */
  searchQuery: string
  /** 検索クエリを設定 */
  setSearchQuery: (query: string) => void
  /** フィルタされたサービス */
  filteredServices: Service[]
  /** ハイライトされたサービス名 */
  highlightedServiceNames: Set<string>
  /** 検索結果カウント */
  searchResultCount: { matched: number; related: number }
}

/**
 * サービス一覧を管理するカスタムフック
 */
export function useServices(): UseServicesResult {
  const [services, setServices] = useState<Service[]>([])
  const [state, setState] = useState<LoadingState>('idle')
  const [errors, setErrors] = useState<Array<{ fileName: string; error: string }>>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const reload = useCallback(async () => {
    setState('loading')
    setErrors([])

    try {
      const result = await loadAllServices()
      setServices(result.services)
      setErrors(result.errors)
      setState(result.errors.length > 0 && result.services.length === 0 ? 'error' : 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : '不明なエラー'
      setErrors([{ fileName: '', error: message }])
      setState('error')
    }
  }, [])

  // 警告を検出
  const warnings = useMemo(() => {
    if (services.length === 0) return []
    const cycleWarnings = detectCycles(services)
    const missingWarnings = detectMissingReferences(services)
    return [...cycleWarnings, ...missingWarnings]
  }, [services])

  useEffect(() => {
    reload()
  }, [reload])

  // 検索によるフィルタリングとハイライト
  const { filteredServices, highlightedServiceNames, searchResultCount } = (() => {
    if (!searchQuery.trim()) {
      return {
        filteredServices: services,
        highlightedServiceNames: new Set<string>(),
        searchResultCount: { matched: 0, related: 0 },
      }
    }

    const query = searchQuery.toLowerCase()
    const matched = services.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.owner.toLowerCase().includes(query)
    )

    // マッチしたサービスとその依存先・被依存元をハイライト
    const highlighted = new Set<string>()
    const matchedNames = new Set<string>()
    for (const s of matched) {
      highlighted.add(s.name)
      matchedNames.add(s.name)
      for (const dep of s.dependencies) {
        highlighted.add(dep)
      }
    }

    // 被依存元（このサービスに依存しているサービス）
    for (const s of services) {
      if (s.dependencies.some((dep) => matched.some((m) => m.name === dep))) {
        highlighted.add(s.name)
      }
    }

    return {
      filteredServices: services,
      highlightedServiceNames: highlighted,
      searchResultCount: {
        matched: matchedNames.size,
        related: highlighted.size - matchedNames.size,
      },
    }
  })()

  return {
    services,
    state,
    errors,
    warnings,
    reload,
    selectedService,
    selectService: setSelectedService,
    searchQuery,
    setSearchQuery,
    filteredServices,
    highlightedServiceNames,
    searchResultCount,
  }
}
