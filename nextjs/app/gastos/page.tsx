import { NumiProvider } from '@/lib/numi-context'
import { AppShell } from '@/components/app-shell'
import { GastosPage } from '@/components/gastos-page'

export default function Gastos() {
  return (
    <NumiProvider>
      <AppShell>
        <GastosPage />
      </AppShell>
    </NumiProvider>
  )
}
