'use client'

import ActivityView
    from './ActivityView'

import {

    useActivityData

} from './hooks/useActivityData'

import {

    useActivityRealtime

} from './hooks/useActivityRealtime'

export default function ActivityContainer() {

    const {

        rows,
        loading,
        refresh

    } = useActivityData()

    useActivityRealtime({

        onReload:
        refresh
    })

    return (

        <ActivityView

            rows={rows}

            loading={loading}

        />

    )
}