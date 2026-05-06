'use client'

export default function InsightBox({ title, value, color = 'gray' }) {
  return (
    <div className={`p-4 rounded shadow bg-${color}-50 border border-${color}-200`}>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="font-semibold">{value}</p>
    </div>
  )
}