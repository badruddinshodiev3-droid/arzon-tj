import { InstallmentApplication } from '../types';

const STORAGE_KEY = 'arzontj_financing_applications';

export function getStoredInstallmentApplications(): InstallmentApplication[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Failed to load installment applications:', err);
    return [];
  }
}

export function saveInstallmentApplication(app: InstallmentApplication): void {
  try {
    const current = getStoredInstallmentApplications();
    const updated = [app, ...current];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save installment application:', err);
  }
}

export interface FinancingCalculation {
  price: number;
  downPayment: number;
  financedAmount: number;
  durationMonths: number;
  monthlyPayment: number;
  totalRepayment: number;
}

/**
 * Calculates monthly payment estimate based on price, term, down payment, and category
 */
export function calculateFinancing(
  price: number,
  durationMonths: number,
  downPaymentPercent: number,
  isAutoLoan: boolean
): FinancingCalculation {
  const safePrice = Math.max(0, price || 0);
  const safeTerm = Math.max(1, durationMonths || 12);
  const safeDownPercent = Math.min(90, Math.max(0, downPaymentPercent || 0));

  const downPayment = Math.round((safePrice * safeDownPercent) / 100);
  const financedAmount = Math.max(0, safePrice - downPayment);

  // Installment (0% interest partner teaser) vs Auto loan (nominal estimate)
  // Auto loan calculation with standard estimated 12% - 16% annual bank rate
  let monthlyPayment = 0;
  let totalRepayment = 0;

  if (isAutoLoan) {
    const annualRate = 0.14; // Estimated 14% annual commercial rate
    const monthlyRate = annualRate / 12;
    // Standard amortization formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
    if (financedAmount > 0) {
      const factor = Math.pow(1 + monthlyRate, safeTerm);
      monthlyPayment = Math.round(financedAmount * (monthlyRate * factor) / (factor - 1));
      totalRepayment = downPayment + (monthlyPayment * safeTerm);
    }
  } else {
    // 0% - low interest installment (Рассрочка)
    if (financedAmount > 0) {
      monthlyPayment = Math.round(financedAmount / safeTerm);
      totalRepayment = safePrice;
    }
  }

  return {
    price: safePrice,
    downPayment,
    financedAmount,
    durationMonths: safeTerm,
    monthlyPayment,
    totalRepayment,
  };
}
