// @ts-nocheck
export function mapExpense(rows: unknown[] = []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (rows as any[]).map(item => ({
        id:            item.id,
        receiptNumber: item.receipt_number,
        category:      item.category,
        description:   item.description,
        amount:        Number(item.amount || 0),
        recipient:     item.recipient,
        date:          item.date,
        dateLabel:     new Date(item.date).toLocaleDateString('id-ID'),
        receiptUrl:    item.receipt_url,
        status:        item.status || 'pending',
        createdBy:     item.created_by,
        approvedBy:    item.approved_by,
        approvedAt:    item.approved_at,
        rejectionNote: item.rejection_note,
        active:        item.active
    }))
}
