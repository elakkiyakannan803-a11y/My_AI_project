import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  Landmark,
  MapPin,
  FileText,
  TrendingUp,
  ArrowRight,
  Calculator,
  Bot,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatINR } from '@/lib/eligibility';
import {
  EligibilityOverviewChart,
  IncomeVsEMIChart,
  ApplicationStatusChart,
  CategoryDistributionChart,
} from '@/components/charts/Charts';
import { demoApplications, demoSchemes, demoBanks } from '@/data/demoData';

const summaryCards = [
  {
    label: 'Eligible Loan Schemes',
    value: '7 Schemes',
    icon: Landmark,
    color: 'from-green-500/20 to-green-700/10',
    iconColor: 'text-green-400',
    route: '/schemes',
  },
  {
    label: 'Nearby Banks',
    value: '12 Banks',
    icon: MapPin,
    color: 'from-blue-500/20 to-blue-700/10',
    iconColor: 'text-blue-400',
    route: '/banks',
  },
];

const eligibilityData = [
  { name: 'Income Factor', value: 85, fill: '#06b6d4' },
  { name: 'Credit Score', value: 78, fill: '#22d3ee' },
  { name: 'Employment', value: 72, fill: '#67e8f9' },
  { name: 'Experience', value: 68, fill: '#0e7490' },
];

const incomeVsEMI = [
  { month: 'Apr', income: 65000, emi: 12000 },
  { month: 'May', income: 65000, emi: 12000 },
  { month: 'Jun', income: 68000, emi: 12000 },
  { month: 'Jul', income: 68000, emi: 15000 },
  { month: 'Aug', income: 70000, emi: 15000 },
  { month: 'Sep', income: 70000, emi: 15000 },
];

const applicationStatusData = [
  { status: 'Draft', count: 1 },
  { status: 'Submitted', count: 1 },
  { status: 'Review', count: 1 },
  { status: 'Docs Req.', count: 1 },
  { status: 'Approved', count: 1 },
];

const categoryData = [
  { name: 'Personal', value: 35 },
  { name: 'Home', value: 25 },
  { name: 'Education', value: 15 },
  { name: 'Vehicle', value: 15 },
  { name: 'Business', value: 10 },
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              onClick={() => navigate(card.route)}
              className={`text-left rounded-xl bg-gradient-to-br ${card.color} bg-navy-700/60 border border-navy-500/30 p-5 hover:border-accent-400/40 transition-all hover:scale-[1.02] active:scale-[0.98]`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-lg bg-navy-800/60 ${card.iconColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-navy-400 group-hover:text-accent-400" />
              </div>
              <p className="text-2xl font-bold text-white">{card.value}</p>
              <p className="text-xs text-navy-300 mt-1">{card.label}</p>
            </button>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="hover:border-accent-400/40 transition-colors cursor-pointer">
          <CardBody className="flex items-center gap-4 pt-5">
            <div className="p-3 rounded-lg bg-accent-500/15 text-accent-400">
              <Calculator className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-white">Check Eligibility</h3>
              <p className="text-xs text-navy-300">Estimate your loan eligibility</p>
            </div>
            <Button size="sm" onClick={() => navigate('/eligibility')}>Go</Button>
          </CardBody>
        </Card>
        <Card className="hover:border-accent-400/40 transition-colors cursor-pointer">
          <CardBody className="flex items-center gap-4 pt-5">
            <div className="p-3 rounded-lg bg-green-500/15 text-green-400">
              <MapPin className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-white">Find Banks</h3>
              <p className="text-xs text-navy-300">Discover nearby lenders</p>
            </div>
            <Button size="sm" onClick={() => navigate('/banks')}>Go</Button>
          </CardBody>
        </Card>
        <Card className="hover:border-accent-400/40 transition-colors cursor-pointer">
          <CardBody className="flex items-center gap-4 pt-5">
            <div className="p-3 rounded-lg bg-blue-500/15 text-blue-400">
              <Bot className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-white">AI Assistant</h3>
              <p className="text-xs text-navy-300">Get loan guidance</p>
            </div>
            <Button size="sm" onClick={() => navigate('/assistant')}>Go</Button>
          </CardBody>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Loan Eligibility Overview</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent-400" />
            </div>
          </CardHeader>
          <CardBody>
            <EligibilityOverviewChart data={eligibilityData} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Monthly Income vs EMI</CardTitle>
              <Wallet className="h-4 w-4 text-accent-400" />
            </div>
          </CardHeader>
          <CardBody>
            <IncomeVsEMIChart data={incomeVsEMI} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Loan Application Status</CardTitle>
              <FileText className="h-4 w-4 text-accent-400" />
            </div>
          </CardHeader>
          <CardBody>
            <ApplicationStatusChart data={applicationStatusData} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Loan Category Distribution</CardTitle>
              <Landmark className="h-4 w-4 text-accent-400" />
            </div>
          </CardHeader>
          <CardBody>
            <CategoryDistributionChart data={categoryData} />
          </CardBody>
        </Card>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Applications</CardTitle>
              <button onClick={() => navigate('/applications')} className="text-xs text-accent-400 hover:text-accent-300">
                View all
              </button>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {demoApplications.slice(0, 3).map((app) => (
                <div key={app.id} className="flex items-center justify-between py-2 border-b border-navy-600/30 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-white">{app.loanType}</p>
                    <p className="text-xs text-navy-300">{app.lender} · {app.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{formatINR(app.requestedAmount)}</p>
                    <p className="text-xs text-navy-300">{app.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recommended Schemes</CardTitle>
              <button onClick={() => navigate('/schemes')} className="text-xs text-accent-400 hover:text-accent-300">
                View all
              </button>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {demoSchemes.slice(0, 3).map((scheme) => (
                <div key={scheme.id} className="flex items-center justify-between py-2 border-b border-navy-600/30 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-white">{scheme.name}</p>
                    <p className="text-xs text-navy-300">{scheme.category} · {scheme.interestRate}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => navigate('/schemes')}>View</Button>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Disclaimer */}
      <div className="rounded-xl bg-navy-700/40 border border-navy-500/20 px-4 py-3">
        <p className="text-xs text-navy-300">
          LoanSure AI provides informational estimates only. Loan eligibility, interest rates and approval are determined by individual lenders based on their own policies and verification.
        </p>
      </div>
    </div>
  );
}
