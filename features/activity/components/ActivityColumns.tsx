'use client'

import type { Column } from '@/lib/types/query'
import type { MappedActivity } from '../hooks/useActivityData'

interface Options {
    t: (key: string) => string
}

export function buildActivityColumns({ t }: Options): Column<MappedActivity>[] {
    return [
        {
            key:   'actorName',
            title: t('table.actor'),
        },
        {
            key:   'action',
            title: t('table.action'),
        },
        {
            key:   'entityType',
            title: t('table.entity'),
        },
        {
            key:   'description',
            title: t('table.description'),
        },
        {
            key:   'createdAt',
            title: t('table.time'),
            render: (row) => new Date(row.createdAt).toLocaleString('id-ID'),
        },
    ]
}
