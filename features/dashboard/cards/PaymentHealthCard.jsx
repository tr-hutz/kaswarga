export default function PaymentHealthCard({

  data

}) {

  return (

    <div
      className="
        rounded-2xl
        border
        p-6
      "
    >

      <h2
        className="
          text-lg
          font-semibold
          mb-4
        "
      >
        Health Pembayaran
      </h2>

      <div
        className="
          space-y-3
        "
      >

        <div>
          Lunas:
          {' '}
          {data.lunas}
        </div>

        <div>
          Hampir Lunas:
          {' '}
          {data.hampirLunas}
        </div>

        <div>
          Menunggak:
          {' '}
          {data.menunggak}
        </div>

        <div>
          Belum Bayar:
          {' '}
          {data.belumBayar}
        </div>

      </div>

    </div>
  )
}