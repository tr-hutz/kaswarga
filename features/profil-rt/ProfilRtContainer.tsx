// @ts-nocheck
'use client'

import { useProfilRt }  from './hooks/useProfilRt'
import ProfilRtView     from './ProfilRtView'

export default function ProfilRtContainer() {

    const { rt, loading, saving, handleSave } = useProfilRt()

    return (
        <ProfilRtView
            rt={rt}
            loading={loading}
            saving={saving}
            onSave={handleSave}
        />
    )
}
