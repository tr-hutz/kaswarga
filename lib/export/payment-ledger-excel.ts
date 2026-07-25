import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { MONTHS } from '@/lib/constants/months'

export interface ResidentLedgerRow {
    id:             string
    name:           string
    block:          string
    houseNumber:    string | number
    monthlyAmounts: Record<number, number>
}

interface LedgerOptions {
    rtName:     string
    year:       number
    residents:  ResidentLedgerRow[]
    monthlyFee: number
}

const C = {
    NO:    1,
    BLOK:  2,
    HOUSE: 3,
    NAMA:  4,
    JAN:   5,  // cols 5–16 = Jan–Des
    TOTAL: 17,
} as const

const ARGB = {
    DARK_BLUE:  'FF1E3A5F',
    WHITE:      'FFFFFFFF',
    LIGHT_BLUE: 'FFE3F2FD',
    PAID_BG:    'FFE8F5E9',
    PAID_TEXT:  'FF2E7D32',
    SUBTTL_BG:  'FFF5F5F5',
    MUTED:      'FF888888',
    BORDER:     'FFDDDDDD',
    BORDER_SUB: 'FFAAAAAA',
} as const

function cellBorder(argb = ARGB.BORDER): Partial<ExcelJS.Borders> {
    return {
        top:    { style: 'hair', color: { argb } },
        bottom: { style: 'hair', color: { argb } },
        left:   { style: 'hair', color: { argb } },
        right:  { style: 'hair', color: { argb } },
    }
}

function solidFill(argb: string): ExcelJS.Fill {
    return { type: 'pattern', pattern: 'solid', fgColor: { argb } }
}

