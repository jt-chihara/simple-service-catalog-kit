import './App.css'
import { ServiceDetail } from './components/Detail/ServiceDetail'
import { ErrorDisplay } from './components/ErrorDisplay'
import { ServiceGraph } from './components/Graph/ServiceGraph'
import { SearchBar } from './components/Search/SearchBar'
import { WarningPanel } from './components/WarningPanel'
import { useServices } from './hooks/useServices'

function App() {
  const {
    services,
    state,
    errors,
    warnings,
    selectService,
    selectedService,
    searchQuery,
    setSearchQuery,
    highlightedServiceNames,
    searchResultCount,
  } = useServices()

  return (
    <div className="app">
      <header className="app-header">
        <h1>Service Dependency Catalog</h1>
        {state === 'success' && services.length > 0 && (
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            matchedCount={searchResultCount.matched}
            relatedCount={searchResultCount.related}
          />
        )}
      </header>

      <ErrorDisplay errors={errors} />
      <WarningPanel warnings={warnings} />

      <div className="app-content">
        <main className="app-main" aria-label="サービス依存関係グラフ">
          {state === 'loading' && (
            <div className="loading" aria-live="polite">
              読み込み中...
            </div>
          )}

          {state === 'success' && services.length === 0 && (
            <div className="empty">
              サービスが見つかりません。services/ フォルダにYAMLファイルを追加してください。
            </div>
          )}

          {state === 'success' && services.length > 0 && (
            <ServiceGraph
              services={services}
              onNodeClick={selectService}
              selectedServiceName={selectedService?.name}
              highlightedServiceNames={highlightedServiceNames}
            />
          )}

          {state === 'error' && <div className="error-state">エラーが発生しました</div>}
        </main>

        {selectedService && (
          <ServiceDetail
            service={selectedService}
            services={services}
            onServiceSelect={selectService}
            onClose={() => selectService(null)}
          />
        )}
      </div>
    </div>
  )
}

export default App
