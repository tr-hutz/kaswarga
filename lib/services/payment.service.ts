import { supabase } from '../supabase'
import { getCurrentMembership } from '../auth/getCurrentMembership'
import { logActivity } from './activity-logger'
import { transformConfirmation, transformPayment } from '../../features/payment/services/payment-transform'
import { MONTHS } from '@/lib/constants/months'
import {
    findApprovedPaymentDetails,
    findPendingConfirmationDetailsForHome,
    findRejectedConfirmationDetailsForHome,
    findPaymentsForDashboard,
    findExpensesForDashboard,
    findResidentIdsByRt,
    findPaymentsForHealth,
    findPayments,
    findConfirmations,
    findPaymentConfirmations,
    insertConfirmation,
    insertConfirmationDetails,
} from '../repositories/payment.repository'

/*
|--------------------------------------------------------------------------
| SHARED MEMBERSHIP
|--------------------------------------------------------------------------
*/

async function getMembershipContext() {

    const membership = await getCurrentMembership()

    return {
        membership,
        role:     membership?.role,
        rt:       membership?.rt,
        resident: membership?.resident
    }
}

/*
|--------------------------------------------------------------------------
| HOME PAGE
|--------------------------------------------------------------------------
*/

export async function getApprovedPayments(
    residentId: string | null | undefined,
    year: number
) {

    const { rt } = await getMembershipContext()

    return findApprovedPaymentDetails({
        rtId:       rt?.id,
        residentId: residentId ?? null,
        year
    })
}

export async function getPendingPayments(
    residentId: string | null | undefined,
    year: number
) {

    const { rt } = await getMembershipContext()

    return findPendingConfirmationDetailsForHome({
        rtId:       rt?.id,
        residentId: residentId ?? null,
        year
    })
}

export async function getRejectedPayments(
    residentId: string | null | undefined,
    year: number
) {

    const { rt } = await getMembershipContext()

    return findRejectedConfirmationDetailsForHome({
        rtId:       rt?.id,
        residentId: residentId ?? null,
        year
    })
}

/*
|--------------------------------------------------------------------------
| DASHBOARD
|--------------------------------------------------------------------------
*/

export async function getDashboardAnalytics(
    year: number
) {

    const { role, rt, resident } = await getMembershipContext()

    const [payments, expenses] = await Promise.all([
        findPaymentsForDashboard({
            year,
            rtId:    rt?.id,
            residentId: role === 'RESIDENT' ? resident?.id : null
        }),
        findExpensesForDashboard({
            year,
            rtId: rt?.id
        })
    ])

    /*
    |--------------------------------------------------------------------------
    | MONTHLY COLLECTION
    |--------------------------------------------------------------------------
    */

    const collection = MONTHS.map(month => {

        const total = payments.reduce((sum, paymentItem) => {

            const detail = paymentItem.payment_details || []

            const monthTotal = detail
                .filter(item => item.month === month.id)
                .reduce((acc, item) => acc + (item.amount || 0), 0)

            return sum + monthTotal

        }, 0)

        return {
            month: month.short,
            total
        }
    })

    /*
    |--------------------------------------------------------------------------
    | CASHFLOW
    |--------------------------------------------------------------------------
    */

    const totalIncome = payments.reduce((sum, paymentItem) => {

        const detail = paymentItem.payment_details || []

        const total = detail.reduce((acc, item) => acc + (item.amount || 0), 0)

        return sum + total

    }, 0)

    const totalExpense = expenses.reduce(
        (sum: number, item: { amount: number | null }) => sum + (item.amount || 0),
        0
    )

    return {
        collection,
        cashflow: [
            { name: 'Pemasukan',   total: totalIncome },
            { name: 'Pengeluaran', total: totalExpense }
        ]
    }
}

/*
|--------------------------------------------------------------------------
| PAYMENT HEALTH
|--------------------------------------------------------------------------
*/

export async function getPaymentHealth(
    year: number
) {

    const { role, rt, resident } = await getMembershipContext()

    const [payments, residentsData] = await Promise.all([
        findPaymentsForHealth({
            year,
            rtId:    rt?.id,
            residentId: role === 'RESIDENT' ? resident?.id : null
        }),
        findResidentIdsByRt(rt?.id)
    ])

    const totalResidents = residentsData.length

    /*
    |--------------------------------------------------------------------------
    | PAYMENT SUMMARY
    |--------------------------------------------------------------------------
    */

    const currentMonth = new Date().getMonth() + 1

    let paid = 0
    let almostPaid = 0
    let delinquent = 0
    let neverPaid = 0

    const paymentMap: Record<string, Set<number>> = {}

    payments.forEach(item => {

        if (!paymentMap[item.resident_id]) {
            paymentMap[item.resident_id] = new Set()
        }

        item.payment_details?.forEach(detail => {
            paymentMap[item.resident_id].add(detail.month)
        })
    })

    Object.values(paymentMap).forEach((monthSet: Set<number>) => {

        const paidCount = monthSet.size

        if (paidCount >= currentMonth) {
            paid++
        } else if (paidCount >= currentMonth - 2) {
            almostPaid++
        } else if (paidCount > 0) {
            delinquent++
        } else {
            neverPaid++
        }
    })

    return {
        totalResidents,
        paid,
        almostPaid,
        delinquent,
        neverPaid
    }
}

