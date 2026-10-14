import type { Unit } from '../types'

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

const compactCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export function formatMoney(value: number): string {
  return currency.format(value)
}

export function formatMoneyCompact(value: number): string {
  return compactCurrency.format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

export function formatDateTime(at: number): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(at))
}

export function unitLabel(unit: Unit): string {
  if (unit === 'metre') return 'per metre'
  if (unit === 'pair') return 'per pair'
  if (unit === 'set') return 'per set'
  return 'each'
}

export function unitShort(unit: Unit): string {
  if (unit === 'metre') return 'm'
  if (unit === 'pair') return 'pr'
  if (unit === 'set') return 'set'
  return 'pc'
}
