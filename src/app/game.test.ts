import { db } from '@/db/schema'
import { newPlayer, refreshPlayer } from './game'

beforeEach(async () => { await db.delete(); await db.open() })

test('refreshPlayer never overwrites a concurrent change to the player (#126)', async () => {
  await db.player.put(newPlayer())
  // Start a refresh, then equip a title while it is still reading the ledger.
  const refreshing = refreshPlayer()
  await db.player.update('me', { title: 'first_step', theme: 'frost' })
  await refreshing
  expect(await db.player.get('me')).toMatchObject({ title: 'first_step', theme: 'frost' })
})
