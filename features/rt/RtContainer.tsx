'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useMemo }         from 'react'
import { useTranslations } from 'next-intl'
import { useRtData }       from './hooks/useRtData'
import { useRtActions }    from './hooks/useRtActions'
import { useDataTable }    from '@/lib/hooks/useDataTable'
import { buildRtColumns }  from './components/RtColumns'
import RtView              from './RtView'

export default function RtContainer() {
    const t  = useTranslations('rt')
    const tc = useTranslations('common')

    const { query, setPage, setPageSize } = useDataTable({}, 'rt')
    const { result, loading, error, refresh } = useRtData(query)
    const actions = useRtActions(refresh)

    const columns = useMemo(
        () => buildRtColumns({
            t:        k => t(k as any),
            tc:       k => tc(k as any),
            onEdit:   actions.openEdit,
            onDelete: actions.setDelTarget,
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    )

    return (
        <RtView
            result={result}
            columns={columns}
            loading={loading}
            error={error}
            onRetry={refresh}
            query={query}
            setPage={setPage}
            setPageSize={setPageSize}
            openCreate={actions.openCreate}
            formOpen={actions.formOpen}
            selected={actions.selected}
            closeForm={actions.closeForm}
            handleSubmit={actions.handleSubmit}
            delTarget={actions.delTarget}
            setDelTarget={actions.setDelTarget}
            deleting={actions.deleting}
            handleDelete={actions.handleDelete}
        />
    )
}
