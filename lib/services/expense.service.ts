import {
    supabase
} from '../supabase'

import {
    getCurrentMembership
} from '../auth/getCurrentMembership'

import {
    logActivity
} from './activity-logger'

import {
    transformExpense
} from '../../features/expense/services/expense-transform'

import {
    applyExpenseFilters
} from '../helpers/filter-pengeluaran'

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

    const { count } = await supabase
        .from('expenses')
        .select('*', { count: 'exact', head: true })
        .eq('rt_id', rtId ?? '')
        .gte('created_at', startOfMonth)
        .lt('created_at', startOfNextMonth)

    const seq   = (count || 0) + 1
    const dd    = String(now.getDate()).padStart(2, '0')
    const mm    = String(month).padStart(2, '0')
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

    /*
     |-------------------------------------------------------------
     | MEMBERSHIP
     |-------------------------------------------------------------
     */

    const membership =
        await getCurrentMembership()

    const rtId =
        membership?.rt?.id

    /*
     |-------------------------------------------------------------
     | QUERY
     |-------------------------------------------------------------
     */

    let query =
        supabase

            .from('expenses')

            .select(`

        id,
        receipt_number,
        category,
        description,
        amount,
        recipient,
        date,

        receipt_url,
        status,
        created_by,
        approved_by,
        approved_at,
        rejection_note,

        rt_id

      `)

            .order(
                'date',
                {
                    ascending: false
                }
            )

    /*
     |-------------------------------------------------------------
     | FILTERS
     |-------------------------------------------------------------
     */

    query =
        applyExpenseFilters(

            query,

            {

                rtId,
                category,
                search

            }

        )

    /*
     |-------------------------------------------------------------
     | EXECUTE
     |-------------------------------------------------------------
     */

    const {
        data,
        error
    } = await query

    if (error) {
        throw error
    }

    return transformExpense(
        data || []
    )
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

    const membership =
        await getCurrentMembership()

    const rtId =
        membership?.rt?.id

    const {

        data,
        error

    } = await supabase

        .from('expenses')

        .insert({

            receipt_number:
            payload.receiptNumber || null,

            category:
            payload.category,

            description:
            payload.description,

            amount:
            payload.amount,

            recipient:
            payload.recipient || null,

            date:
            payload.date,

            receipt_url:
            payload.receiptUrl || null,

            created_by:
            membership?.user?.id || null,

            rt_id:
            rtId ?? ''

        })

        .select()

        .single()

    if (error) {
        throw error
    }

    logActivity({
        rtId:       membership?.rt?.id,
        actorId:    membership?.user?.id,
        actorName:  membership?.user?.name,
        action:     'CREATE_EXPENSE',
        entityType: 'expenses',
        entityId:   data.id,
        description: `Tambah pengeluaran: ${data.description}`,
        metadata:   {
            category:    data.category,
            description: data.description,
            amount:      data.amount,
            date:        data.date
        }
    })

    // Notify all CHAIR in the RT
    try {
        const { data: chairList } = await supabase
            .from('memberships')
            .select('user_id')
            .eq('rt_id', rtId ?? '')
            .eq('role', 'CHAIR')
            .eq('status', 'active')

        if (chairList?.length) {
            const notifRows = chairList.map(k => ({
                rt_id:          rtId ?? '',
                type:           'expense_pending',
                title:          'Pengeluaran Baru',
                message:        `Pengeluaran ${data.receipt_number || ''} perlu persetujuan Anda`,
                entity_type:    'expenses',
                entity_id:      data.id,
                target_user_id: k.user_id,
            }))
            await supabase.from('notifications').insert(notifRows)
        }
    } catch {
        // Notification errors must not block the main flow
    }

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

    const membership =
        await getCurrentMembership()

    const { data: before } =
        await supabase
            .from('expenses')
            .select('category, description, amount, date')
            .eq('id', id)
            .single()

    const {

        data,
        error

    } = await supabase

        .from('expenses')

        .update({

            receipt_number:
            payload.receiptNumber || null,

            category:
            payload.category,

            description:
            payload.description,

            amount:
            payload.amount,

            recipient:
            payload.recipient || null,

            date:
            payload.date,

            receipt_url:
            payload.receiptUrl || null

        })

        .eq(
            'id',
            id
        )

        .select()

        .single()

    if (error) {
        throw error
    }

    logActivity({
        rtId:       membership?.rt?.id,
        actorId:    membership?.user?.id,
        actorName:  membership?.user?.name,
        action:     'UPDATE_EXPENSE',
        entityType: 'expenses',
        entityId:   id,
        description: `Update pengeluaran: ${data.description}`,
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

    const membership =
        await getCurrentMembership()

    const { data: before } =
        await supabase
            .from('expenses')
            .select('category, description, amount, date')
            .eq('id', id)
            .single()

    const {

        error

    } = await supabase

        .from('expenses')

        .delete()

        .eq(
            'id',
            id
        )

    if (error) {
        throw error
    }

    logActivity({
        rtId:       membership?.rt?.id,
        actorId:    membership?.user?.id,
        actorName:  membership?.user?.name,
        action:     'DELETE_EXPENSE',
        entityType: 'expenses',
        entityId:   id,
        description: `Hapus pengeluaran: ${before?.description}`,
        metadata:   {
            category:    before?.category,
            description: before?.description,
            amount:      before?.amount,
            date:        before?.date
        }
    })

    return true
}
