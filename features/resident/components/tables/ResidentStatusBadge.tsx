// @ts-nocheck
import {

    getResidentStatusLabel,

    getResidentStatusClasses

} from '../../services/resident-status'

export default function ResidentStatusBadge({

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
                ${getResidentStatusClasses(status)}
            `}
        >

            {
                getResidentStatusLabel(
                    status
                )
            }

        </span>
    )
}