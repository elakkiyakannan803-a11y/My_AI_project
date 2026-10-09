import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Landmark, GraduationCap, Briefcase, Wheat, Home, Car, User, Heart, ChevronDown, ChevronUp, FileText, CheckCircle2, Info, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatINR } from '@/lib/eligibility';
import { fetchSchemes } from '@/lib/loanApplication';
import type { LoanScheme } from '@/types';

const categoryIcons: Record<string, typeof GraduationCap> = {
  Education: GraduationCap,
  Business: Briefcase,
  Agriculture: Wheat,
  Housing: Home,
  Vehicle: Car,
  Personal: User,
  Health: Heart,
};

const categories = ['All', 'Education', 'Business', 'Agriculture', 'Housing', 'Vehicle', 'Personal', 'Health'];

export default function Schemes() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [schemes, setSchemes] = useState<LoanScheme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchemes().then((data) => {
      setSchemes(data);
      setLoading(false);
    });
  }, []);

  const filteredSchemes = useMemo(() => {
    if (activeCategory === 'All') return schemes;
    return schemes.filter((s) => s.category === activeCategory);
  }, [activeCategory, schemes]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Loan Schemes</h2>
        <p className="text-sm text-navy-300">Explore available loan schemes across different categories</p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-accent-500 text-navy-900'
                : 'bg-navy-700/60 text-navy-200 hover:bg-navy-600/60 border border-navy-500/30'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="rounded-xl bg-navy-700/40 border border-navy-500/20 px-4 py-3 flex gap-3">
        <Info className="h-4 w-4 text-navy-300 shrink-0 mt-0.5" />
        <p className="text-xs text-navy-300">
          Scheme information shown is demo/sample data for illustration. Please verify current rates, terms and eligibility with the respective lender or official government sources.
        </p>
      </div>

      {/* Scheme cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 border-2 border-accent-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSchemes.map((scheme) => (
            <SchemeCard
              key={scheme.id}
              scheme={scheme}
              expanded={expandedId === scheme.id}
              onToggle={() => setExpandedId(expandedId === scheme.id ? null : scheme.id)}
              onApply={() => navigate(`/apply?scheme=${scheme.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SchemeCard({ scheme, expanded, onToggle, onApply }: { scheme: LoanScheme; expanded: boolean; onToggle: () => void; onApply: () => void }) {
  const Icon = categoryIcons[scheme.category] || Landmark;

  return (
    <Card className="hover:border-accent-400/30 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-accent-500/15 text-accent-400 shrink-0">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{scheme.name}</h3>
              <Badge variant="info" className="mt-1">{scheme.category}</Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardBody className="space-y-3">
        <p className="text-sm text-navy-200">{scheme.purpose}</p>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-navy-800/50 p-3">
            <p className="text-[10px] text-navy-300">Loan Range</p>
            <p className="text-xs font-semibold text-white">{formatINR(scheme.loanRangeMin)} – {formatINR(scheme.loanRangeMax)}</p>
          </div>
          <div className="rounded-lg bg-navy-800/50 p-3">
            <p className="text-[10px] text-navy-300">Interest Rate</p>
            <p className="text-xs font-semibold text-white">{scheme.interestRate}</p>
          </div>
        </div>

        <div className="rounded-lg bg-navy-800/50 p-3">
          <p className="text-[10px] text-navy-300 mb-1">Eligible Users</p>
          <p className="text-xs text-white">{scheme.eligibleUsers}</p>
        </div>

        {expanded && (
          <div className="space-y-3 pt-2 border-t border-navy-600/30 animate-fade-in">
            <div>
              <p className="text-xs font-semibold text-white mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-400" /> Eligibility Criteria
              </p>
              <ul className="space-y-1">
                {scheme.eligibilityCriteria.map((c, i) => (
                  <li key={i} className="text-xs text-navy-200 flex items-start gap-2">
                    <span className="text-accent-400 mt-0.5">•</span> {c}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-white mb-2 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-accent-400" /> Required Documents
              </p>
              <ul className="space-y-1">
                {scheme.requiredDocuments.map((d, i) => (
                  <li key={i} className="text-xs text-navy-200 flex items-start gap-2">
                    <span className="text-accent-400 mt-0.5">•</span> {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-navy-600/30">
          <button
            onClick={onToggle}
            className="flex items-center gap-1 text-xs text-accent-400 hover:text-accent-300 font-medium"
          >
            {expanded ? (
              <><ChevronUp className="h-3.5 w-3.5" /> View Less</>
            ) : (
              <><ChevronDown className="h-3.5 w-3.5" /> View Details</>
            )}
          </button>
          <Button size="sm" onClick={onApply}>
            Apply Now <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
