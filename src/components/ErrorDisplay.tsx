interface ErrorItem {
  fileName: string
  error: string
}

interface ErrorDisplayProps {
  errors: ErrorItem[]
}

export function ErrorDisplay({ errors }: ErrorDisplayProps) {
  if (errors.length === 0) {
    return null
  }

  return (
    <div className="error-display">
      <h2>エラー</h2>
      <ul>
        {errors.map((err) => (
          <li key={`${err.fileName}-${err.error}`}>
            <strong>{err.fileName || '一般エラー'}</strong>
            <span>{err.error}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
