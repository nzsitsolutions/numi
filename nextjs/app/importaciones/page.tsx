import { NumiProvider } from '@/lib/numi-context'
import { AppShell } from '@/components/app-shell'
import { ImportacionesPage } from '@/components/importaciones-page'

export default function Importaciones() {
  return (
    <NumiProvider>
      <AppShell>
        <ImportacionesPage />
      </AppShell>
    </NumiProvider>
  )
}
