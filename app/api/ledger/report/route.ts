/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse }      from 'next/server'
import { cookies }            from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin }      from '../../../../lib/supabase-admin'
import { monthList, formatMonths, formatAccounting } from '../../../../lib/utils'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL      || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

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
    const m = new Date(r.date).getMonth() + 1
    if (!map[m]) map[m] = []
    map[m].push(r)
  })
  return map
}

export async function GET(req: Request) {
  const cookieStore  = await cookies()
  const serverClient = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} }
  })

  const { data: authData, error: authError } = await serverClient.auth.getUser()
  if (authError || !authData?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: membership, error: membershipError } = await supabaseAdmin
    .from('memberships')
    .select('role')
    .eq('user_id', authData.user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (membershipError || !membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!['CHAIR', 'TREASURER'].includes(membership.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const yearParam = searchParams.get('year') || String(new Date().getFullYear())
  const year = yearParam

  const start = `${year}-01-01`
  const end = `${parseInt(year) + 1}-01-01`

  const { data: rt } = await supabaseAdmin
    .from('rt')
    .select('*')
    .limit(1)
    .single()

  const { data: members } = await supabaseAdmin
    .from('memberships')
    .select('role, user:users(name)')
    .eq('rt_id', rt?.id ?? '')
    .in('role', ['ADMIN', 'TREASURER'])

  const chairmanName =
    members?.find(m => m.role === 'ADMIN')
      ?.user?.name || '-'

  const treasurerName =
    members?.find(m => m.role === 'TREASURER')
      ?.user?.name || '-'

  const { data: incomeRows } = await supabaseAdmin
    .from('payment_details')
    .select(`month, amount, payments!inner(date, rt_id, resident_id, residents(name, block, house_number))`)
    .eq('year', parseInt(year))
    .eq('payments.rt_id', rt?.id ?? '')
    .gte('payments.date', start)
    .lt('payments.date', end)

  const { data: expenseRows } = await supabaseAdmin
    .from('expenses')
    .select('*')
    .eq('rt_id', rt?.id ?? '')
    .gte('date', start)
    .lt('date', end)

  const totalIncome  = (incomeRows  || []).reduce((a, b) => a + (b.amount || 0), 0)
  const totalExpense = (expenseRows || []).reduce((a, b) => a + (b.amount || 0), 0)
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
  if (rt?.logo_url) {
    try {
      const res = await fetch(rt.logo_url)
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

    page.drawText(rt?.name || '-', {
      x: infoX, y: topY, size: 12, font: bold
    })
    page.drawText(`RT ${rt?.code || '-'}`, {
      x: infoX, y: topY - 15, size: 10, font
    })
    page.drawText(rt?.address || '-', {
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
    drawTextRight(rt?.bank_name || '-', COL_RIGHT, sY - 16)

    page.drawText('No. Rek', { x: rightX, y: sY - 32, size: 10, font })
    drawTextRight(maskAccountNumber(rt?.account_number ?? null), COL_RIGHT, sY - 32)

    page.drawText('A.n', { x: rightX, y: sY - 48, size: 10, font })
    drawTextRight(rt?.account_holder || '-', COL_RIGHT, sY - 48)

    y -= 70
    drawDivider(y + 10)
    y -= 8
  }

  // ===== income =====
  const drawIncome = () => {
    ensureSpace(24)
    page.drawText('PEMASUKAN', { x: leftX, y, size: 12, font: bold })
    y -= 18

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const byMonth = groupByMonth((incomeRows as any[]) || [])

    Object.keys(byMonth)
      .sort((a, b) => Number(a) - Number(b))
      .forEach((m) => {
        const monthName = monthList.find(b => b.id === Number(m))?.name

        const rows = (byMonth as Record<string, any[]>)[m]
          .sort((a: any, b: any) => new Date(a.payments?.date).getTime() - new Date(b.payments?.date).getTime())

        const monthTotal = rows.reduce(
          (sum: any, r: any) => sum + (r.amount || 0), 0
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

          const tgl = new Date(p.payments?.date).getDate()
          const resident = p.payments?.residents
          page.drawText(String(tgl), { x: 50, y, size: 9, font })
          page.drawText(
            `${resident?.name || '-'} (${resident?.block || '-'}-${resident?.house_number || '-'})`,
            { x: 90, y, size: 9, font }
          )
          page.drawText(formatMonths([p.month]), { x: 320, y, size: 9, font })
          drawTextRight(formatAccounting(p.amount), COL_RIGHT, y)
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
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())

        const monthTotal = rows.reduce(
          (sum: any, r: any) => sum + (r.amount || 0), 0
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

          const tgl = new Date(p.date).getDate()
          page.drawText(String(tgl), { x: 50, y, size: 9, font })
          page.drawText(p.category || '-', { x: 90, y, size: 9, font })
          page.drawText(p.description || '-', { x: 260, y, size: 9, font })
          drawTextRight(formatAccounting(p.amount), COL_RIGHT, y)
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

  const rtSlug = (rt?.code || rt?.name || 'rt')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')

  const filename = `kas-report-${year}-${rtSlug}.pdf`

  return new NextResponse(pdfBytes as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  })
}
