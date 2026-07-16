'use client'

import { useRtRegistration }    from './hooks/useRtRegistration'
import RtRegistrationView       from './RtRegistrationView'

export default function RtRegistrationContainer() {
    const state = useRtRegistration()
    return <RtRegistrationView {...state} />
}