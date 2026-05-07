export function validateImportWarga(rows, existingData = []) {

  const inserts = []

  // duplicate dalam file
  const seen = new Set()

  // duplicate database
  const existingSet = new Set(
    existingData.map(
      x => `${x.blok}-${x.no_rumah}`
    )
  )

  for (let i = 0; i < rows.length; i++) {

    const row = rows[i]

    const nama = String(row.nama || '').trim()
    const blok = String(row.blok || '').trim()
    const no_rumah = String(row.no_rumah || '').trim()
    const email = String(row.email || '').trim()

    const rowNumber = i + 2

    // ===== EMPTY VALIDATION =====
    if (!nama || !blok || !no_rumah) {
      return {
        success: false,
        message:
          `Baris ${rowNumber}: field wajib kosong`
      }
    }

    // ===== DUPLICATE FILE =====
    const key = `${blok}-${no_rumah}`

    if (seen.has(key)) {
      return {
        success: false,
        message:
          `Baris ${rowNumber}: duplicate dalam file (${key})`
      }
    }

    seen.add(key)

    // ===== DUPLICATE DATABASE =====
    if (existingSet.has(key)) {
      return {
        success: false,
        message:
          `Baris ${rowNumber}: data sudah ada di database (${key})`
      }
    }

    inserts.push({
      nama,
      blok,
      no_rumah,
      email
    })
  }

  return {
    success: true,
    inserts
  }
}