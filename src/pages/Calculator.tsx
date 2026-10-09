import { useState, useMemo } from 'react';
import { Calculator, RotateCcw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Field, TextInput } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { calculateEMI, formatINR } from '@/lib/eligibility';
import { PrincipalInterestChart } from '@/components/charts/Charts';

export default function LoanCalculator() {
  const [amount, setAmount] = useState(500000);
  const [rate, setRate] = useState(10.5);
  const [tenure, setTenure] = useState(60);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const result = useMemo(() => {
    if (amount > 0 && rate >= 0 && tenure > 0) {
      return calculateEMI(amount, rate, tenure);
    }
    return null;
  }, [amount, rate, tenure]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!amount || amount < 10000) e.amount = 'Minimum loan amount is ₹10,000.';
    else if (amount > 5000000) e.amount = 'Maximum loan amount is ₹50,00,000.';
    if (rate < 0 || rate > 30) e.rate = 'Interest rate must be between 0 and 30%.';
    if (!tenure || tenure <= 0) e.tenure = 'Please enter a valid tenure.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCalculate = (ev: React.FormEvent) => {
    ev.preventDefault();
    validate();
  };

  const reset = () => {
    setAmount(500000);
    setRate(10.5);
    setTenure(60);
    setErrors({});
  };

  const chartData = result
    ? [
        { name: 'Principal', value: amount },
        { name: 'Interest', value: Math.round(result.totalInterest) },
      ]
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">EMI Calculator</h2>
        <p className="text-sm text-navy-300">Calculate your monthly EMI and total payment breakdown</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <Card>
          <CardHeader>
            <CardTitle>Loan Details</CardTitle>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleCalculate} className="space-y-5">
              <Field label="Loan Amount (₹) (₹10,000 – ₹50,00,000)" required error={errors.amount}>
                <TextInput
                  type="number"
                  min={10000}
                  max={5000000}
                  value={amount || ''}
                  onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                  placeholder="500000"
                />
              </Field>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-navy-100">Interest Rate (% p.a.)</label>
                  <span className="text-sm font-semibold text-accent-400">{rate}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="25"
                  step="0.1"
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-navy-600 accent-accent-500"
                />
                <div className="flex justify-between text-[10px] text-navy-400 mt-1">
                  <span>1%</span><span>25%</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-navy-100">Tenure (months)</label>
                  <span className="text-sm font-semibold text-accent-400">{tenure} months</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="360"
                  step="6"
                  value={tenure}
                  onChange={(e) => setTenure(parseInt(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-navy-600 accent-accent-500"
                />
                <div className="flex justify-between text-[10px] text-navy-400 mt-1">
                  <span>6 mo</span><span>360 mo (30 yr)</span>
                </div>
              </div>

              <Field label="Or enter tenure directly (months)" error={errors.tenure}>
                <TextInput
                  type="number"
                  value={tenure || ''}
                  onChange={(e) => setTenure(parseInt(e.target.value) || 0)}
                  placeholder="60"
                />
              </Field>

              <div className="flex gap-3 pt-2">
                <Button type="submit" size="lg" className="flex-1">
                  <Calculator className="h-4.5 w-4.5" width={18} height={18} />
                  Calculate
                </Button>
                <Button type="button" variant="secondary" size="lg" onClick={reset}>
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {result && (
            <>
              <Card className="border-accent-500/30">
                <CardHeader>
                  <CardTitle>Calculation Results</CardTitle>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div className="text-center py-4">
                    <p className="text-xs text-navy-300 mb-1">Monthly EMI</p>
                    <p className="text-4xl font-bold text-accent-400">{formatINR(Math.round(result.emi))}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div className="rounded-lg bg-navy-800/50 p-4 flex items-center justify-between">
                      <span className="text-sm text-navy-300">Principal Amount</span>
                      <span className="text-sm font-semibold text-white">{formatINR(amount)}</span>
                    </div>
                    <div className="rounded-lg bg-navy-800/50 p-4 flex items-center justify-between">
                      <span className="text-sm text-navy-300">Total Interest</span>
                      <span className="text-sm font-semibold text-orange-400">{formatINR(Math.round(result.totalInterest))}</span>
                    </div>
                    <div className="rounded-lg bg-accent-500/10 border border-accent-500/30 p-4 flex items-center justify-between">
                      <span className="text-sm text-white font-medium">Total Amount Payable</span>
                      <span className="text-sm font-bold text-accent-400">{formatINR(Math.round(result.totalAmount))}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Principal vs Interest</CardTitle>
                </CardHeader>
                <CardBody>
                  <PrincipalInterestChart data={chartData} />
                </CardBody>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
