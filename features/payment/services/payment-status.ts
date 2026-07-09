// @ts-nocheck
export function getStatusClass(
    status
) {

    switch (status) {

        case 'approved':

            return `
                bg-emerald-100
                text-emerald-700
            `

        case 'pending':

            return `
                bg-amber-100
                text-amber-700
            `

        case 'rejected':

            return `
                bg-red-100
                text-red-700
            `

        default:

            return `
                bg-slate-100
                text-slate-700
            `
    }
}

export function isPending(
    status
) {

    return (
        status === 'pending'
    )
}