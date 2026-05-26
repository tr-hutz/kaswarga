export default function InsightCard({

  title,

  value

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
        className="
          text-3xl
          font-bold
          mt-2
        "
      >
        {value}
      </div>

    </div>
  )
}