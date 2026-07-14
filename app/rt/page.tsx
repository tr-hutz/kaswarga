import RtContainer from '../../features/rt/RtContainer'
import PermissionGate from '@/components/ui/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions/permission-constants'

export default function Page() {
    return (
        <PermissionGate permission={PERMISSIONS.MANAGE_RT}>
            <RtContainer />
        </PermissionGate>
    )
}