export async function exportPaymentLedger({ rtName, year, residents, monthlyFee }: LedgerOptions) {
    const wb = new ExcelJS.Workbook()
    wb.creator = 'KasWarga'
    wb.created = new Date()

    const ws = wb.addWorksheet(`Catatan Pemasukan Kas ${year}`, {
        pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
    })

    // Column widths
    ws.getColumn(C.NO).width    = 5
    ws.getColumn(C.BLOK).width  = 9
    ws.getColumn(C.HOUSE).width = 10
    ws.getColumn(C.NAMA).width  = 28
    for (let m = 1; m <= 12; m++) {
        ws.getColumn(C.JAN + m - 1).width = 13
    }
    ws.getColumn(C.TOTAL).width = 15

    // ── Row 1: Title ──────────────────────────────────────────────────────────
    ws.addRow([`LAPORAN KAS ${rtName.toUpperCase()} — TAHUN ${year}`])
    ws.mergeCells('A1:Q1')
    const titleCell = ws.getCell('A1')
    titleCell.font      = { bold: true, size: 14, color: { argb: ARGB.DARK_BLUE } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    ws.getRow(1).height = 32

    // ── Row 2: Subtitle ───────────────────────────────────────────────────────
    const genDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    ws.addRow([`Iuran Bulanan: Rp ${monthlyFee.toLocaleString('id-ID')}  •  Dibuat: ${genDate}`])
    ws.mergeCells('A2:Q2')
    const subtitleCell = ws.getCell('A2')
    subtitleCell.font      = { size: 9, italic: true, color: { argb: ARGB.MUTED } }
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    ws.getRow(2).height = 18

    // ── Row 3: Spacer ─────────────────────────────────────────────────────────
    ws.addRow([])
    ws.getRow(3).height = 6

    // ── Row 4: Header ─────────────────────────────────────────────────────────
    const headerRow = ws.addRow([
        'No', 'Blok', 'No Rumah', 'Nama Penghuni',
        ...MONTHS.map(m => m.name),
        'TOTAL',
    ])
    headerRow.height = 32
    headerRow.eachCell({ includeEmpty: true }, (cell, col) => {
        if (col < 1 || col > 17) return
        cell.fill      = solidFill(ARGB.DARK_BLUE)
        cell.font      = { bold: true, color: { argb: ARGB.WHITE }, size: 9 }
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    })
    // Nama left-aligned
    headerRow.getCell(C.NAMA).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 }

    // Freeze header rows + first 4 columns (block/house/name are fixed)
    ws.views = [{ state: 'frozen', ySplit: 4, xSplit: 4 }]

    // Sort: block asc, house_number asc (numeric)
    const sorted = [...residents].sort((a, b) => {
        const bc = String(a.block).localeCompare(String(b.block))
        return bc !== 0 ? bc : Number(a.houseNumber) - Number(b.houseNumber)
    })

    const blocks: string[] = []
    for (const r of sorted) {
        if (!blocks.includes(r.block)) blocks.push(r.block)
    }

    let seq = 1
    const grandMonthTotals: number[] = Array(12).fill(0)
    let grandTotal = 0

    for (const block of blocks) {
        const blockResidents = sorted.filter(r => r.block === block)

        // ── Block header ──────────────────────────────────────────────────────
        const blkRow = ws.addRow([`  Blok ${block}`])
        ws.mergeCells(`A${blkRow.number}:Q${blkRow.number}`)
        blkRow.getCell(1).fill      = solidFill(ARGB.LIGHT_BLUE)
        blkRow.getCell(1).font      = { bold: true, size: 9, color: { argb: ARGB.DARK_BLUE } }
        blkRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' }
        blkRow.height = 20

        const blockMonthTotals: number[] = Array(12).fill(0)
        let blockTotal = 0

        for (const resident of blockResidents) {
            const monthCells: (number | string)[] = []
            let rowTotal = 0

            for (let m = 1; m <= 12; m++) {
                const amount = resident.monthlyAmounts[m] ?? 0
                monthCells.push(amount > 0 ? amount : '')
                if (amount > 0) {
                    blockMonthTotals[m - 1]  += amount
                    blockTotal               += amount
                    grandMonthTotals[m - 1]  += amount
                    grandTotal               += amount
                    rowTotal                 += amount
                }
            }

            const dataRow = ws.addRow([
                seq++,
                block,
                resident.houseNumber,
                resident.name,
                ...monthCells,
                rowTotal > 0 ? rowTotal : '',
            ])
            dataRow.height = 18

            for (let col = 1; col <= 17; col++) {
                const cell = dataRow.getCell(col)
                cell.border = cellBorder()

                if (col >= C.JAN && col < C.TOTAL) {
                    const m    = col - C.JAN + 1
                    const paid = (resident.monthlyAmounts[m] ?? 0) > 0
                    cell.fill      = solidFill(paid ? ARGB.PAID_BG : ARGB.WHITE)
                    cell.font      = { size: 9, color: { argb: paid ? ARGB.PAID_TEXT : ARGB.BORDER } }
                    cell.numFmt    = '#,##0'
                    cell.alignment = { horizontal: 'right', vertical: 'middle' }
                } else if (col === C.TOTAL) {
                    cell.font      = { bold: true, size: 9 }
                    cell.numFmt    = '#,##0'
                    cell.alignment = { horizontal: 'right', vertical: 'middle' }
                } else if (col === C.NAMA) {
                    cell.font      = { size: 9 }
                    cell.alignment = { vertical: 'middle', indent: 1 }
                } else {
                    cell.font      = { size: 9 }
                    cell.alignment = { horizontal: 'center', vertical: 'middle' }
                }
            }
        }

        // ── Block subtotal ────────────────────────────────────────────────────
        const subRow = ws.addRow([
            '', '', '', `  Subtotal ${block}`,
            ...blockMonthTotals.map(v => v > 0 ? v : ''),
            blockTotal > 0 ? blockTotal : '',
        ])
        subRow.height = 18
        subRow.eachCell({ includeEmpty: true }, (cell, col) => {
            if (col < 1 || col > 17) return
            cell.fill   = solidFill(ARGB.SUBTTL_BG)
            cell.font   = { bold: true, size: 9, italic: true }
            cell.border = {
                top:    { style: 'thin', color: { argb: ARGB.BORDER_SUB } },
                bottom: { style: 'thin', color: { argb: ARGB.BORDER_SUB } },
            }
            if (col >= C.JAN) {
                cell.numFmt    = '#,##0'
                cell.alignment = { horizontal: 'right', vertical: 'middle' }
            } else if (col === C.NAMA) {
                cell.alignment = { vertical: 'middle', indent: 1 }
            }
        })
    }

    // ── Grand total ───────────────────────────────────────────────────────────
    const gtRow = ws.addRow([
        '', '', '', '  GRAND TOTAL',
        ...grandMonthTotals.map(v => v > 0 ? v : ''),
        grandTotal > 0 ? grandTotal : '',
    ])
    gtRow.height = 24
    gtRow.eachCell({ includeEmpty: true }, (cell, col) => {
        if (col < 1 || col > 17) return
        cell.fill = solidFill(ARGB.DARK_BLUE)
        cell.font = { bold: true, size: 10, color: { argb: ARGB.WHITE } }
        if (col >= C.JAN) {
            cell.numFmt    = '#,##0'
            cell.alignment = { horizontal: 'right', vertical: 'middle' }
        } else if (col === C.NAMA) {
            cell.alignment = { vertical: 'middle', indent: 1 }
        }
    })

    const buffer = await wb.xlsx.writeBuffer()
    const blob   = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    })
    saveAs(blob, `KAS-${rtName.replace(/\s+/g, '-')}-${year}.xlsx`)
}
