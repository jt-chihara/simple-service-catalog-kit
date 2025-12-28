import type { Warning } from '../types/service'

interface WarningPanelProps {
  warnings: Warning[]
}

export function WarningPanel({ warnings }: WarningPanelProps) {
  if (warnings.length === 0) {
    return null
  }

  const cycleWarnings = warnings.filter((w) => w.type === 'cycle')
  const missingWarnings = warnings.filter((w) => w.type === 'missing')

  return (
    <div className="warning-panel" aria-live="polite">
      <h2>警告 ({warnings.length})</h2>

      {cycleWarnings.length > 0 && (
        <section className="warning-section" aria-labelledby="cycle-warnings">
          <h3 id="cycle-warnings">循環依存</h3>
          <ul aria-label="循環依存の警告一覧">
            {cycleWarnings.map((warning) => (
              <li
                key={`cycle-${warning.services.join('-')}`}
                className="warning-item warning-cycle"
              >
                {warning.message}
              </li>
            ))}
          </ul>
        </section>
      )}

      {missingWarnings.length > 0 && (
        <section className="warning-section" aria-labelledby="missing-warnings">
          <h3 id="missing-warnings">未定義のサービス参照</h3>
          <ul aria-label="未定義参照の警告一覧">
            {missingWarnings.map((warning) => (
              <li
                key={`missing-${warning.services.join('-')}`}
                className="warning-item warning-missing"
              >
                {warning.message}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
