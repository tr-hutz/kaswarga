import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { bulanList, formatBulan, formatAccounting } from '../../../lib/utils'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

const groupByBulan = (rows = []) => {
  const map = {}
  rows.forEach(r => {
    const m = new Date(r.tanggal).getMonth() + 1
    if (!map[m]) map[m] = []
    map[m].push(r)
  })
  return map
}

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const tahun = searchParams.get('tahun') || new Date().getFullYear()

  const start = `${tahun}-01-01`
  const end = `${parseInt(tahun) + 1}-01-01`

  const { data: pemasukan } = await supabase
    .from('pembayaran')
    .select(`*, warga(nama, blok, no_rumah)`)
    .gte('tanggal', start)
    .lt('tanggal', end)

  const { data: pengeluaran } = await supabase
    .from('pengeluaran')
    .select('*')
    .gte('tanggal', start)
    .lt('tanggal', end)

  const { data: profil } = await supabase
    .from('profil_rt')
    .select('*')
    .limit(1)
    .single()

  const totalMasuk = (pemasukan || []).reduce((a, b) => a + (b.jumlah_bayar || 0), 0)
  const totalKeluar = (pengeluaran || []).reduce((a, b) => a + (b.nominal || 0), 0)
  const saldo = totalMasuk - totalKeluar

  // ===== PDF =====
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let page = pdfDoc.addPage([842, 1191])
  let y = 1140
  const MARGIN_BOTTOM = 70
  const leftX = 50
  const rightX = page.getWidth() - 260
  const COL_RIGHT = 700 // kolom angka kanan

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
  const drawTextRight = (text, xRight, yPos, size = 9, useBold = false) => {
    const f = useBold ? bold : font
    const w = f.widthOfTextAtSize(text, size)
    page.drawText(text, { x: xRight - w, y: yPos, size, font: f })
  }

  const drawDivider = (yy) => {
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

    // kiri
    page.drawText('LAPORAN KAS WARGA', {
      x: leftX, y: topY, size: 16, font: bold
    })
    page.drawText(`Tahun ${tahun}`, {
      x: leftX, y: topY - 18, size: 11, font
    })

    // kanan
    if (logoImage) {
      page.drawImage(logoImage, {
        x: rightX,
        y: topY - 42,
        width: 42,
        height: 42
      })
    }

    const infoX = rightX + 50

    page.drawText(profil?.nama_perumahan || '-', {
      x: infoX, y: topY, size: 12, font: bold
    })
    page.drawText(`RT ${profil?.nama_rt || '-'}`, {
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

    // kiri
    page.drawText('RINGKASAN KAS', {
      x: leftX, y: sY, size: 12, font: bold
    })

    page.drawText('Masuk', { x: leftX, y: sY - 16, size: 10, font })
    drawTextRight(formatAccounting(totalMasuk), 300, sY - 16)

    page.drawText('Keluar', { x: leftX, y: sY - 32, size: 10, font })
    drawTextRight(formatAccounting(totalKeluar), 300, sY - 32)

    page.drawText('Saldo', { x: leftX, y: sY - 48, size: 10, font: bold })
    drawTextRight(formatAccounting(saldo), 300, sY - 48, 10, true)

    // kanan
    page.drawText('INFORMASI REKENING', {
      x: rightX, y: sY, size: 12, font: bold
    })
    page.drawText(`Bank : ${profil?.nama_bank || '-'}`, {
      x: rightX, y: sY - 16, size: 10, font
    })
    page.drawText(`No Rek : ${profil?.nomor_rekening || '-'}`, {
      x: rightX, y: sY - 32, size: 10, font
    })
    page.drawText(`a.n : ${profil?.nama_rekening || '-'}`, {
      x: rightX, y: sY - 48, size: 10, font
    })

    y -= 70
    drawDivider(y + 10)
    y -= 8
  }

  // ===== pemasukan =====
  const drawPemasukan = () => {
    ensureSpace(24)
    page.drawText('PEMASUKAN', { x: leftX, y, size: 12, font: bold })
    y -= 18

    const byMonth = groupByBulan(pemasukan || [])

    Object.keys(byMonth)
      .sort((a, b) => a - b)
      .forEach((m) => {
        const bulanNama = bulanList.find(b => b.id == m)?.nama

        const rows = byMonth[m]
          .sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal))

        const totalBulan = rows.reduce(
          (sum, r) => sum + (r.jumlah_bayar || 0), 0
        )

        // ===== HEADER BULAN + TOTAL =====
        ensureSpace(24)

        const headerY = y

        page.drawText(`— ${bulanNama}`, {
          x: leftX,
          y,
          size: 11,
          font: bold
        })

        drawTextRight(
          formatAccounting(totalBulan),
          COL_RIGHT,
          y,
          11,
          true
        )

        // ===== GARIS DIVIDER DI BAWAH HEADER BULAN =====
        page.drawLine({
          start: { x: leftX, y: headerY - 3 },
          end: { x: COL_RIGHT, y: headerY - 3 },
          thickness: 0.5
        })

        y = headerY - 18

        // ===== ROWS =====
        rows.forEach(p => {
          if (y < MARGIN_BOTTOM) {
            newPage()

            // redraw header bulan
            page.drawText(`— ${bulanNama}`, {
              x: leftX,
              y,
              size: 11,
              font: bold
            })

            drawTextRight(
              formatAccounting(totalBulan),
              COL_RIGHT,
              y,
              11,
              true
            )

            y -= 16
          }

          const tgl = new Date(p.tanggal).getDate()

          page.drawText(String(tgl), { x: 50, y, size: 9, font })

          page.drawText(
            `${p.warga?.nama || '-'} (${p.warga?.blok || '-'}-${p.warga?.no_rumah || '-'})`,
            { x: 90, y, size: 9, font }
          )

          page.drawText(
            formatBulan(p.bulan_dibayar),
            { x: 320, y, size: 9, font }
          )

          drawTextRight(
            formatAccounting(p.jumlah_bayar),
            COL_RIGHT,
            y
          )

          y -= 14
        })

        y -= 10
      })
  }

  // ===== pengeluaran =====
  const drawPengeluaran = () => {
    ensureSpace(24)
    page.drawText('PENGELUARAN', { x: leftX, y, size: 12, font: bold })
    y -= 18

    const byMonth = groupByBulan(pengeluaran || [])

    Object.keys(byMonth)
      .sort((a, b) => a - b)
      .forEach((m) => {
        const bulanNama = bulanList.find(b => b.id == m)?.nama

        const rows = byMonth[m]
          .sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal))

        const totalBulan = rows.reduce(
          (sum, r) => sum + (r.nominal || 0), 0
        )

        ensureSpace(24)

        const headerY = y

        page.drawText(`— ${bulanNama}`, {
          x: leftX,
          y,
          size: 11,
          font: bold
        })

        drawTextRight(
          formatAccounting(totalBulan),
          COL_RIGHT,
          y,
          11,
          true
        )

        page.drawLine({
          start: { x: leftX, y: headerY - 3 },
          end: { x: COL_RIGHT, y: headerY - 3 },
          thickness: 0.5
        })

        y = headerY - 18

        rows.forEach(p => {
          if (y < MARGIN_BOTTOM) {
            newPage()

            page.drawText(`— ${bulanNama}`, {
              x: leftX,
              y,
              size: 11,
              font: bold
            })

            drawTextRight(
              formatAccounting(totalBulan),
              COL_RIGHT,
              y,
              11,
              true
            )

            y -= 16
          }

          const tgl = new Date(p.tanggal).getDate()

          page.drawText(String(tgl), { x: 50, y, size: 9, font })
          page.drawText(p.kategori || '-', { x: 90, y, size: 9, font })
          page.drawText(p.deskripsi || '-', { x: 260, y, size: 9, font })

          drawTextRight(
            formatAccounting(p.nominal),
            COL_RIGHT,
            y
          )

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
      x: rightSign,
      y: yTtd + 10,
      size: 9,
      font
    })

    // Ketua
    page.drawText('Ketua RT', { x: leftSign, y: yTtd, size: 10, font })
    page.drawLine({
      start: { x: leftSign, y: yTtd - 70 },
      end: { x: leftSign + 160, y: yTtd - 70 }
    })
    page.drawText(profil?.nama_ketua || '-', {
      x: leftSign,
      y: yTtd - 90,
      size: 10,
      font: bold
    })

    // Bendahara
    page.drawText('Bendahara', { x: rightSign, y: yTtd, size: 10, font })
    page.drawLine({
      start: { x: rightSign, y: yTtd - 70 },
      end: { x: rightSign + 160, y: yTtd - 70 }
    })
    page.drawText(profil?.nama_bendahara || '-', {
      x: rightSign,
      y: yTtd - 90,
      size: 10,
      font: bold
    })

    y -= 120
  }

  // ===== compose =====
  drawHeader()
  drawDivider(y - 6)
  y -= 18

  drawSummary()
  drawPemasukan()
  drawPengeluaran()
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

  return new NextResponse(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=laporan-${tahun}.pdf`
    }
  })
}