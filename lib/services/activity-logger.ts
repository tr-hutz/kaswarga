import { createActivity } from './activity.service'
import type { ActivityParams } from './activity.service'

export function logActivity(params: ActivityParams): void {
    createActivity(params).catch(err =>
        console.error('[Activity]', err)
    )
}
