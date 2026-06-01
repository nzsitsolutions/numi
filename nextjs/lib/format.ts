// Utility functions for numi

/**
 * Format number as Argentine pesos
 */
export function formatArs(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('ARS', '$')
}

/**
 * Format number as US dollars
 */
export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace('USD', 'US$')
}

/**
 * Format with both currencies
 */
export function formatDual(usd: number, exchangeRate: number): string {
  const ars = usd * exchangeRate
  return `${formatUsd(usd)}  ≈ ${formatArs(ars)}`
}

/**
 * Get month name in Spanish
 */
export function getMonthName(month: number): string {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  return months[month - 1] || ''
}

/**
 * Format period display
 */
export function formatPeriod(month: number, year: number): string {
  return `${getMonthName(month)} ${year}`
}

/**
 * Calculate installment progress percentage
 */
export function calculateProgress(paid: number, total: number): number {
  if (total === 0) return 100
  return Math.round((paid / total) * 100)
}

/**
 * Format date to locale string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
  })
}

/**
 * Get ordinal day suffix
 */
export function getOrdinalDay(day: number): string {
  return `${day}`
}
