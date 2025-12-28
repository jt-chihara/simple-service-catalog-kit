import './App.css'
import { ErrorDisplay } from './components/ErrorDisplay'
import { ServiceGraph } from './components/Graph/ServiceGraph'
import { useServices } from './hooks/useServices'

function App() {
  const { services, state, errors, selectService, selectedService } = useServices()

  return (
    <div className="app">
      <header className="app-header">
        <h1>Service Dependency Catalog</h1>
      </header>

      <ErrorDisplay errors={errors} />

      <main className="app-main">
        {state === 'loading' && <div className="loading">読み込み中...</div>}

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
          />
        )}

        {state === 'error' && <div className="error-state">エラーが発生しました</div>}
      </main>
    </div>
  )
}

export default App
