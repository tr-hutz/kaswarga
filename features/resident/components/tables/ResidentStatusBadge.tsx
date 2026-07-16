import Badge from '@/components/ui/Badge'
import {
    getResidentStatusLabel,
    getResidentStatusClasses
} from '../../services/resident-status'

export default function ResidentStatusBadge({ status }: { status: string }) {
    return (
        <Badge className={getResidentStatusClasses(status)}>
            {getResidentStatusLabel(status)}
        </Badge>
    )
}
