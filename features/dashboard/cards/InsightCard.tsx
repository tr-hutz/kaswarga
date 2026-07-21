interface InsightCardProps {
  title:       string
  value:       string | number
  subtitle?:   string
  valueColor?: string
}

export default function InsightCard({

  title,
  value,
  subtitle,
  valueColor = 'text-foreground'

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

    </div>
  )
}