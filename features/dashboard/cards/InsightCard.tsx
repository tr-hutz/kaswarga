// @ts-nocheck
export default function InsightCard({

  title,
  value,
  subtitle,
  valueColor = 'text-gray-900'

}) {

  return (

    <div
      className="
        rounded-2xl
        border
        p-5
        bg-white
      "
    >

      <div
        className="
          text-sm
          text-gray-500
        "
      >
        {title}
      </div>

      <div
        className={`
          text-2xl
          font-bold
          mt-2
          leading-tight
          ${valueColor}
        `}
      >
        {value}
      </div>

      {subtitle && (
        <div className="text-xs text-gray-400 mt-1">
          {subtitle}
        </div>
      )}

    </div>
  )
}