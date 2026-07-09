// @ts-nocheck
'use client'

import { useRtProfile }  from './hooks/useRtProfile'
import RtProfileView     from './ProfilRtView'

export default function RtProfileContainer() {

    const { rt, loading, saving, handleSave } = useRtProfile()

    return (
        <RtProfileView
            rt={rt}
            loading={loading}
            saving={saving}
            onSave={handleSave}
        />
    )
}
