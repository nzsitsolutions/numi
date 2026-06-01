import { NumiProvider } from '@/lib/numi-context'
import { AppShell } from '@/components/app-shell'
import { DeudasPage } from '@/components/deudas-page'

export default function Deudas() {
  return (
    <NumiProvider>
      <AppShell>
        <DeudasPage />
      </AppShell>
    </NumiProvider>
  )
}
