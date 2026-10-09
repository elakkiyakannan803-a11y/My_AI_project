import { useState } from 'react';
import { Calculator, CheckCircle2, AlertTriangle, XCircle, Info, RotateCcw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Field, TextInput, SelectInput } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { useToast } from '@/lib/toast';
import { calculateEligibility, formatINR, type EligibilityInput } from '@/lib/eligibility';
import type { EligibilityResult } from '@/types';
import { loanCategories, loanPurposes, employmentTypes, cities } from '@/data/demoData';

interface FormState extends EligibilityInput {
  fullName: string;
  location: string;
  loanPurpose: string;
}

const initialForm: FormState = {
  fullName: '',
  age: 25,
  employmentType: 'Salaried',
  monthlyIncome: 0,
  existingEMI: 0,
  creditScore: 750,
  experience: 1,
  location: 'Chennai',
  loanCategory: 'Personal Loan',
  loanPurpose: 'Personal',
  requestedAmount: 500000,
  tenure: 60,
};

export default function Eligibility() {
  const { showToast } = useToast();
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<EligibilityResult | null>(null);
  const [loading, setLoading] = useState(false);

  const update = (key: keyof FormState, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName) e.fullName = 'Please enter your full name.';
    if (!form.age || form.age < 18) e.age = 'Age must be 18 or above.';
    if (!form.monthlyIncome || form.monthlyIncome <= 0) e.monthlyIncome = 'Please enter your monthly income.';
    if (form.existingEMI < 0) e.existingEMI = 'EMI cannot be negative.';
    if (!form.creditScore || form.creditScore < 300 || form.creditScore > 900) e.creditScore = 'Credit score must be between 300 and 900.';
    if (!form.requestedAmount || form.requestedAmount < 10000) e.requestedAmount = 'Minimum loan amount is ₹10,000.';
    else if (form.requestedAmount > 5000000) e.requestedAmount = 'Maximum loan amount is ₹50,00,000.';
    if (!form.tenure || form.tenure <= 0) e.tenure = 'Please enter a valid tenure.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) {
      showToast('Please fix the errors in the form.', 'error');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const res = calculateEligibility(form);
      setResult(res);
      setLoading(false);
      showToast('Eligibility estimate generated.', 'success');
    }, 800);
  };

  const reset = () => {
    setForm(initialForm);
    setResult(null);
    setErrors({});
  };

  const statusIcon = result?.status === 'Potentially Eligible' || result?.status === 'Eligible'
    ? <CheckCircle2 className="h-5 w-5 text-green-400" />
    : result?.status === 'Review Required'
    ? <AlertTriangle className="h-5 w-5 text-orange-400" />
    : <XCircle className="h-5 w-5 text-red-400" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Loan Eligibility Calculator</h2>
        <p className="text-sm text-navy-300">Fill in your details to get an estimated loan eligibility</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Your Information</CardTitle>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full Name" required error={errors.fullName}>
                  <TextInput
                    type="text"
                    value={form.fullName}
                    onChange={(e) => update('fullName', e.target.value)}
                    placeholder="John Doe"
                  />
                </Field>
                <Field label="Age" required error={errors.age}>
                  <TextInput
                    type="number"
                    value={form.age || ''}
                    onChange={(e) => update('age', parseInt(e.target.value) || 0)}
                    placeholder="25"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Employment Type" required>
                  <SelectInput value={form.employmentType} onChange={(e) => update('employmentType', e.target.value)}>
                    {employmentTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </SelectInput>
                </Field>
                <Field label="Monthly Income (₹)" required error={errors.monthlyIncome}>
                  <TextInput
                    type="number"
                    value={form.monthlyIncome || ''}
                    onChange={(e) => update('monthlyIncome', parseInt(e.target.value) || 0)}
                    placeholder="50000"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Existing Monthly EMI (₹)" error={errors.existingEMI}>
                  <TextInput
                    type="number"
                    value={form.existingEMI || ''}
                    onChange={(e) => update('existingEMI', parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </Field>
                <Field label="Credit Score (300–900)" required error={errors.creditScore}>
                  <TextInput
                    type="number"
                    value={form.creditScore || ''}
                    onChange={(e) => update('creditScore', parseInt(e.target.value) || 0)}
                    placeholder="750"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Employment Experience (years)" required>
                  <TextInput
                    type="number"
                    value={form.experience || ''}
                    onChange={(e) => update('experience', parseInt(e.target.value) || 0)}
                    placeholder="3"
                  />
                </Field>
                <Field label="Location" required>
                  <SelectInput value={form.location} onChange={(e) => update('location', e.target.value)}>
                    {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                  </SelectInput>
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Loan Category" required>
                  <SelectInput value={form.loanCategory} onChange={(e) => update('loanCategory', e.target.value)}>
                    {loanCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </SelectInput>
                </Field>
                <Field label="Loan Purpose" required>
                  <SelectInput value={form.loanPurpose} onChange={(e) => update('loanPurpose', e.target.value)}>
                    {loanPurposes.map((p) => <option key={p} value={p}>{p}</option>)}
                  </SelectInput>
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Requested Loan Amount (₹) (₹10,000 – ₹50,00,000)" required error={errors.requestedAmount}>
                  <TextInput
                    type="number"
                    min={10000}
                    max={5000000}
                    value={form.requestedAmount || ''}
                    onChange={(e) => update('requestedAmount', parseInt(e.target.value) || 0)}
                    placeholder="500000"
                  />
                </Field>
                <Field label="Loan Tenure (months)" required error={errors.tenure}>
                  <TextInput
                    type="number"
                    value={form.tenure || ''}
                    onChange={(e) => update('tenure', parseInt(e.target.value) || 0)}
                    placeholder="60"
                  />
                </Field>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" size="lg" className="flex-1" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-navy-900 border-t-transparent rounded-full animate-spin" />
                      Calculating...
                    </span>
                  ) : (
                    <>
                      <Calculator className="h-4.5 w-4.5" width={18} height={18} />
                      Check Eligibility
                    </>
                  )}
                </Button>
                {result && (
                  <Button type="button" variant="secondary" size="lg" onClick={reset}>
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </Button>
                )}
              </div>
            </form>
          </CardBody>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {result ? (
            <>
              <Card className="border-accent-500/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Eligibility Estimate</CardTitle>
                    {statusIcon}
                  </div>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-navy-300">Estimated Eligible Amount</p>
                      <p className="text-3xl font-bold text-white">{formatINR(result.estimatedAmount)}</p>
                    </div>
                    <StatusBadge status={result.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-navy-800/50 p-3">
                      <p className="text-xs text-navy-300">Interest Rate Range</p>
                      <p className="text-sm font-semibold text-white">{result.interestRateMin}% – {result.interestRateMax}% p.a.</p>
                    </div>
                    <div className="rounded-lg bg-navy-800/50 p-3">
                      <p className="text-xs text-navy-300">Estimated EMI</p>
                      <p className="text-sm font-semibold text-white">{formatINR(result.estimatedEMI)}/mo</p>
                    </div>
                    <div className="rounded-lg bg-navy-800/50 p-3">
                      <p className="text-xs text-navy-300">Suggested Tenure</p>
                      <p className="text-sm font-semibold text-white">{result.suggestedTenure} months</p>
                    </div>
                    <div className="rounded-lg bg-navy-800/50 p-3">
                      <p className="text-xs text-navy-300">Status</p>
                      <p className="text-sm font-semibold text-accent-400">{result.status}</p>
                    </div>
                  </div>

                  <p className="text-xs text-navy-300 italic">
                    "{result.status} – Subject to lender verification"
                  </p>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Eligibility Factors</CardTitle>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    {result.factors.map((factor, i) => (
                      <div key={i} className="flex items-center gap-3">
                        {factor.status === 'positive' && <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />}
                        {factor.status === 'warning' && <AlertTriangle className="h-4 w-4 text-orange-400 shrink-0" />}
                        {factor.status === 'negative' && <XCircle className="h-4 w-4 text-red-400 shrink-0" />}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">{factor.label}</p>
                          <p className="text-xs text-navy-300">{factor.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>

              <div className="rounded-xl bg-orange-500/10 border border-orange-500/30 px-4 py-3 flex gap-3">
                <Info className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
                <p className="text-xs text-orange-200">
                  This is an AI-generated estimate for informational purposes only. Final approval depends on the lender.
                </p>
              </div>

              <div className="rounded-xl bg-navy-700/40 border border-navy-500/20 px-4 py-3">
                <p className="text-xs text-navy-300">
                  LoanSure AI provides informational estimates only. Loan eligibility, interest rates and approval are determined by individual lenders based on their own policies and verification.
                </p>
              </div>
            </>
          ) : (
            <Card className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-navy-600/50">
                <Calculator className="h-8 w-8 text-navy-300" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1">No Estimate Yet</h3>
              <p className="text-sm text-navy-300 text-center max-w-xs">
                Fill in your details and click "Check Eligibility" to see your estimated loan eligibility.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
