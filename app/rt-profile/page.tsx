import RtProfileContainer from '../../features/rt-profile/RtProfileContainer'
import PermissionGate from '@/components/ui/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions/permission-constants'

export default function Page() {
    return (
        <PermissionGate permission={PERMISSIONS.EDIT_RT_PROFILE}>
            <RtProfileContainer />
        </PermissionGate>
    )
}
