import { NumiProvider } from '@/lib/numi-context'
import { AppShell } from '@/components/app-shell'
import { TarjetasPage } from '@/components/tarjetas-page'

export default function Tarjetas() {
  return (
    <NumiProvider>
      <AppShell>
        <TarjetasPage />
      </AppShell>
    </NumiProvider>
  )
}
