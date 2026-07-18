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
  valueColor = 'text-dark'

}: InsightCardProps) {

  return (

    <div className="rounded-lg shadow-card p-5 bg-white">

      <div className="text-sm text-dark-5">
        {title}
      </div>

      <div className={`text-2xl font-bold mt-2 leading-tight ${valueColor}`}>
        {value}
      </div>

      {subtitle && (
        <div className="text-xs text-dark-6 mt-1">
          {subtitle}
        </div>
      )}

    </div>
  )
}