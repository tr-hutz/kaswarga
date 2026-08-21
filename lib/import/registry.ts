/*
 * Shared Import Framework — Definition Registry
 *
 * Maps ImportType to its domain definition.
 * The API route resolves the correct definition from the type param.
 */

import type { ImportDefinition } from './contract'
import type { ImportType }       from './types'
import { residentImportDefinition } from './definitions/resident.definition'
import { paymentImportDefinition }  from './definitions/payment.definition'
import { incomeImportDefinition }   from './definitions/income.definition'
import { expenseImportDefinition }  from './definitions/expense.definition'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const registry: Record<ImportType, ImportDefinition<any>> = {
    RESIDENT: residentImportDefinition,
    PAYMENT:  paymentImportDefinition,
    INCOME:   incomeImportDefinition,
    EXPENSE:  expenseImportDefinition,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getImportDefinition(type: ImportType): ImportDefinition<any> {
    const def = registry[type]
    if (!def) throw new Error(`No import definition registered for type: ${type}`)
    return def
}
