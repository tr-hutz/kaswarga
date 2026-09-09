import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { version } = require('./package.json') as { version: string }

const withNextIntl = createNextIntlPlugin('./lib/internationalization.ts')

const nextConfig: NextConfig = {
    env: {
        NEXT_PUBLIC_APP_VERSION: version,
    },
}

export default withNextIntl(nextConfig)
