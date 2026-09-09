const raw = process.env.NEXT_PUBLIC_APP_VERSION ?? ''

export const APP_VERSION  = raw
export const versionLabel = raw ? `v${raw}` : null
