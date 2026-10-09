import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ChevronRight, X, Calendar, Percent, Clock, Plus, Loader2, ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { formatINR } from '@/lib/eligibility';
import { fetchUserApplications, fetchApplicationStatusHistory } from '@/lib/loanApplication';
import type { LoanApplication, ApplicationStatusHistory, ApplicationStatus } from '@/types';

const statusColors: Record<string, string> = {
  'Draft': 'border-navy-400/40',
  'Submitted': 'border-accent-500/40',
  'Received by Lender': 'border-accent-500/40',
  'Under Review': 'border-accent-500/40',
  'Additional Documents Required': 'border-orange-500/40',
  'Approved': 'border-green-500/40',
  'Rejected': 'border-red-500/40',
  'Disbursal Pending': 'border-blue-500/40',
  'Completed': 'border-green-500/40',
};

const TIMELINE_STATUSES: ApplicationStatus[] = [
  'Draft',
  'Submitted',
  'Received by Lender',
  'Under Review',
  'Additional Documents Required',
  'Approved',
  'Rejected',
];

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function Applications() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<LoanApplication | null>(null);
  const [history, setHistory] = useState<ApplicationStatusHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    const apps = await fetchUserApplications();
    setApplications(apps);
    setLoading(false);
  };

  const openDetail = async (app: LoanApplication) => {
    setSelected(app);
    setHistoryLoading(true);
    const hist = await fetchApplicationStatusHistory(app.id);
    setHistory(hist);
    setHistoryLoading(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">My Applications</h2>
          <p className="text-sm text-navy-300">Track the status of your loan applications</p>
        </div>
        <Button size="sm" onClick={() => navigate('/apply')}>
          <Plus className="h-4 w-4" /> New Application
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 border-accent-400 animate-spin" />
        </div>
      ) : applications.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-navy-600/50">
            <FileText className="h-7 w-7 text-navy-300" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">No Applications Yet</h3>
          <p className="text-sm text-navy-300 text-center mb-4">Start a new loan application to see it here.</p>
          <Button size="sm" onClick={() => navigate('/apply')}>
            <Plus className="h-4 w-4" /> Apply Now
          </Button>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden lg:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-navy-600/40">
                    <th className="text-left text-xs font-semibold text-navy-300 px-5 py-3">Application ID</th>
                    <th className="text-left text-xs font-semibold text-navy-300 px-5 py-3">Loan Type</th>
                    <th className="text-left text-xs font-semibold text-navy-300 px-5 py-3">Lender</th>
                    <th className="text-left text-xs font-semibold text-navy-300 px-5 py-3">Amount</th>
                    <th className="text-left text-xs font-semibold text-navy-300 px-5 py-3">Date</th>
                    <th className="text-left text-xs font-semibold text-navy-300 px-5 py-3">Status</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id} className="border-b border-navy-600/20 hover:bg-navy-600/20 transition-colors">
                      <td className="px-5 py-3.5 text-sm text-white font-mono">{app.id.slice(0, 8)}</td>
                      <td className="px-5 py-3.5 text-sm text-navy-100">{app.loanType}{app.subType ? ` (${app.subType})` : ''}</td>
                      <td className="px-5 py-3.5 text-sm text-navy-100">{app.lender}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-white">{formatINR(app.requestedAmount)}</td>
                      <td className="px-5 py-3.5 text-sm text-navy-300">{formatDate(app.applicationDate)}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={app.status} /></td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => openDetail(app)} className="text-accent-400 hover:text-accent-300">
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {applications.map((app) => (
              <Card key={app.id} className={`border-l-4 ${statusColors[app.status] || ''}`}>
                <CardBody className="pt-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-mono text-navy-300">{app.id.slice(0, 8)}</p>
                      <p className="text-sm font-semibold text-white mt-0.5">{app.loanType}</p>
                      <p className="text-xs text-navy-300">{app.lender}</p>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{formatINR(app.requestedAmount)}</span>
                    <Button size="sm" variant="ghost" onClick={() => openDetail(app)}>
                      View <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="text-xs text-navy-400 mt-2">{formatDate(app.applicationDate)}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setSelected(null)}>
          <Card className="w-full max-w-lg max-h-[85vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between px-5 py-4 border-b border-navy-600/40" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-base font-bold text-white">Application Details</h3>
              <button onClick={() => setSelected(null)} className="text-navy-300 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-navy-300">Application ID</p>
                  <p className="text-sm font-mono text-white">{selected.id.slice(0, 8)}</p>
                </div>
                <StatusBadge status={selected.status} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-navy-800/50 p-3">
                  <p className="text-[10px] text-navy-300">Loan Type</p>
                  <p className="text-sm font-semibold text-white">{selected.loanType}</p>
                </div>
                <div className="rounded-lg bg-navy-800/50 p-3">
                  <p className="text-[10px] text-navy-300">Lender</p>
                  <p className="text-sm font-semibold text-white">{selected.lender}</p>
                </div>
                <div className="rounded-lg bg-navy-800/50 p-3">
                  <p className="text-[10px] text-navy-300">Requested Amount</p>
                  <p className="text-sm font-semibold text-white">{formatINR(selected.requestedAmount)}</p>
                </div>
                <div className="rounded-lg bg-navy-800/50 p-3">
                  <p className="text-[10px] text-navy-300">Interest Rate</p>
                  <p className="text-sm font-semibold text-white">{selected.interestRate ? `${selected.interestRate}% p.a.` : 'To be determined'}</p>
                </div>
                <div className="rounded-lg bg-navy-800/50 p-3">
                  <p className="text-[10px] text-navy-300 flex items-center gap-1"><Calendar className="h-3 w-3" /> Date</p>
                  <p className="text-sm font-semibold text-white">{formatDate(selected.applicationDate)}</p>
                </div>
                <div className="rounded-lg bg-navy-800/50 p-3">
                  <p className="text-[10px] text-navy-300 flex items-center gap-1"><Clock className="h-3 w-3" /> Tenure</p>
                  <p className="text-sm font-semibold text-white">{selected.tenure} months</p>
                </div>
              </div>

              {selected.lenderReference && (
                <div className="rounded-lg bg-accent-500/10 border border-accent-500/20 p-3">
                  <p className="text-[10px] text-navy-300">Lender Reference Number</p>
                  <p className="text-sm font-mono font-semibold text-accent-400">{selected.lenderReference}</p>
                </div>
              )}

              {selected.purpose && (
                <div className="rounded-lg bg-navy-800/50 p-3">
                  <p className="text-[10px] text-navy-300 mb-1">Purpose</p>
                  <p className="text-xs text-white">{selected.purpose}</p>
                </div>
              )}

              {/* Timeline */}
              <div className="pt-2">
                <p className="text-xs font-semibold text-white mb-3">Status Timeline</p>
                {historyLoading ? (
                  <div className="flex items-center gap-2 text-xs text-navy-300">
                    <Loader2 className="h-3 w-3 animate-spin" /> Loading history...
                  </div>
                ) : history.length > 0 ? (
                  <div className="space-y-2">
                    {history.map((h, i) => (
                      <div key={h.id || i} className="flex items-start gap-2">
                        <div className={`h-2.5 w-2.5 rounded-full mt-1 ${i === history.length - 1 ? 'bg-accent-400' : 'bg-navy-500'}`} />
                        <div>
                          <span className="text-xs text-white">{h.status}</span>
                          {h.note && <p className="text-[10px] text-navy-400">{h.note}</p>}
                          <p className="text-[10px] text-navy-500">{formatDate(h.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {TIMELINE_STATUSES.map((s, i) => {
                      const currentIdx = TIMELINE_STATUSES.indexOf(selected.status);
                      const reached = currentIdx >= 0 && i <= currentIdx;
                      const isRejectedPath = selected.status === 'Rejected' && s === 'Rejected';
                      const isApprovedPath = selected.status === 'Approved' && s === 'Approved';
                      const show = reached || isRejectedPath || isApprovedPath;
                      return (
                        <div key={s} className="flex items-center gap-2">
                          <div className={`h-2.5 w-2.5 rounded-full ${show ? (s === 'Rejected' ? 'bg-red-400' : s === 'Approved' ? 'bg-green-400' : 'bg-accent-400') : 'bg-navy-600'}`} />
                          <span className={`text-xs ${show ? 'text-white' : 'text-navy-400'}`}>{s}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {selected.status === 'Draft' && (
                <Button className="w-full" onClick={() => navigate(`/apply?scheme=${selected.loanType}`)}>
                  Continue Application <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
