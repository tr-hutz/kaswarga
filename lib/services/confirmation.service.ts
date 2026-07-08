import {
    findPendingConfirmationDetails,
    findRejectedConfirmationDetails,
    callApproveKonfirmasi,
    callRejectKonfirmasi
} from '../repositories/confirmation.repository'

export async function getPendingPayments(
    residentId: string,
    year: number
) {
    return findPendingConfirmationDetails(residentId, year)
}

export async function getRejectedPayments(
    residentId: string,
    year: number
) {
    return findRejectedConfirmationDetails(residentId, year)
}

export async function approveConfirmation(
    confirmationId: string
): Promise<void> {
    return callApproveKonfirmasi(confirmationId)
}

export async function rejectConfirmation(
    confirmationId: string,
    reason: string
): Promise<void> {
    return callRejectKonfirmasi(confirmationId, reason)
}
