export function getResidentStatus(

    resident: { active?: boolean } | null | undefined

) {

    if (!resident) {
        return 'inactive'
    }

    return resident.active
        ? 'active'
        : 'inactive'
}

export function getResidentStatusLabel(
    status: string
) {

    switch (status) {

        case 'active':
            return 'Active'

        case 'inactive':
            return 'Inactive'

        default:
            return '-'
    }
}

export function getResidentStatusClasses(
    status: string
) {

    switch (status) {

        case 'active':
            return 'bg-success/10 text-success'

        case 'inactive':
            return 'bg-canvas text-muted'

        default:
            return 'bg-canvas text-muted'
    }
}
