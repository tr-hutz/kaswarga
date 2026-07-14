import UsersContainer from '../../features/users/UsersContainer'
import PermissionGate from '@/components/ui/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions/permission-constants'

export default function Page() {
    return (
        <PermissionGate permission={PERMISSIONS.MANAGE_USERS}>
            <UsersContainer />
        </PermissionGate>
    )
}
