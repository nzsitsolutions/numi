import { NumiProvider } from '@/lib/numi-context'
import { AppShell } from '@/components/app-shell'
import { Dashboard } from '@/components/dashboard'

export default function Home() {
  return (
    <NumiProvider>
      <AppShell>
        <Dashboard />
      </AppShell>
    </NumiProvider>
  )
}
