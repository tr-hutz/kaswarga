'use client'

import {

    useContext

} from 'react'

import {

    AuthContext

} from './AuthProvider'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useAuth(): any {

    return useContext(
        AuthContext
    )
}