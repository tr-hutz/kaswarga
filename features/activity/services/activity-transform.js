export function transformActivity(

    rows = []

) {

    return rows.map(row => ({

        id:
        row.id,

        actorName:
            row.actor_name || 'System',

        action:
        row.action,

        entityType:
        row.entity_type,

        entityId:
        row.entity_id,

        description:
        row.description,

        metadata:
            row.metadata || {},

        createdAt:
        row.created_at
    }))
}