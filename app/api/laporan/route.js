import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { PDFDocument, StandardFonts } from 'pdf-lib'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const tahun = searchParams.get('tahun')

  // ambil data pemasukan
  const { data: pemasukan } = await supabase
    .from('pembayaran')
    .select('*')
    .eq('tahun', tahun)

  // ambil data pengeluaran
  const { data: pengeluaran } = await supabase
    .from('pengeluaran')
    .select('*')
    .eq('tahun', tahun)

  // buat PDF
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([600, 800])

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

  let y = 750

  const drawText = (text) => {
    page.drawText(text, { x: 50, y, size: 10, font })
    y -= 15
  }

  drawText(`LAPORAN KAS TAHUN ${tahun}`)
  drawText('-----------------------------')

  // PEMASUKAN
  drawText('PEMASUKAN:')
  let totalMasuk = 0

  pemasukan?.forEach(p => {
    drawText(`Rp ${p.jumlah_bayar}`)
    totalMasuk += p.jumlah_bayar
  })

  drawText(`Total Masuk: Rp ${totalMasuk}`)
  drawText('')

  // PENGELUARAN
  drawText('PENGELUARAN:')
  let totalKeluar = 0

  pengeluaran?.forEach(p => {
    drawText(`${p.keterangan} - Rp ${p.jumlah}`)
    totalKeluar += p.jumlah
  })

  drawText(`Total Keluar: Rp ${totalKeluar}`)
  drawText('')

  drawText(`SALDO: Rp ${totalMasuk - totalKeluar}`)

  const pdfBytes = await pdfDoc.save()

  return new NextResponse(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=laporan-${tahun}.pdf`
    }
  })
}