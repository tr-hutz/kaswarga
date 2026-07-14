import ResidentContainer from '../../features/resident/ResidentContainer'
import PermissionGate from '@/components/ui/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions/permission-constants'

export default function Page() {
    return (
        <PermissionGate permission={PERMISSIONS.VIEW_RESIDENTS}>
            <ResidentContainer />
        </PermissionGate>
    )
}
