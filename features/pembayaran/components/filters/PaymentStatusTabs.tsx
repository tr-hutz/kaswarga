// @ts-nocheck
'use client'

const tabs = [

    {
        key: 'pending',
        label: 'Pending'
    },

    {
        key: 'approved',
        label: 'Approved'
    },

    {
        key: 'rejected',
        label: 'Rejected'
    }
]

export default function PaymentStatusTabs({

                                              status,
                                              setStatus

                                          }) {
    return (

        <div
            className="
        flex
        gap-2
      "
        >
            {tabs.map(tab => (

                <button
                    key={tab.key}
                    onClick={() =>
                        setStatus(tab.key)
                    }
                    className={`
            px-4
            py-2
            rounded-xl
            border

            ${
                        status === tab.key
                            ? 'bg-black text-white'
                            : 'bg-white'
                    }
          `}
                >
                    {tab.label}
                </button>

            ))}

        </div>
    )
}