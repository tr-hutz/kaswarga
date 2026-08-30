'use client'

import { useState, useEffect }  from 'react'
import { useTranslations }       from 'next-intl'
import Modal                     from '@/components/ui/Modal'
import Input                     from '@/components/ui/Input'
import Textarea                  from '@/components/ui/Textarea'
import Button                    from '@/components/ui/Button'
import type { RoleRow }          from '@/lib/repositories/role.repository'

interface Props {
    open:     boolean
    target:   RoleRow | null
    saving:   boolean
    onSave:   (payload: { name: string; code: string; description: string | null }) => void
    onClose:  () => void
}

export default function RoleForm({ open, target, saving, onSave, onClose }: Props) {
    const t  = useTranslations('roles')
    const tc = useTranslations('common')

    const isEdit = !!target

    const [name,        setName]        = useState('')
    const [code,        setCode]        = useState('')
    const [description, setDescription] = useState('')
    const [nameError,   setNameError]   = useState('')
    const [codeError,   setCodeError]   = useState('')

    useEffect(() => {
        if (open) {
            setName(target?.name        ?? '')
            setCode(target?.code        ?? '')
            setDescription(target?.description ?? '')
            setNameError('')
            setCodeError('')
        }
    }, [open, target])

    function validate() {
        let ok = true
        if (!name.trim()) { setNameError(tc('form.required')); ok = false }
        else setNameError('')
        if (!isEdit && !code.trim()) { setCodeError(tc('form.required')); ok = false }
        else setCodeError('')
        return ok
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!validate()) return
        onSave({
            name:        name.trim(),
            code:        code.trim(),
            description: description.trim() || null,
        })
    }

    const title = isEdit ? t('form.editTitle') : t('form.createTitle')

    return (
        <Modal open={open} title={title} onClose={onClose} size="md">
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <Input
                    label={t('form.name')}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    error={nameError}
                    disabled={saving || (isEdit && !!target?.is_system)}
                    placeholder={t('form.namePlaceholder')}
                    autoFocus
                />
                {!isEdit && (
                    <Input
                        label={t('form.code')}
                        value={code}
                        onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))}
                        error={codeError}
                        disabled={saving}
                        placeholder={t('form.codePlaceholder')}
                        hint={t('form.codeHint')}
                    />
                )}
                {isEdit && (
                    <Input
                        label={t('form.code')}
                        value={code}
                        disabled
                        hint={t('form.codeReadonly')}
                    />
                )}
                <Textarea
                    label={t('form.description')}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    disabled={saving}
                    placeholder={t('form.descriptionPlaceholder')}
                    rows={3}
                />
                {isEdit && target?.is_system && (
                    <p className="text-xs text-warning bg-warning/10 rounded-lg px-3 py-2">
                        {t('form.systemProtected')}
                    </p>
                )}
                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={onClose} disabled={saving} className="flex-1">
                        {tc('actions.cancel')}
                    </Button>
                    <Button type="submit" loading={saving} disabled={isEdit && !!target?.is_system} className="flex-1">
                        {isEdit ? tc('actions.saveChanges') : tc('actions.save')}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
