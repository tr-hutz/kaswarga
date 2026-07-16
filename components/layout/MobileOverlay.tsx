'use client'

export default function MobileOverlay({

                                          open,
                                          onClose

                                      }: {
    open: boolean
    onClose: () => void
}) {

    if (!open) {

        return null
    }

    return (

        <div
            className="
                fixed
                inset-0
                bg-black/30
                z-40
                xl:hidden
            "

            onClick={onClose}
        />
    )
}