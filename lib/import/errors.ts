/*
 * Shared Import Framework — Error Types
 */

export class ImportNotFoundError extends Error {
    constructor(jobId: string) {
        super(`Import job not found: ${jobId}`)
        this.name = 'ImportNotFoundError'
    }
}

export class ImportStatusError extends Error {
    constructor(jobId: string, expected: string, actual: string) {
        super(`Import job ${jobId}: expected status ${expected}, got ${actual}`)
        this.name = 'ImportStatusError'
    }
}

export class ImportPermissionError extends Error {
    constructor(action: string) {
        super(`Insufficient permissions for import action: ${action}`)
        this.name = 'ImportPermissionError'
    }
}
