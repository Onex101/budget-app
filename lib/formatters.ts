import { parseDateKey } from '@/lib/dates';

const currencyFormatter = new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: 'ZAR',
  maximumFractionDigits: 2,
});

function ordinalSuffix(day: number): string {
  const remainder = day % 100;

  if (remainder >= 11 && remainder <= 13) {
    return 'th';
  }

  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatHours(value: number): string {
  if (value >= 10) {
    return `${value.toFixed(0)} hrs`;
  }

  if (value >= 1) {
    return `${value.toFixed(1)} hrs`;
  }

  return `${value.toFixed(2)} hrs`;
}

export function formatFriendlyDate(dateKey: string): string {
  const date = parseDateKey(dateKey);

  return date.toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatCycleRange(startDate: string, endDate: string): string {
  return `${formatFriendlyDate(startDate)} - ${formatFriendlyDate(endDate)}`;
}

export function formatPayday(day: number): string {
  return `${day}${ordinalSuffix(day)} of each month`;
}