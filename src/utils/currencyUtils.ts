/**
 * Currency & numerical formatting utilities
 */

export function formatCurrency(amount: number | undefined | null, decimals = 3): string {
  if (amount === undefined || amount === null || isNaN(amount) || amount === 0) {
    return '';
  }
  return Number(amount).toFixed(decimals);
}

export function parseNumberInput(val: string | number | undefined | null): number {
  if (val === undefined || val === null || val === '') return 0;
  const num = typeof val === 'number' ? val : parseFloat(val);
  return isNaN(num) ? 0 : num;
}

export function formatTotalCurrency(amount: number, decimals = 3): string {
  if (isNaN(amount)) return '0.000';
  return Number(amount).toFixed(decimals);
}
