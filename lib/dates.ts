const DAY_MS = 24 * 60 * 60 * 1000;

function padDateNumber(value: number): string {
  return value.toString().padStart(2, '0');
}

export function formatDateKey(date: Date): string {
  return [date.getFullYear(), padDateNumber(date.getMonth() + 1), padDateNumber(date.getDate())].join('-');
}

export function parseDateKey(value: string): Date {
  const [year, month, day] = value.split('-').map((segment) => Number.parseInt(segment, 10));

  return new Date(year, month - 1, day);
}

export function toDayOrdinal(value: string): number {
  const date = parseDateKey(value);

  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);
}

export function compareDateKeys(left: string, right: string): number {
  return toDayOrdinal(left) - toDayOrdinal(right);
}

export function isConsecutiveDate(previousDate: string, currentDate: string): boolean {
  return toDayOrdinal(currentDate) - toDayOrdinal(previousDate) === 1;
}

export function clampPaydayDay(paydayDay: number): number {
  return Math.max(1, Math.min(31, Math.trunc(paydayDay)));
}

export function getDaysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function getEffectivePaydayDate(year: number, monthIndex: number, paydayDay: number): Date {
  const day = Math.min(clampPaydayDay(paydayDay), getDaysInMonth(year, monthIndex));

  return new Date(year, monthIndex, day);
}

export function getCycleStartForDate(date: Date, paydayDay: number): Date {
  const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const currentMonthPayday = getEffectivePaydayDate(
    normalizedDate.getFullYear(),
    normalizedDate.getMonth(),
    paydayDay,
  );

  if (normalizedDate >= currentMonthPayday) {
    return currentMonthPayday;
  }

  const previousMonth = new Date(normalizedDate.getFullYear(), normalizedDate.getMonth() - 1, 1);

  return getEffectivePaydayDate(previousMonth.getFullYear(), previousMonth.getMonth(), paydayDay);
}

export function getNextCycleStart(cycleStart: Date, paydayDay: number): Date {
  const nextMonth = new Date(cycleStart.getFullYear(), cycleStart.getMonth() + 1, 1);

  return getEffectivePaydayDate(nextMonth.getFullYear(), nextMonth.getMonth(), paydayDay);
}

export function getCycleEndForStart(cycleStart: Date, paydayDay: number): Date {
  const nextCycleStart = getNextCycleStart(cycleStart, paydayDay);

  return new Date(nextCycleStart.getFullYear(), nextCycleStart.getMonth(), nextCycleStart.getDate() - 1);
}

export function isDateInRange(dateKey: string, startKey: string, endKey: string): boolean {
  return compareDateKeys(dateKey, startKey) >= 0 && compareDateKeys(dateKey, endKey) <= 0;
}

export function countMonthlyCyclesBetween(startCycleDate: string, currentCycleDate: string): number {
  const start = parseDateKey(startCycleDate);
  const current = parseDateKey(currentCycleDate);

  return Math.max(
    0,
    current.getFullYear() * 12 + current.getMonth() - (start.getFullYear() * 12 + start.getMonth()),
  );
}