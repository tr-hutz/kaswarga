export default function YearSelector({

  value,

  onChange

}) {

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
        border
        rounded-lg
        px-3
        py-2
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