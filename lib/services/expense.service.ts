import { getCurrentMembership } from '../auth/getCurrentMembership'
import { logActivity } from './activity-logger'
import { transformExpense } from '../../features/expense/services/expense-transform'
import {
    findExpenses,
    countExpensesByDateRange,
    findExpenseSnapshot,
    insertExpense,
    updateExpenseById
} from '../repositories/expense.repository'

/*
|------------------------------------------------------------------
| GENERATE RECEIPT NUMBER
|------------------------------------------------------------------
*/

export async function generateNomorBukti() {

    const membership = await getCurrentMembership()
    const rtId  = membership?.rt?.id
    const code  = membership?.rt?.code || 'RT'

    const now  = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

    const startOfMonth    = new Date(year, month - 1, 1).toISOString()
    const startOfNextMonth = new Date(year, month, 1).toISOString()

    const count = await countExpensesByDateRange(rtId ?? '', startOfMonth, startOfNextMonth)

    const seq    = count + 1
    const dd     = String(now.getDate()).padStart(2, '0')
    const mm     = String(month).padStart(2, '0')
    const seqStr = String(seq).padStart(5, '0')

    return `${dd}${mm}${year}-${code}-${seqStr}`
}

/*
|------------------------------------------------------------------
| GET
|------------------------------------------------------------------
*/

export async function getExpenses({
    category,
    search
}: {
    category?: string | null
    search?: string | null
} = {}) {

    const membership = await getCurrentMembership()
    const rtId = membership?.rt?.id

    const data = await findExpenses({ rtId, category, search })

    return transformExpense(data)
}

/*
|------------------------------------------------------------------
| CREATE
|------------------------------------------------------------------
*/

interface ExpensePayload {
    receiptNumber?: string | null
    category: string
    description: string
    amount: number
    recipient?: string | null
    date: string
    receiptUrl?: string | null
}

export async function createExpense(
    payload: ExpensePayload
) {

    const membership = await getCurrentMembership()
    const rtId = membership?.rt?.id

    const data = await insertExpense({
        receipt_number: payload.receiptNumber || null,
        category:       payload.category,
        description:    payload.description,
        amount:         payload.amount,
        recipient:      payload.recipient || null,
        date:           payload.date,
        receipt_url:    payload.receiptUrl || null,
        created_by:     membership?.user?.id || null,
        rt_id:          rtId ?? ''
    })

    logActivity({
        rtId:       membership?.rt?.id,
        actorId:    membership?.user?.id,
        actorName:  membership?.user?.name,
        action:     'CREATE_EXPENSE',
        entityType: 'expenses',
        entityId:   data.id,
        description: `Create expense: ${data.description}`,
        metadata:   {
            category:    data.category,
            description: data.description,
            amount:      data.amount,
            date:        data.date
        }
    })

    // Notify all CHAIR in the RT via API route (uses supabaseAdmin to bypass RLS)
    fetch('/api/expenses/notify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
            expenseId:     data.id,
            rtId:          rtId ?? '',
            receiptNumber: data.receipt_number ?? null,
        }),
    }).catch(err => console.error('[Expense Notify]', err))

    return data
}

/*
|------------------------------------------------------------------
| UPDATE
|------------------------------------------------------------------
*/

export async function updateExpense(
    id: string,
    payload: ExpensePayload
) {

    const membership = await getCurrentMembership()

    const before = await findExpenseSnapshot(id)

    const data = await updateExpenseById(id, {
        receipt_number: payload.receiptNumber || null,
        category:       payload.category,
        description:    payload.description,
        amount:         payload.amount,
        recipient:      payload.recipient || null,
        date:           payload.date,
        receipt_url:    payload.receiptUrl || null,
        updated_at:     new Date().toISOString(),
        updated_by:     membership?.user?.id ?? null
    })

    logActivity({
        rtId:       membership?.rt?.id,
        actorId:    membership?.user?.id,
        actorName:  membership?.user?.name,
        action:     'UPDATE_EXPENSE',
        entityType: 'expenses',
        entityId:   id,
        description: `Update expense: ${data.description}`,
        metadata:   {
            before: {
                category:    before?.category,
                description: before?.description,
                amount:      before?.amount,
                date:        before?.date
            },
            after: {
                category:    data.category,
                description: data.description,
                amount:      data.amount,
                date:        data.date
            }
        }
    })

    return data
}

/*
|------------------------------------------------------------------
| DELETE
|------------------------------------------------------------------
*/

export async function deleteExpense(
    id: string
): Promise<true> {

    const membership = await getCurrentMembership()

    const before = await findExpenseSnapshot(id)

    await updateExpenseById(id, {
        deleted_at: new Date().toISOString(),
        deleted_by: membership?.user?.id ?? null,
        active:     false
    })

    logActivity({
        rtId:       membership?.rt?.id,
        actorId:    membership?.user?.id,
        actorName:  membership?.user?.name,
        action:     'DELETE_EXPENSE',
        entityType: 'expenses',
        entityId:   id,
        description: `Delete expense: ${before?.description}`,
        metadata:   {
            category:    before?.category,
            description: before?.description,
            amount:      before?.amount,
            date:        before?.date
        }
    })

    return true
}
