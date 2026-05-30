'use client'

import {

    hasPermission

} from './permissions'

import {

    useAuth

} from '../auth/useAuth'

export function usePermission(

    permission

) {

    const {

        membership

    } = useAuth()

    return hasPermission(

        membership?.role,

        permission
    )
}