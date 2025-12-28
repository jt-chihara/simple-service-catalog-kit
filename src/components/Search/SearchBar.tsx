interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  matchedCount: number
  relatedCount: number
}

export function SearchBar({ value, onChange, matchedCount, relatedCount }: SearchBarProps) {
  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="サービスを検索..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="search-input"
      />
      {value && (
        <>
          <span className="search-result-count">
            <span className="search-matched">{matchedCount}件</span>
            {relatedCount > 0 && (
              <span className="search-related">（関連: {relatedCount}件）</span>
            )}
          </span>
          <button
            type="button"
            onClick={() => onChange('')}
            className="search-clear"
            aria-label="クリア"
          >
            ✕
          </button>
        </>
      )}
    </div>
  )
}
