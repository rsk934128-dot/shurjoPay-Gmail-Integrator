/**
 * Formats a number as a currency string.
 * @param amount The numerical amount to format
 * @param currency The currency code (default: BDT)
 * @returns A formatted string with currency symbol and separators
 */
export const formatCurrency = (amount: number, currency: string = 'BDT'): string => {
  try {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback if Intl fails
    return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  }
};
