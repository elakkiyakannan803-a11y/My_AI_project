import type { EligibilityResult } from '@/types';

export interface EligibilityInput {
  age: number;
  employmentType: string;
  monthlyIncome: number;
  existingEMI: number;
  creditScore: number;
  experience: number;
  loanCategory: string;
  requestedAmount: number;
  tenure: number;
}

export function calculateEligibility(input: EligibilityInput): EligibilityResult {
  const {
    age,
    employmentType,
    monthlyIncome,
    existingEMI,
    creditScore,
    experience,
    loanCategory,
    requestedAmount,
    tenure,
  } = input;

  const factors: EligibilityResult['factors'] = [];

  // FOIR (Fixed Obligations to Income Ratio) — typically 40-50%
  const maxFOIR = 0.5;
  const availableIncome = monthlyIncome * maxFOIR - existingEMI;

  // Base multiplier: 12x monthly available income per year of tenure (capped)
  const tenureYears = Math.min(tenure / 12, 20);
  let baseMultiplier = tenureYears * 12;

  // Employment type adjustment
  let employmentMultiplier = 1.0;
  if (employmentType === 'Salaried') employmentMultiplier = 1.1;
  else if (employmentType === 'Self Employed') employmentMultiplier = 0.95;
  else if (employmentType === 'Business Owner') employmentMultiplier = 0.9;
  else if (employmentType === 'Student') employmentMultiplier = 0.7;

  // Credit score adjustment
  let creditMultiplier = 1.0;
  if (creditScore >= 800) creditMultiplier = 1.15;
  else if (creditScore >= 750) creditMultiplier = 1.05;
  else if (creditScore >= 700) creditMultiplier = 1.0;
  else if (creditScore >= 650) creditMultiplier = 0.85;
  else if (creditScore >= 600) creditMultiplier = 0.7;
  else creditMultiplier = 0.5;

  // Experience adjustment
  let experienceMultiplier = 1.0;
  if (experience >= 5) experienceMultiplier = 1.1;
  else if (experience >= 3) experienceMultiplier = 1.05;
  else if (experience >= 1) experienceMultiplier = 1.0;
  else experienceMultiplier = 0.8;

  // Age adjustment
  let ageMultiplier = 1.0;
  if (age < 25) ageMultiplier = 0.85;
  else if (age <= 45) ageMultiplier = 1.0;
  else if (age <= 55) ageMultiplier = 0.9;
  else ageMultiplier = 0.75;

  const estimatedAmount = Math.max(
    0,
    Math.round(
      (availableIncome * baseMultiplier * employmentMultiplier * creditMultiplier * experienceMultiplier * ageMultiplier) / 100000
    ) * 100000
  );

  // Interest rate based on credit score and category
  let rateBase = 11.0;
  if (loanCategory === 'Home Loan') rateBase = 9.0;
  else if (loanCategory === 'Education Loan') rateBase = 9.5;
  else if (loanCategory === 'Vehicle Loan') rateBase = 10.0;
  else if (loanCategory === 'Business Loan') rateBase = 12.0;
  else if (loanCategory === 'Personal Loan') rateBase = 12.5;

  let rateAdjustment = 0;
  if (creditScore >= 800) rateAdjustment = -1.5;
  else if (creditScore >= 750) rateAdjustment = -0.5;
  else if (creditScore >= 700) rateAdjustment = 0;
  else if (creditScore >= 650) rateAdjustment = 1.0;
  else rateAdjustment = 2.5;

  const interestRateMin = Math.max(7.5, rateBase + rateAdjustment);
  const interestRateMax = interestRateMin + 3.5;

  // EMI calculation
  const r = (interestRateMin / 12) / 100;
  const n = tenure;
  const estimatedEMI = r === 0
    ? estimatedAmount / n
    : (estimatedAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

  // Status
  let status: EligibilityResult['status'];
  if (estimatedAmount <= 0) {
    status = 'Not Eligible';
  } else if (creditScore < 600 || availableIncome <= 0) {
    status = 'Review Required';
  } else if (requestedAmount > 0 && requestedAmount <= estimatedAmount && creditScore >= 700) {
    status = 'Potentially Eligible';
  } else if (estimatedAmount > 0) {
    status = 'Eligible';
  } else {
    status = 'Review Required';
  }

  // Factors
  factors.push({
    label: 'Monthly Income',
    status: monthlyIncome >= 25000 ? 'positive' : monthlyIncome >= 15000 ? 'warning' : 'negative',
    detail: monthlyIncome >= 25000 ? 'Good income level' : monthlyIncome >= 15000 ? 'Income may limit eligibility' : 'Income below typical minimum',
  });

  factors.push({
    label: 'Existing EMI',
    status: existingEMI === 0 ? 'positive' : existingEMI < monthlyIncome * 0.3 ? 'positive' : existingEMI < monthlyIncome * 0.4 ? 'warning' : 'negative',
    detail: existingEMI === 0 ? 'No existing obligations' : existingEMI < monthlyIncome * 0.3 ? 'Manageable obligations' : 'High EMI burden',
  });

  factors.push({
    label: 'Employment Type',
    status: employmentType === 'Salaried' ? 'positive' : employmentType === 'Self Employed' || employmentType === 'Business Owner' ? 'warning' : 'negative',
    detail: employmentType === 'Salaried' ? 'Stable employment' : 'Variable income source',
  });

  factors.push({
    label: 'Credit Score',
    status: creditScore >= 750 ? 'positive' : creditScore >= 650 ? 'warning' : 'negative',
    detail: creditScore >= 750 ? 'Excellent credit score' : creditScore >= 650 ? 'Fair credit score' : 'Low credit score',
  });

  factors.push({
    label: 'Requested Loan Amount',
    status: requestedAmount > 0 && requestedAmount <= estimatedAmount ? 'positive' : requestedAmount > estimatedAmount ? 'warning' : 'positive',
    detail: requestedAmount > 0 && requestedAmount <= estimatedAmount ? 'Within eligible range' : requestedAmount > estimatedAmount ? 'Exceeds estimated eligibility' : 'No specific amount requested',
  });

  return {
    estimatedAmount,
    interestRateMin: Math.round(interestRateMin * 10) / 10,
    interestRateMax: Math.round(interestRateMax * 10) / 10,
    estimatedEMI: Math.round(estimatedEMI),
    suggestedTenure: tenure,
    status,
    factors,
  };
}

export function calculateEMI(principal: number, annualRate: number, months: number) {
  const r = (annualRate / 12) / 100;
  if (r === 0) {
    const emi = principal / months;
    return { emi, totalInterest: 0, totalAmount: principal };
  }
  const emi = (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  const totalAmount = emi * months;
  const totalInterest = totalAmount - principal;
  return { emi, totalInterest, totalAmount };
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
