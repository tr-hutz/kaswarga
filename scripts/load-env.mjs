// ---------------------------------------------------------------------------
// Load env files (.env.production, then .env.production.local for overrides)
// ---------------------------------------------------------------------------
import {readFileSync} from "fs";
import {resolve} from "path";

export function loadEnv(file) {
    try {
        const lines = readFileSync(resolve(process.cwd(), file), 'utf8').split('\n')
        for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || trimmed.startsWith('#')) continue
            const eq = trimmed.indexOf('=')
            if (eq === -1) continue
            const key = trimmed.slice(0, eq).trim()
            const val = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '')
            if (!process.env[key]) process.env[key] = val
        }
    } catch {
        // file not found — env vars must be set in the environment
    }
}