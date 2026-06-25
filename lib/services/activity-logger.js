import { createActivity } from './activity.service'

export function logActivity(params) {
    createActivity(params).catch(err =>
        console.error('[Activity]', err)
    )
}
