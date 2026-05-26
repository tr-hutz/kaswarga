import {

    getWargaStatusLabel,

    getWargaStatusClasses

} from '../../services/warga-status'

export default function WargaStatusBadge({

                                             status

                                         }) {

    return (

        <span
            className={`
                inline-flex
                items-center
                px-3
                py-1
                rounded-full
                text-xs
                font-medium
                ${getWargaStatusClasses(status)}
            `}
        >

            {
                getWargaStatusLabel(
                    status
                )
            }

        </span>
    )
}