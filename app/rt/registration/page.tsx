import RtRegistrationContainer from '../../../features/rt-registration/RtRegistrationContainer'
import PermissionGate from '@/components/ui/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions/permission-constants'

export default function Page() {
    return (
        <PermissionGate permission={PERMISSIONS.MANAGE_RT}>
            <RtRegistrationContainer />
        </PermissionGate>
    )
}
