// @ts-nocheck
export function transformExpense(
    rows: any[] = []
) {

    return rows.map(item => {

        return {

            id:
            item.id,

            receiptNumber:
            item.receipt_number,

            category:
            item.category,

            description:
            item.description,

            amount:
                Number(
                    item.amount || 0
                ),

            recipient:
            item.recipient,

            date:
            item.date,

            dateLabel:
                new Date(
                    item.date
                ).toLocaleDateString(
                    'id-ID'
                ),

            receiptUrl:
            item.receipt_url,

            status:
            item.status || 'pending',

            createdBy:
            item.created_by,

            approvedBy:
            item.approved_by,

            approvedAt:
            item.approved_at,

            rejectionNote:
            item.rejection_note,

            active:
            item.active

        }

    })
}
