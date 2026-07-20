export function getStatusClass(
    status: string
) {

    switch (status) {

        case 'approved':
            return 'bg-success/10 text-success'

        case 'pending':
            return 'bg-warning/10 text-warning'

        case 'rejected':
            return 'bg-danger/10 text-danger'

        default:
            return 'bg-canvas text-muted'
    }
}

export function isPending(
    status: string
) {

    return (
        status === 'pending'
    )
}
