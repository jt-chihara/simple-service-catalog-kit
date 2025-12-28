import type { Service } from '../../types/service'
import { getDependencies, getDependents } from '../../utils/dependency-analyzer'

interface ServiceDetailProps {
  service: Service
  services: Service[]
  onServiceSelect: (service: Service) => void
  onClose: () => void
}

export function ServiceDetail({ service, services, onServiceSelect, onClose }: ServiceDetailProps) {
  const dependencies = getDependencies(service.name, services)
  const dependents = getDependents(service.name, services)

  const handleServiceClick = (serviceName: string) => {
    const targetService = services.find((s) => s.name === serviceName)
    if (targetService) {
      onServiceSelect(targetService)
    }
  }

  return (
    <aside className="service-detail" aria-label="サービス詳細">
      <header className="service-detail-header">
        <h2 id="service-detail-title">{service.name}</h2>
        <button type="button" onClick={onClose} aria-label="閉じる">
          ✕
        </button>
      </header>

      <div className="service-detail-content">
        <section className="service-detail-section">
          <p className="service-description">{service.description}</p>
          <dl className="service-meta">
            <dt>オーナー</dt>
            <dd>{service.owner}</dd>
          </dl>
          <a
            href={service.github}
            target="_blank"
            rel="noopener noreferrer"
            className="github-link"
          >
            GitHub
          </a>
        </section>

        <section className="service-detail-section">
          <h3>依存先 ({dependencies.length})</h3>
          {dependencies.length > 0 ? (
            <ul className="service-list">
              {dependencies.map((dep) => (
                <li key={dep}>
                  <button type="button" onClick={() => handleServiceClick(dep)}>
                    {dep}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-list">なし</p>
          )}
        </section>

        <section className="service-detail-section">
          <h3>被依存元 ({dependents.length})</h3>
          {dependents.length > 0 ? (
            <ul className="service-list">
              {dependents.map((dep) => (
                <li key={dep}>
                  <button type="button" onClick={() => handleServiceClick(dep)}>
                    {dep}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-list">なし</p>
          )}
        </section>
      </div>
    </aside>
  )
}
