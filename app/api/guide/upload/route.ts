import { NextResponse }      from 'next/server'
import { getRequestContext } from '@/lib/auth/server'
import { UnauthorizedError } from '@/lib/auth/errors'
import { supabaseAdmin }     from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const BUCKET           = 'guide-assets'
const MAX_SIZE_BYTES   = 10 * 1024 * 1024
const ALLOWED_TYPES    = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']

export async function POST(req: Request) {
    try {
        await getRequestContext()

        const formData = await req.formData()
        const file     = formData.get('file') as File | null
        if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
        }
        if (file.size > MAX_SIZE_BYTES) {
            return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 })
        }

        const ext      = file.name.split('.').pop() ?? 'bin'
        const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
        const buffer   = Buffer.from(await file.arrayBuffer())

        const { error: uploadErr } = await supabaseAdmin.storage
            .from(BUCKET)
            .upload(filename, buffer, { contentType: file.type, upsert: false })

        if (uploadErr) {
            console.error('[POST /api/guide/upload]', uploadErr)
            return NextResponse.json({ error: uploadErr.message }, { status: 500 })
        }

        const { data: { publicUrl } } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filename)

        return NextResponse.json({ url: publicUrl, filename })
    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        console.error('[POST /api/guide/upload]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
