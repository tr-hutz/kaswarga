import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { monthList, formatMonths, formatAccounting } from '../../../../lib/utils'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

const maskAccountNumber = (num: string | number | null) => {
  if (!num) return '-'
  const s = String(num)
  if (s.length <= 4) return s
  return 'x'.repeat(s.length - 4) + s.slice(-4)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const groupByMonth = (rows: any[] = []): Record<number, any[]> => {
  const map: Record<number, any[]> = {}
  rows.forEach(r => {
    const m = new Date(r.tanggal).getMonth() + 1
    if (!map[m]) map[m] = []
    map[m].push(r)
  })
  return map
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const yearParam = searchParams.get('year') || String(new Date().getFullYear())
  const year = yearParam

  const start = `${year}-01-01`
  const end = `${parseInt(year) + 1}-01-01`

  const { data: profil } = await supabase
    .from('rt')
    .select('*')
    .limit(1)
    .single()

  const { data: members } = await supabase
    .from('user_membership')
    .select('role, user:users(nama)')
    .eq('rt_id', profil?.id ?? '')
    .in('role', ['admin', 'bendahara'])

  const chairmanName =
    members?.find(m => m.role === 'admin')
      ?.user?.nama || '-'

  const treasurerName =
    members?.find(m => m.role === 'bendahara')
      ?.user?.nama || '-'

  const { data: incomeRows } = await supabase
    .from('pembayaran')
    .select(`*, warga(nama, blok, no_rumah)`)
    .gte('tanggal', start)
    .lt('tanggal', end)

  const { data: expenseRows } = await supabase
    .from('pengeluaran')
    .select('*')
    .gte('tanggal', start)
    .lt('tanggal', end)

  const totalIncome  = (incomeRows  || []).reduce((a, b) => a + (b.jumlah_bayar || 0), 0)
  const totalExpense = (expenseRows || []).reduce((a, b) => a + (b.nominal     || 0), 0)
  const balance = totalIncome - totalExpense

  // ===== PDF =====
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let page = pdfDoc.addPage([842, 1191])
  let y = 1140
  const MARGIN_BOTTOM = 70
  const leftX = 50
  const rightX = page.getWidth() - 260
  const COL_RIGHT = page.getWidth() - leftX

  // ===== logo =====
  let logoImage = null
  if (profil?.logo_url) {
    try {
      const res = await fetch(profil.logo_url)
      const bytes = await res.arrayBuffer()
      try {
        logoImage = await pdfDoc.embedPng(bytes)
      } catch {
        logoImage = await pdfDoc.embedJpg(bytes)
      }
    } catch { }
  }

  // ===== helpers =====
  const drawTextRight = (text: string, xRight: number, yPos: number, size = 9, useBold = false) => {
    const f = useBold ? bold : font
    const w = f.widthOfTextAtSize(text, size)
    page.drawText(text, { x: xRight - w, y: yPos, size, font: f })
  }

  const drawDivider = (yy: number) => {
    page.drawLine({
      start: { x: leftX, y: yy },
      end: { x: page.getWidth() - leftX, y: yy },
      thickness: 1,
      color: rgb(0.85, 0.85, 0.85)
    })
  }

  const newPage = () => {
    page = pdfDoc.addPage([842, 1191])
    y = 1140
    drawHeader()
    drawDivider(y - 6)
    y -= 18
  }

  const ensureSpace = (need = 20) => {
    if (y < MARGIN_BOTTOM + need) newPage()
  }

  // ===== header =====
  const drawHeader = () => {
    const topY = y

    page.drawText('LAPORAN KAS WARGA', {
      x: leftX, y: topY, size: 16, font: bold
    })
    page.drawText(`Tahun ${year}`, {
      x: leftX, y: topY - 18, size: 11, font
    })

    if (logoImage) {
      page.drawImage(logoImage, {
        x: rightX,
        y: topY - 42,
        width: 42,
        height: 42
      })
    }

    const infoX = rightX + 50

    page.drawText(profil?.nama || '-', {
      x: infoX, y: topY, size: 12, font: bold
    })
    page.drawText(`RT ${profil?.kode || '-'}`, {
      x: infoX, y: topY - 15, size: 10, font
    })
    page.drawText(profil?.alamat || '-', {
      x: infoX, y: topY - 28, size: 9, font
    })

    y -= 70
  }

  // ===== summary =====
  const drawSummary = () => {
    const sY = y

    page.drawText('RINGKASAN KAS', {
      x: leftX, y: sY, size: 12, font: bold
    })

    page.drawText('Masuk', { x: leftX, y: sY - 16, size: 10, font })
    drawTextRight(formatAccounting(totalIncome), 300, sY - 16)

    page.drawText('Keluar', { x: leftX, y: sY - 32, size: 10, font })
    drawTextRight(formatAccounting(totalExpense), 300, sY - 32)

    page.drawText('Saldo', { x: leftX, y: sY - 48, size: 10, font: bold })
    drawTextRight(formatAccounting(balance), 300, sY - 48, 10, true)

    page.drawText('INFORMASI REKENING', {
      x: rightX, y: sY, size: 12, font: bold
    })
    page.drawText('Bank', { x: rightX, y: sY - 16, size: 10, font })
    drawTextRight(profil?.nama_bank || '-', COL_RIGHT, sY - 16)

    page.drawText('No. Rek', { x: rightX, y: sY - 32, size: 10, font })
    drawTextRight(maskAccountNumber(profil?.nomor_rekening ?? null), COL_RIGHT, sY - 32)

    page.drawText('A.n', { x: rightX, y: sY - 48, size: 10, font })
    drawTextRight(profil?.atas_nama || '-', COL_RIGHT, sY - 48)

    y -= 70
    drawDivider(y + 10)
    y -= 8
  }

  // ===== income =====
  const drawIncome = () => {
    ensureSpace(24)
    page.drawText('PEMASUKAN', { x: leftX, y, size: 12, font: bold })
    y -= 18

    const byMonth = groupByMonth(incomeRows || [])

    Object.keys(byMonth)
      .sort((a, b) => Number(a) - Number(b))
      .forEach((m) => {
        const monthName = monthList.find(b => b.id === Number(m))?.name

        const rows = (byMonth as Record<string, any[]>)[m]
          .sort((a: any, b: any) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime())

        const monthTotal = rows.reduce(
          (sum: any, r: any) => sum + (r.jumlah_bayar || 0), 0
        )

        ensureSpace(24)

        const headerY = y

        page.drawText(`— ${monthName}`, {
          x: leftX, y, size: 11, font: bold
        })

        drawTextRight(formatAccounting(monthTotal), COL_RIGHT, y, 11, true)

        page.drawLine({
          start: { x: leftX, y: headerY - 3 },
          end: { x: COL_RIGHT, y: headerY - 3 },
          thickness: 0.5
        })

        y = headerY - 18

        rows.forEach((p: any) => {
          if (y < MARGIN_BOTTOM) {
            newPage()
            page.drawText(`— ${monthName}`, { x: leftX, y, size: 11, font: bold })
            drawTextRight(formatAccounting(monthTotal), COL_RIGHT, y, 11, true)
            y -= 16
          }

          const tgl = new Date(p.tanggal).getDate()
          page.drawText(String(tgl), { x: 50, y, size: 9, font })
          page.drawText(
            `${p.warga?.nama || '-'} (${p.warga?.blok || '-'}-${p.warga?.no_rumah || '-'})`,
            { x: 90, y, size: 9, font }
          )
          page.drawText(formatMonths(p.bulan_dibayar), { x: 320, y, size: 9, font })
          drawTextRight(formatAccounting(p.jumlah_bayar), COL_RIGHT, y)
          y -= 14
        })

        y -= 10
      })
  }

  // ===== expense =====
  const drawExpense = () => {
    ensureSpace(24)
    page.drawText('PENGELUARAN', { x: leftX, y, size: 12, font: bold })
    y -= 18

    const byMonth = groupByMonth(expenseRows || [])

    Object.keys(byMonth)
      .sort((a, b) => Number(a) - Number(b))
      .forEach((m) => {
        const monthName = monthList.find(b => b.id === Number(m))?.name

        const rows = (byMonth as Record<string, any[]>)[m]
          .sort((a: any, b: any) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime())

        const monthTotal = rows.reduce(
          (sum: any, r: any) => sum + (r.nominal || 0), 0
        )

        ensureSpace(24)

        const headerY = y

        page.drawText(`— ${monthName}`, {
          x: leftX, y, size: 11, font: bold
        })

        drawTextRight(formatAccounting(monthTotal), COL_RIGHT, y, 11, true)

        page.drawLine({
          start: { x: leftX, y: headerY - 3 },
          end: { x: COL_RIGHT, y: headerY - 3 },
          thickness: 0.5
        })

        y = headerY - 18

        rows.forEach((p: any) => {
          if (y < MARGIN_BOTTOM) {
            newPage()
            page.drawText(`— ${monthName}`, { x: leftX, y, size: 11, font: bold })
            drawTextRight(formatAccounting(monthTotal), COL_RIGHT, y, 11, true)
            y -= 16
          }

          const tgl = new Date(p.tanggal).getDate()
          page.drawText(String(tgl), { x: 50, y, size: 9, font })
          page.drawText(p.kategori || '-', { x: 90, y, size: 9, font })
          page.drawText(p.deskripsi || '-', { x: 260, y, size: 9, font })
          drawTextRight(formatAccounting(p.nominal), COL_RIGHT, y)
          y -= 14
        })

        y -= 10
      })
  }

  // ===== tanda tangan =====
  const drawSignature = () => {
    ensureSpace(180)

    const SIGNATURE_SPACING = 40
    const yTtd = y - SIGNATURE_SPACING
    const leftSign = 120
    const rightSign = page.getWidth() - 300

    const today = new Date().toLocaleDateString('id-ID')

    page.drawText(`Tanggal: ${today}`, {
      x: rightSign, y: yTtd + 10, size: 9, font
    })

    page.drawText('Ketua RT', { x: leftSign, y: yTtd, size: 10, font })
    page.drawLine({
      start: { x: leftSign, y: yTtd - 70 },
      end: { x: leftSign + 160, y: yTtd - 70 }
    })
    page.drawText(chairmanName, {
      x: leftSign, y: yTtd - 90, size: 10, font: bold
    })

    page.drawText('Bendahara', { x: rightSign, y: yTtd, size: 10, font })
    page.drawLine({
      start: { x: rightSign, y: yTtd - 70 },
      end: { x: rightSign + 160, y: yTtd - 70 }
    })
    page.drawText(treasurerName, {
      x: rightSign, y: yTtd - 90, size: 10, font: bold
    })

    y -= 120
  }

  // ===== compose =====
  drawHeader()
  drawDivider(y - 6)
  y -= 18

  drawSummary()
  drawIncome()
  drawExpense()
  drawSignature()

  // ===== nomor halaman =====
  const pages = pdfDoc.getPages()
  pages.forEach((p, i) => {
    p.drawText(`Halaman ${i + 1} dari ${pages.length}`, {
      x: p.getWidth() - 140,
      y: 24,
      size: 8,
      font
    })
  })

  const pdfBytes = await pdfDoc.save()

  const rtSlug = (profil?.kode || profil?.nama || 'rt')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')

  const filename = `laporan-kas-${year}-${rtSlug}.pdf`

  return new NextResponse(pdfBytes as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  })
}
