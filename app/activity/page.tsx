import ActivityContainer from '../../features/activity/ActivityContainer'
import PermissionGate from '@/components/ui/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions/permission-constants'

export default function Page() {
    return (
        <PermissionGate permission={PERMISSIONS.VIEW_ACTIVITY}>
            <ActivityContainer />
        </PermissionGate>
    )
}
