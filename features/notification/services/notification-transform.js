import {

    formatDistanceToNow

} from 'date-fns'

import {
    id
} from 'date-fns/locale'

export function transformNotifications(

    rows = []

) {

    return rows.map(item => ({

        id:
        item.id,

        type:
        item.type,

        title:
            item.title || '-',

        message:
            item.message || '-',

        entityType:
        item.entity_type,

        entityId:
        item.entity_id,

        isRead:
            item.is_read || false,

        createdAt:
        item.created_at,

        timeLabel:
            formatDistanceToNow(

                new Date(
                    item.created_at
                ),

                {

                    addSuffix: true,

                    locale: id

                }

            )

    }))
}