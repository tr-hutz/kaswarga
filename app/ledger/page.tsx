import LedgerContainer from '../../features/ledger/LedgerContainer'
import PermissionGate from '@/components/ui/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions/permission-constants'

export default function LedgerPage() {
    return (
        <PermissionGate permission={PERMISSIONS.VIEW_LEDGER}>
            <LedgerContainer />
        </PermissionGate>
    )
}
