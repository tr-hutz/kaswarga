interface RawResidentRow {
  name?: unknown
  block?: unknown
  house_number?: unknown
  email?: unknown
}

interface ValidatedResident {
  name: string
  block: string
  house_number: string
  email: string
}

type ValidationResult =
  | { success: true; inserts: ValidatedResident[] }
  | { success: false; message: string }

export function validateImportResidents(
  rows: RawResidentRow[],
  existingData: { block: string; house_number: string }[] = []
): ValidationResult {

  const inserts = []

  // duplicate dalam file
  const seen = new Set()

  // duplicate database
  const existingSet = new Set(
    existingData.map(
      x => `${x.block}-${x.house_number}`
    )
  )

  for (let i = 0; i < rows.length; i++) {

    const row = rows[i]

    const name         = String(row.name         || '').trim()
    const block        = String(row.block        || '').trim()
    const house_number = String(row.house_number || '').trim()
    const email        = String(row.email        || '').trim()

    const rowNumber = i + 2

    // ===== EMPTY VALIDATION =====
    if (!name || !block || !house_number) {
      return {
        success: false,
        message:
          `Baris ${rowNumber}: field wajib kosong`
      }
    }

    // ===== DUPLICATE FILE =====
    const key = `${block}-${house_number}`

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
      name,
      block,
      house_number,
      email
    })
  }

  return {
    success: true,
    inserts
  }
}
