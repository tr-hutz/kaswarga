export default function YearSelector({ value, onChange }: { value: number; onChange: (y: number) => void }) {

  return (

    <select
      value={value}
      onChange={e =>
        onChange(
          Number(
            e.target.value
          )
        )
      }
      className="
        h-10 px-3
        border border-divider rounded-lg
        bg-surface text-foreground text-sm
        outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
        transition-colors
      "
    >

      {[
        value - 1,
        value,
        value + 1
      ].map(year => (

        <option
          key={year}
          value={year}
        >
          {year}
        </option>

      ))}

    </select>
  )
}