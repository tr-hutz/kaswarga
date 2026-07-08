import { getCurrentMembership } from '../auth/getCurrentMembership'
import { transformLedger } from '../../features/ledger/services/ledger-transform'
import { findLedger } from '../repositories/ledger.repository'

export async function getLedger({ search = '' }: { search?: string } = {}) {

    const membership = await getCurrentMembership()
    const rtId = membership?.rt?.id

    if (!rtId) {
        return []
    }

    const data = await findLedger({ rtId, search })

    return transformLedger(data)
}
