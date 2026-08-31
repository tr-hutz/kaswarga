interface BreakdownItem {
  label: string
  value: string | number
}

interface InsightCardProps {
  title:       string
  value:       string | number
  subtitle?:   string
  valueColor?: string
  breakdown?:  BreakdownItem[]
}

export default function InsightCard({

  title,
  value,
  subtitle,
  valueColor = 'text-foreground',
  breakdown,

}: InsightCardProps) {

  return (

    <div className="rounded-lg shadow-card p-5 bg-surface">

      <div className="text-sm text-muted">
        {title}
      </div>

      <div className={`text-2xl font-bold mt-2 leading-tight ${valueColor}`}>
        {value}
      </div>

      {subtitle && (
        <div className="text-xs text-subtle mt-1">
          {subtitle}
        </div>
      )}

      {breakdown && breakdown.length > 0 && (
        <div className="mt-3 pt-2 border-t border-divider grid gap-px" style={{ gridTemplateColumns: `repeat(${breakdown.length}, 1fr)` }}>
          {breakdown.map((item, i) => (
            <div
              key={item.label}
              className={`flex flex-col items-center text-center px-2 ${i > 0 ? 'border-l border-divider' : ''}`}
            >
              <span className="text-xs text-subtle">{item.label}</span>
              <span className="text-sm font-semibold text-muted mt-0.5">{item.value}</span>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
