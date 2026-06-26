'use client'

import { useRtData }    from './hooks/useRtData'
import { useRtActions } from './hooks/useRtActions'
import RtView           from './RtView'

export default function RtContainer() {

    const { data, loading, pendingRequests, pendingLoading, refresh } = useRtData()

    const actions = useRtActions(refresh)

    return (
        <RtView
            data={data}
            loading={loading}
            pendingRequests={pendingRequests}
            pendingLoading={pendingLoading}
            refresh={refresh}
            {...actions}
        />
    )
}
