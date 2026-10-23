import { Screen } from '@/ui/Screen'
import { SystemWindow } from '@/ui/SystemWindow'
import { EmptyState } from '@/ui/feedback'

/** Unknown route. */
export function Sealed() {
  return (
    <Screen tag="SYSTEM" back>
      <SystemWindow tag="ALERT" variant="alert">
        <EmptyState message="[This sector does not exist.]" icon="lock" />
      </SystemWindow>
    </Screen>
  )
}
