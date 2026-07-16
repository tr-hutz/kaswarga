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

            return `
                bg-emerald-100
                text-emerald-700
            `

        case 'inactive':

            return `
                bg-slate-200
                text-slate-700
            `

        default:

            return `
                bg-slate-100
                text-slate-600
            `
    }
}
