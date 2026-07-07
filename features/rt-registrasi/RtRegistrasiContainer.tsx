// @ts-nocheck
'use client'

import { useRtRegistrasi }    from './hooks/useRtRegistrasi'
import RtRegistrasiView       from './RtRegistrasiView'

export default function RtRegistrasiContainer() {
    const state = useRtRegistrasi()
    return <RtRegistrasiView {...state} />
}