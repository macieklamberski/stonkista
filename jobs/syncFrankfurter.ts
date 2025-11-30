import { eq, notInArray } from 'drizzle-orm'
import { currencies } from '../database/tables.ts'
import { db } from '../instances/database.ts'
import { fetchCurrencies } from '../sources/frankfurter.ts'

export const syncFrankfurter = async () => {
  const currencyList = await fetchCurrencies()

  if (currencyList.length === 0) {
    console.error('[syncFrankfurter] No currencies fetched')
    return
  }

  const codes = currencyList.map((c) => c.code)
  let inserted = 0
  let updated = 0

  for (const currency of currencyList) {
    const existing = await db.query.currencies.findFirst({
      where: eq(currencies.code, currency.code),
    })

    if (existing) {
      await db
        .update(currencies)
        .set({ name: currency.name, active: true })
        .where(eq(currencies.id, existing.id))

      updated++
    } else {
      await db.insert(currencies).values({
        code: currency.code,
        name: currency.name,
        active: true,
      })

      inserted++
    }
  }

  // Mark currencies not in list as inactive.
  await db.update(currencies).set({ active: false }).where(notInArray(currencies.code, codes))

  console.log(`[syncFrankfurter] Inserted ${inserted}, updated ${updated}`)
}
