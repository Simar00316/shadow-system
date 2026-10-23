import { db } from '@/db/schema'
import { foodFromOff, itemFrom, lookupBarcode, normalizeBarcode, totals } from './diet'

beforeEach(async () => { await db.delete(); await db.open() })

test('UPC-A is normalised to EAN-13', () => {
  expect(normalizeBarcode('012345678905')).toBe('0012345678905')
  expect(normalizeBarcode('3017620422003')).toBe('3017620422003')
  expect(normalizeBarcode(' 3017-6204 22003 ')).toBe('3017620422003')
})

test('Open Food Facts mapping uses per-100 g kcal; incomplete products are flagged', () => {
  const f = foodFromOff('123', { product_name: 'Oats', brands: 'Acme, Other', serving_quantity: '40', nutriments: { 'energy-kcal_100g': 380, proteins_100g: 13, carbohydrates_100g: 60, fat_100g: 7, fiber_100g: 10 } })
  expect(f).toMatchObject({ id: 'off-123', name: 'Oats', brand: 'Acme', k: 380, p: 13, unit: { serving: 40 } })
  expect(foodFromOff('9', { product_name: 'Mystery', nutriments: { 'energy-kcal_100g': 100 } })).toEqual({ incomplete: true, name: 'Mystery' })
  expect(foodFromOff('9', { nutriments: { energy_100g: 418.4, proteins_100g: 1, carbohydrates_100g: 1, fat_100g: 1 } })).toMatchObject({ k: 100, name: 'Product 9' })
})

test('barcode lookup caches results for offline use and handles errors', async () => {
  const json = { status: 1, product: { product_name: 'Milk', nutriments: { 'energy-kcal_100g': 64, proteins_100g: 3.3, carbohydrates_100g: 4.8, fat_100g: 3.6 } } }
  const fetcher = vi.fn(async () => new Response(JSON.stringify(json), { status: 200 })) as unknown as typeof fetch
  const a = await lookupBarcode('012345678905', fetcher)
  expect(a).toMatchObject({ name: 'Milk', barcode: '0012345678905' })
  const b = await lookupBarcode('012345678905', fetcher)
  expect(b).toMatchObject({ name: 'Milk' })
  expect(fetcher).toHaveBeenCalledTimes(1)
  expect(await lookupBarcode('111', (async () => new Response('', { status: 404 })) as unknown as typeof fetch)).toEqual({ notFound: true })
  expect(await lookupBarcode('222', (async () => new Response(JSON.stringify({ status: 0 }), { status: 200 })) as unknown as typeof fetch)).toEqual({ notFound: true })
  expect(await lookupBarcode('333', (async () => { throw new TypeError('offline') }) as unknown as typeof fetch)).toEqual({ offline: true })
})

test('item and day totals', () => {
  const i = itemFrom({ id: 'x', name: 'Rice', k: 130, p: 2.7, c: 28, f: 0.3 }, 200)
  expect(i).toEqual({ ref: 'x', name: 'Rice', grams: 200, k: 260, p: 5.4, c: 56, f: 0.6 })
  expect(totals([{ items: [i, i] }])).toEqual({ k: 520, p: 11, c: 112, f: 1 })
})