/*
|--------------------------------------------------------------------------
| PAYMENTS PAGE
|--------------------------------------------------------------------------
*/

export async function getPayments(
    year: number
) {

    const { role, rt, resident } = await getMembershipContext()

    const data = await findPayments({
        year,
        rtId:    rt?.id,
        residentId: role === 'RESIDENT' ? resident?.id : null
    })

    return transformPayment(data)
}

export async function getPendingConfirmations(
    year: number
) {
    return getConfirmations(year, 'pending')
}

export async function getRejectedConfirmations(
    year: number
) {
    return getConfirmations(year, 'rejected')
}

async function getConfirmations(
    year: number,
    status: string
) {

    const { role, rt, resident } = await getMembershipContext()

    const data = await findConfirmations({
        year,
        status,
        rtId:    rt?.id,
        residentId: role === 'RESIDENT' ? resident?.id : null
    })

    return transformConfirmation(data)
}

/*
|--------------------------------------------------------------------------
| APPROVAL ACTIONS
|--------------------------------------------------------------------------
*/

export async function approvePayment(confirmationId: string): Promise<void> {
    const res = await fetch('/api/payments/approve', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ confirmationId }),
    })
    if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: 'Failed to approve payment' }))
        throw new Error(error || 'Failed to approve payment')
    }
}

export async function rejectPayment(
    confirmationId: string,
    reason: string | null | undefined
): Promise<void> {
    const res = await fetch('/api/payments/reject', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ confirmationId, reason }),
    })
    if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: 'Failed to reject payment' }))
        throw new Error(error || 'Failed to reject payment')
    }
}

/*
|--------------------------------------------------------------------------
| SUBMIT PAYMENT CONFIRMATION
|--------------------------------------------------------------------------
*/

export async function submitPaymentConfirmation(payload: {
    residentId:  string
    rtId:        string
    year:        number
    months:      number[]
    file:        File
    monthlyFee:  number
}): Promise<void> {
    const { residentId, rtId, year, months, file, monthlyFee } = payload

    // Upload proof of payment to storage
    const ext  = file.name.split('.').pop() ?? 'jpg'
    const path = `${residentId}/${year}-${Date.now()}.${ext}`

    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-proof')
        .upload(path, file)
    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
        .from('payment-proof')
        .getPublicUrl(uploadData.path)

    // Insert confirmation header
    const totalAmount  = months.length * monthlyFee
    const confirmation = await insertConfirmation({
        resident_id:  residentId,
        rt_id:        rtId,
        year,
        total_amount: totalAmount,
        proof_url:    publicUrl,
    })

    // Insert monthly breakdown
    await insertConfirmationDetails(
        months.map(month => ({
            confirmation_id: confirmation.id,
            resident_id:     residentId,
            year,
            month,
            amount:          monthlyFee,
        }))
    )

    // Activity log (fire-and-forget)
    try {
        const membership = await getCurrentMembership()
        logActivity({
            rtId:        membership?.rt?.id,
            actorId:     membership?.user?.id,
            actorName:   membership?.user?.name,
            action:      'SUBMIT_PAYMENT',
            entityType:  'payment_confirmations',
            entityId:    confirmation.id,
            description: 'Submit payment confirmation',
            metadata:    { year, months, totalAmount, residentId },
        })
    } catch {
        // Activity log errors must not block the main flow
    }

    // Notify TREASURER so they can review the submission (server-side to bypass memberships RLS)
    try {
        await fetch('/api/payments/notify', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ confirmationId: confirmation.id }),
        })
    } catch {
        // Notification errors must not block the main flow
    }
}

export async function getPaymentConfirmations({
    year,
    status,
    search
}: {
    year?: number | null
    status?: string | null
    search?: string | null
}) {

    const { role, rt, resident } = await getMembershipContext()

    const data = await findPaymentConfirmations({
        year,
        status,
        search,
        rtId:       rt?.id,
        residentId: role === 'RESIDENT' ? resident?.id : null
    })

    return transformConfirmation(data)
}
