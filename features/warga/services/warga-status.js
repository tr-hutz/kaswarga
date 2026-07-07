export function getResidentStatus(

    warga

) {

    if (!warga) {
        return 'inactive'
    }

    return warga.aktif
        ? 'active'
        : 'inactive'
}

export function getResidentStatusLabel(
    status
) {

    switch (status) {

        case 'active':
            return 'Aktif'

        case 'inactive':
            return 'Nonaktif'

        default:
            return '-'
    }
}

export function getResidentStatusClasses(
    status
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