import { notFound } from 'next/navigation'
import { Suspense }  from 'react'
import DataTableFixture from './DataTableFixture'

// Only available outside production

export const dynamic = 'force-static'
export default function Page() {
    if (process.env.NODE_ENV === 'production') notFound()
    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <Suspense>
                <DataTableFixture />
            </Suspense>
        </div>
    )
}
