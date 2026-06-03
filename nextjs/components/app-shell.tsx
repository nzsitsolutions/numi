'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Receipt, 
  ArrowDownToLine, 
  CreditCard, 
  Landmark, 
  FileDown,
  Menu,
  X,
  RefreshCw,
  Zap,
  LogOut,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useNumi } from '@/lib/numi-context'
import { formatArs, getMonthName } from '@/lib/format'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle } from '@/components/theme-toggle'
import { useState, useCallback } from 'react'
import { fetchLiveRates, LiveRate } from '@/lib/api'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/gastos', label: 'Gastos', icon: Receipt },
  { href: '/ingresos', label: 'Ingresos', icon: ArrowDownToLine },
  { href: '/tarjetas', label: 'Tarjetas', icon: CreditCard },
  { href: '/deudas', label: 'Deudas', icon: Landmark },
  { href: '/importaciones', label: 'Importaciones', icon: FileDown },
]

const RATE_LABELS: Record<string, { label: string; color: string }> = {
  oficial: { label: 'Oficial', color: 'text-muted-foreground' },
  blue:    { label: 'Blue',    color: 'text-blue-600 dark:text-blue-400' },
  tarjeta: { label: 'Tarjeta', color: 'text-orange-600 dark:text-orange-400' },
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { period, updateExchangeRate, isLoading } = useNumi()
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [rateValue, setRateValue] = useState(period.exchangeRate.toString())
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [liveRates, setLiveRates] = useState<LiveRate[]>([])
  const [fetchingLive, setFetchingLive] = useState(false)
  const [liveError, setLiveError] = useState(false)

  const refreshLiveRates = useCallback(async () => {
    setFetchingLive(true)
    setLiveError(false)
    try {
      const rates = await fetchLiveRates()
      setLiveRates(rates)
    } catch {
      setLiveError(true)
    } finally {
      setFetchingLive(false)
    }
  }, [])

  const handlePopoverOpen = (open: boolean) => {
    setPopoverOpen(open)
    if (open) {
      setRateValue(period.exchangeRate.toString())
      if (liveRates.length === 0) refreshLiveRates()
    }
  }

  const handleApplyRate = (venta: number) => {
    updateExchangeRate(venta)
    setRateValue(venta.toString())
    setPopoverOpen(false)
  }

  const handleManualSubmit = () => {
    const newRate = parseFloat(rateValue)
    if (!isNaN(newRate) && newRate > 0) {
      updateExchangeRate(newRate)
    }
    setPopoverOpen(false)
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:sticky lg:top-0 lg:h-screen w-64 border-r border-border flex-col bg-card flex-shrink-0 overflow-hidden">
        <div className="p-6 border-b border-border flex-shrink-0">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground font-bold text-lg">n</span>
            </div>
            <span className="text-xl font-semibold text-foreground">numi</span>
          </Link>
        </div>
        
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto min-h-0">
          {navItems.map(item => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative',
                  isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                {isActive && (
                  <span className="absolute left-0 inset-y-1.5 w-0.5 bg-primary rounded-full" />
                )}
                <item.icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-primary' : '')} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-border flex-shrink-0 space-y-3">
          {user?.email && (
            <p className="text-xs text-muted-foreground truncate px-1" title={user.email}>
              {user.email}
            </p>
          )}
          <div className="flex items-center justify-between gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={async () => {
                await signOut()
                router.replace('/login')
                router.refresh()
              }}
            >
              <LogOut className="h-4 w-4 mr-1" />
              Salir
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border safe-area-inset-bottom">
        <nav className="flex justify-around py-1 px-2">
          {navItems.slice(0, 5).map(item => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-medium transition-all duration-150 rounded-lg min-w-0',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <div className={cn(
                  'p-1 rounded-lg transition-colors',
                  isActive ? 'bg-primary/10' : ''
                )}>
                  <item.icon className="h-5 w-5" />
                </div>
                <span className="truncate max-w-[56px]">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">n</span>
                </div>
                <span className="text-lg font-semibold text-foreground">numi</span>
              </Link>
            </div>

            {/* Period Label */}
            <span className="text-sm font-semibold text-foreground capitalize">
              {getMonthName(period.month)} {period.year}
            </span>

            {/* Exchange Rate & Theme */}
            <div className="flex items-center gap-3">
              <Popover open={popoverOpen} onOpenChange={handlePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-mono tabular-nums gap-1.5"
                  >
                    <Zap className="h-3 w-3 text-blue-500" />
                    USD {formatArs(period.exchangeRate)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0 overflow-hidden" align="end">
                  {/* Live rates section */}
                  <div className="p-3 space-y-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Cotización en vivo
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={refreshLiveRates}
                        disabled={fetchingLive}
                      >
                        <RefreshCw className={cn('h-3 w-3', fetchingLive && 'animate-spin')} />
                      </Button>
                    </div>

                    {liveError && (
                      <p className="text-xs text-destructive py-1">
                        Sin conexión a dolarapi.com
                      </p>
                    )}

                    {fetchingLive && liveRates.length === 0 ? (
                      <div className="space-y-1.5">
                        {[1,2,3].map(i => <Skeleton key={i} className="h-8 rounded-md" />)}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {liveRates.map(rate => {
                          const meta = RATE_LABELS[rate.casa] ?? { label: rate.nombre, color: 'text-foreground' }
                          const isActive = Math.round(period.exchangeRate) === Math.round(rate.venta)
                          return (
                            <button
                              key={rate.casa}
                              onClick={() => handleApplyRate(rate.venta)}
                              className={cn(
                                'w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm transition-colors',
                                isActive
                                  ? 'bg-primary/10 ring-1 ring-primary/30'
                                  : 'hover:bg-secondary'
                              )}
                            >
                              <span className={cn('font-medium', meta.color)}>{meta.label}</span>
                              <span className="font-mono tabular-nums text-foreground">
                                {formatArs(rate.venta)}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Manual input */}
                  <div className="p-3 space-y-2">
                    <span className="text-xs text-muted-foreground">O ingresá manualmente</span>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={rateValue}
                        onChange={(e) => setRateValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                        className="h-8 text-sm font-mono flex-1"
                        placeholder="1420"
                      />
                      <Button size="sm" className="h-8 px-3" onClick={handleManualSubmit}>
                        OK
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <div className="hidden lg:block">
                <ThemeToggle />
              </div>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-8 w-8"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-border bg-card p-4 space-y-2">
              {navItems.map(item => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-muted-foreground hover:bg-secondary'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
              <div className="pt-2 border-t border-border">
                <ThemeToggle />
              </div>
            </div>
          )}
        </header>

        {/* Page Content */}
        <main className="flex-1 pb-20 lg:pb-0">
          {isLoading ? (
            <div className="p-4 lg:p-8 space-y-6">
              <Skeleton className="h-8 w-48" />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-xl" />
                ))}
              </div>
              <div className="grid lg:grid-cols-2 gap-6">
                <Skeleton className="h-64 rounded-xl" />
                <Skeleton className="h-64 rounded-xl" />
              </div>
            </div>
          ) : children}
        </main>
      </div>
    </div>
  )
}
