import { NumiProvider } from '@/lib/numi-context'
import { AppShell } from '@/components/app-shell'
import { IngresosPage } from '@/components/ingresos-page'

export default function Ingresos() {
  return (
    <NumiProvider>
      <AppShell>
        <IngresosPage />
      </AppShell>
    </NumiProvider>
  )
}
