import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { formatBulan, formatRupiah } from '../../../lib/utils'
import { PDFDocument, StandardFonts } from 'pdf-lib'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const tahun = searchParams.get('tahun')

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

  const pdfDoc = await PDFDocument.create()

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let page = pdfDoc.addPage([842, 1191])
  let y = 1140
  const MARGIN_BOTTOM = 60

  const newPage = () => {
    page = pdfDoc.addPage([842, 1191])
    y = 1140
  }

  const drawText = (text, x = 50, size = 10, useBold = false) => {
    if (y < MARGIN_BOTTOM) newPage()

    page.drawText(text, {
      x,
      y,
      size,
      font: useBold ? bold : font
    })

    y -= 16
  }

  // ===== HEADER =====
  drawText('LAPORAN KAS WARGA', 50, 18, true)
  drawText(`Tahun ${tahun}`, 50, 12)

  y -= 10

  const totalMasuk = pemasukan?.reduce((a, b) => a + b.jumlah_bayar, 0) || 0
  const totalKeluar = pengeluaran?.reduce((a, b) => a + b.nominal, 0) || 0
  const saldo = totalMasuk - totalKeluar

  drawText('RINGKASAN KAS', 50, 12, true)
  drawText(`Total Masuk : Rp ${formatRupiah(totalMasuk)}`)
  drawText(`Total Keluar: Rp ${formatRupiah(totalKeluar)}`)
  drawText(`Saldo       : Rp ${formatRupiah(saldo)}`)

  y -= 20

  // ===== PEMASUKAN =====
  const drawHeaderPemasukan = () => {
    drawText('PEMASUKAN', 50, 12, true)
    drawText('Tanggal', 50, 10, true)
    page.drawText('Warga', { x: 140, y, size: 10, font: bold })
    page.drawText('Bulan', { x: 340, y, size: 10, font: bold })
    page.drawText('Jumlah', { x: 550, y, size: 10, font: bold })
    y -= 20
  }

  drawHeaderPemasukan()

  pemasukan?.forEach(p => {
    if (y < MARGIN_BOTTOM) {
      newPage()
      drawHeaderPemasukan()
    }

    page.drawText(new Date(p.tanggal).toLocaleDateString(), { x: 50, y, size: 9, font })

    page.drawText(
      `${p.warga?.nama || '-'} (${p.warga?.blok || '-'}-${p.warga?.no_rumah || '-'})`,
      { x: 140, y, size: 9, font }
    )

    page.drawText(formatBulan(p.bulan_dibayar), { x: 340, y, size: 9, font })

    page.drawText(`Rp ${formatRupiah(p.jumlah_bayar)}`, { x: 550, y, size: 9, font })

    y -= 16
  })

  y -= 25

  // ===== PENGELUARAN =====
  const drawHeaderPengeluaran = () => {
    drawText('PENGELUARAN', 50, 12, true)
    drawText('Tanggal', 50, 10, true)
    page.drawText('Kategori', { x: 140, y, size: 10, font: bold })
    page.drawText('Keterangan', { x: 280, y, size: 10, font: bold })
    page.drawText('Jumlah', { x: 550, y, size: 10, font: bold })
    y -= 20
  }

  drawHeaderPengeluaran()

  pengeluaran?.forEach(p => {
    if (y < MARGIN_BOTTOM) {
      newPage()
      drawHeaderPengeluaran()
    }

    page.drawText(new Date(p.tanggal).toLocaleDateString(), { x: 50, y, size: 9, font })
    page.drawText(p.kategori || '-', { x: 140, y, size: 9, font })
    page.drawText(p.deskripsi || '-', { x: 280, y, size: 9, font })
    page.drawText(`Rp ${formatRupiah(p.nominal)}`, { x: 550, y, size: 9, font })

    y -= 16
  })

  y -= 30

  // ===== BREAKDOWN =====
  drawText('BREAKDOWN PENGELUARAN', 50, 12, true)

  const kategoriMap = {}
  pengeluaran?.forEach(p => {
    kategoriMap[p.kategori] =
      (kategoriMap[p.kategori] || 0) + p.nominal
  })

  Object.entries(kategoriMap).forEach(([k, v]) => {
    const persen = totalKeluar ? ((v / totalKeluar) * 100).toFixed(1) : 0
    drawText(`${k}: Rp ${formatRupiah(v)} (${persen}%)`)
  })

  // ===== NOMOR HALAMAN =====
  const pages = pdfDoc.getPages()

  pages.forEach((p, i) => {
    p.drawText(`Halaman ${i + 1} dari ${pages.length}`, {
      x: 700,
      y: 20,
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